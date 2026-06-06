import React, { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Text, Badge, Button, Flex, Select, TextArea, Label, Box } from '@sanity/ui'
import { Shield } from 'lucide-react'
import {
  PanelShell,
  PanelBadge,
  PanelLoading,
  PanelEmpty,
  PanelError,
  ConfirmDialog,
  formatTimeAgo,
  reportTypeTone,
  handleKeyboardActivate,
} from './shared'

/**
 * Creates a `moderationActivity` document in Sanity to record a studio moderation event.
 *
 * The created document includes the provided activity fields plus `source: 'studio'` and a current ISO `timestamp`.
 *
 * @param activity - Details of the moderation activity:
 *   - `type`: Activity type (e.g., `'warning_sent'`, `'comment_deleted'`).
 *   - `userId`: Identifier of the user related to the activity.
 *   - `userName`: Display name of the user related to the activity.
 *   - `reason`: Human-readable reason for the activity.
 *   - `severity`: One of `'low' | 'medium' | 'high' | 'critical'`.
 *   - `itemId` (optional): Identifier of the affected item (comment, report, etc.).
 *   - `itemType` (optional): Type of the affected item (e.g., `'comment'`, `'report'`).
 */
async function logStudioActivity(
  client: ReturnType<typeof useClient>,
  activity: {
    type: string
    userId: string
    userName: string
    reason: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    itemId?: string
    itemType?: string
  }
) {
  await client.create({
    _type: 'moderationActivity',
    ...activity,
    source: 'studio',
    timestamp: new Date().toISOString(),
  })
}

interface ReportItem {
  _id: string
  reportedType: string
  reason: string
  status: string
  timestamp: string
  adminNotes?: string
  reportedRef?: { _id: string; title?: string; text?: string; name?: string; username?: string }
  reportedBy?: { _id: string; name?: string; username?: string }
}

const BAN_DURATIONS = [
  { value: '1h', title: '1 Hour' },
  { value: '24h', title: '24 Hours' },
  { value: '7d', title: '7 Days' },
  { value: '365d', title: '1 Year' },
  { value: 'perm', title: 'Permanent' },
]

type ConfirmAction = 'ban' | 'delete' | null

export const ReportReviewPanel = () => {
  const client = useClient({ apiVersion: '2025-01-02' })
  const [reports, setReports] = useState<ReportItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [banDuration, setBanDuration] = useState('24h')
  const [adminNotes, setAdminNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await client.fetch<ReportItem[]>(`
        *[_type == "report" && status == "pending"] | order(timestamp desc)[0...50] {
          _id,
          reportedType,
          reason,
          status,
          timestamp,
          adminNotes,
          "reportedRef": reportedRef->{
            _id,
            title,
            text,
            name,
            username
          },
          "reportedBy": reportedBy->{ _id, name, username }
        }
      `)
      setReports(data)
      setSelectedId((prev) => {
        if (prev && data.some((r) => r._id === prev)) return prev
        return data.length > 0 ? data[0]._id : null
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load pending reports')
    } finally {
      setIsLoading(false)
    }
  }, [client])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const selected = reports.find((r) => r._id === selectedId) ?? null

  const resolveReportedUserId = (): string | null => {
    if (!selected) return null
    if (selected.reportedType === 'user') return selected.reportedRef?._id ?? null
    return null
  }

  const handleDismiss = async () => {
    if (!selected) return
    setIsActing(true)
    setError(null)
    try {
      await client
        .patch(selected._id)
        .set({
          status: 'reviewed',
          adminNotes: adminNotes || 'Dismissed without action',
        })
        .commit()
      await logStudioActivity(client, {
        type: 'warning_sent',
        userId: selected.reportedBy?._id || 'unknown',
        userName: selected.reportedBy?.name || selected.reportedBy?.username || 'Reporter',
        reason: `Report dismissed: ${selected.reason}`,
        severity: 'low',
        itemId: selected._id,
        itemType: 'report',
      })
      setAdminNotes('')
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss report')
    } finally {
      setIsActing(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!selected || selected.reportedType !== 'comment' || !selected.reportedRef?._id) return
    setIsActing(true)
    setError(null)
    try {
      await client.patch(selected.reportedRef._id).set({ deleted: true }).commit()
      await client
        .patch(selected._id)
        .set({
          status: 'action-taken',
          deleteComment: true,
          adminNotes: adminNotes || 'Comment soft-deleted',
        })
        .commit()
      await logStudioActivity(client, {
        type: 'comment_deleted',
        userId: selected.reportedRef._id,
        userName: selected.reportedRef.name || selected.reportedRef.username || 'Comment author',
        reason: adminNotes || selected.reason,
        severity: 'medium',
        itemId: selected.reportedRef._id,
        itemType: 'comment',
      })
      setAdminNotes('')
      setConfirmAction(null)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setIsActing(false)
    }
  }

  const handleBanUser = async () => {
    const userId = resolveReportedUserId()
    if (!selected || !userId) {
      setError('Ban is only available for user reports with a valid author reference')
      return
    }
    setIsActing(true)
    setError(null)
    try {
      const response = await fetch('/api/reports/apply-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportedUserId: userId,
          banDuration,
          reason: adminNotes || selected.reason,
          reportId: selected._id,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to apply ban')
      }
      setAdminNotes('')
      setConfirmAction(null)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user')
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return <PanelLoading message="Loading pending reports..." />
  }

  return (
    <>
      <PanelShell
        icon={<Shield style={{ width: 32, height: 32 }} />}
        title="Report Triage"
        subtitle="Review pending reports and take moderation actions"
        badges={
          <PanelBadge tone={reports.length > 0 ? 'caution' : 'positive'}>
            {reports.length} pending
          </PanelBadge>
        }
        onRefresh={loadReports}
      >
        {error && <PanelError message={error} onRetry={loadReports} />}

        {reports.length === 0 ? (
          <PanelEmpty
            tone="positive"
            title="Queue is clear"
            description="No pending reports awaiting review."
          />
        ) : (
          <Flex gap={4} wrap="wrap" align="flex-start">
            <Card
              padding={3}
              radius={3}
              shadow={2}
              style={{ minWidth: 280, flex: 1, maxHeight: '70vh', overflowY: 'auto' }}
            >
              <Stack space={2}>
                <Text size={1} weight="semibold" muted>Pending Reports</Text>
                {reports.map((report) => (
                  <Card
                    key={report._id}
                    padding={3}
                    radius={2}
                    shadow={1}
                    tone={selectedId === report._id ? 'primary' : 'default'}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedId === report._id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(report._id)}
                    onKeyDown={(event) =>
                      handleKeyboardActivate(event, () => setSelectedId(report._id))
                    }
                  >
                    <Stack space={2}>
                      <Flex gap={2} align="center" wrap="wrap">
                        <Badge tone={reportTypeTone(report.reportedType)}>
                          {report.reportedType}
                        </Badge>
                        <Text size={0} muted>{formatTimeAgo(report.timestamp)}</Text>
                      </Flex>
                      <Text size={1}>{report.reason.slice(0, 100)}</Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Card>

            {selected && (
              <Card
                padding={5}
                radius={3}
                shadow={2}
                style={{ minWidth: 320, flex: 2, position: 'sticky', top: 0 }}
              >
                <Stack space={4}>
                  <Stack space={2}>
                    <Text size={2} weight="semibold">Report Details</Text>
                    <Badge tone={reportTypeTone(selected.reportedType)}>
                      {selected.reportedType}
                    </Badge>
                  </Stack>

                  <Stack space={3}>
                    <Box>
                      <Label size={0} muted>Reason</Label>
                      <Text size={1}>{selected.reason}</Text>
                    </Box>
                    <Box>
                      <Label size={0} muted>Reporter</Label>
                      <Text size={1}>
                        {selected.reportedBy?.name || selected.reportedBy?.username || 'Unknown'}
                      </Text>
                    </Box>
                    <Box>
                      <Label size={0} muted>Submitted</Label>
                      <Text size={1}>{formatTimeAgo(selected.timestamp)}</Text>
                    </Box>
                  </Stack>

                  {selected.reportedRef && (
                    <Card padding={4} radius={2} tone="caution">
                      <Stack space={2}>
                        <Text size={1} weight="semibold">Reported Content</Text>
                        <Text size={1}>
                          {selected.reportedRef.title ||
                            selected.reportedRef.text ||
                            selected.reportedRef.name ||
                            selected.reportedRef._id}
                        </Text>
                      </Stack>
                    </Card>
                  )}

                  <Stack space={2}>
                    <Label size={1} htmlFor="admin-notes">Admin Notes</Label>
                    <TextArea
                      id="admin-notes"
                      rows={3}
                      placeholder="Add notes about your decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes((e.target as HTMLTextAreaElement).value)}
                    />
                  </Stack>

                  {selected.reportedType === 'user' && (
                    <Stack space={2}>
                      <Label size={1}>Ban Duration</Label>
                      <Select
                        value={banDuration}
                        onChange={(e) => setBanDuration((e.currentTarget as HTMLSelectElement).value)}
                      >
                        {BAN_DURATIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.title}</option>
                        ))}
                      </Select>
                    </Stack>
                  )}

                  <Flex gap={2} wrap="wrap">
                    <Button
                      mode="ghost"
                      text="Dismiss"
                      disabled={isActing}
                      onClick={handleDismiss}
                    />
                    {selected.reportedType === 'comment' && (
                      <Button
                        mode="default"
                        tone="caution"
                        text="Delete Comment"
                        disabled={isActing}
                        onClick={() => setConfirmAction('delete')}
                      />
                    )}
                    {selected.reportedType === 'user' && (
                      <Button
                        mode="default"
                        tone="critical"
                        text="Ban User"
                        disabled={isActing}
                        onClick={() => setConfirmAction('ban')}
                      />
                    )}
                  </Flex>
                </Stack>
              </Card>
            )}
          </Flex>
        )}
      </PanelShell>

      <ConfirmDialog
        open={confirmAction === 'ban'}
        title="Ban User"
        description={`Are you sure you want to ban this user for ${BAN_DURATIONS.find((d) => d.value === banDuration)?.title ?? banDuration}? This action will update their strike count.`}
        confirmLabel="Ban User"
        confirmTone="critical"
        isLoading={isActing}
        onConfirm={handleBanUser}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'delete'}
        title="Delete Comment"
        description="This will soft-delete the reported comment. The action cannot be easily undone from this panel."
        confirmLabel="Delete Comment"
        confirmTone="caution"
        isLoading={isActing}
        onConfirm={handleDeleteComment}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  )
}
