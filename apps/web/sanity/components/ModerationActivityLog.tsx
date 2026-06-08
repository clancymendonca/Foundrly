import React, { useState, useEffect, useCallback } from 'react'
import { Card, Stack, Text, Badge, Button, Flex, Select } from '@sanity/ui'
import { Activity, Download, Filter } from 'lucide-react'
import {
  getModerationActivity,
  type ModerationActivity,
  type ModerationActivityFilters,
} from '../lib/moderation-queries'
import {
  PanelLoading,
  PanelEmpty,
  PanelError,
  ActivityRow,
  SectionCard,
} from './shared'

type DateRange = '24h' | '7d' | '30d' | 'all'

const PAGE_SIZE = 50

const ACTIVITY_TYPES: { value: string; title: string }[] = [
  { value: '', title: 'All types' },
  { value: 'message_deleted', title: 'Message deleted' },
  { value: 'user_banned', title: 'User banned' },
  { value: 'warning_sent', title: 'Warning sent' },
  { value: 'report_created', title: 'Report created' },
  { value: 'comment_deleted', title: 'Comment deleted' },
  { value: 'startup_banned', title: 'Startup banned' },
]

const SEVERITIES: { value: string; title: string }[] = [
  { value: '', title: 'All severities' },
  { value: 'low', title: 'Low' },
  { value: 'medium', title: 'Medium' },
  { value: 'high', title: 'High' },
  { value: 'critical', title: 'Critical' },
]

/**
 * Compute the ISO timestamp marking the lower bound for the given date range.
 *
 * @param range - One of '24h', '7d', '30d', or 'all' indicating the desired period
 * @returns An ISO 8601 timestamp representing the time `range` hours ago, or `undefined` when `range` is `'all'`
 */
function getSinceDate(range: DateRange): string | undefined {
  if (range === 'all') return undefined
  const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function sanitizeCsvCell(value: string): string {
  let cell = value.replace(/"/g, '""')
  if (/^[=+\-@]/.test(cell)) {
    cell = `'${cell}`
  }
  return `"${cell}"`
}

/**
 * Export the provided moderation activities as a CSV file and initiate download with a date-stamped filename.
 *
 * All cells are quoted and sanitized to prevent formula injection in spreadsheet apps.
 *
 * @param activities - Array of moderation activity objects to include in the exported CSV
 */
function exportToCsv(activities: ModerationActivity[]) {
  const headers = ['Timestamp', 'Type', 'User', 'Reason', 'Severity', 'Item Type', 'Item ID']
  const rows = activities.map((a) => [
    sanitizeCsvCell(a.timestamp),
    sanitizeCsvCell(a.type),
    sanitizeCsvCell(a.userName),
    sanitizeCsvCell(a.reason),
    sanitizeCsvCell(a.severity),
    sanitizeCsvCell(a.itemType ?? ''),
    sanitizeCsvCell(a.itemId ?? ''),
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `moderation-activity-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export const ModerationActivityLog = () => {
  const [activities, setActivities] = useState<ModerationActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [error, setError] = useState<string | null>(null)

  const buildFilters = useCallback(
    (offset: number): ModerationActivityFilters => ({
      limit: PAGE_SIZE,
      offset,
      since: getSinceDate(dateRange),
      type: typeFilter ? (typeFilter as ModerationActivity['type']) : undefined,
      severity: severityFilter ? (severityFilter as ModerationActivity['severity']) : undefined,
    }),
    [dateRange, typeFilter, severityFilter]
  )

  const loadActivities = useCallback(
    async (reset = true) => {
      try {
        if (reset) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }
        setError(null)

        const offset = reset ? 0 : activities.length
        const data = await getModerationActivity(buildFilters(offset))

        if (reset) {
          setActivities(data)
        } else {
          setActivities((prev) => [...prev, ...data])
        }
        setHasMore(data.length === PAGE_SIZE)
      } catch (err) {
        console.error('Error loading activity log:', err)
        setError('Failed to load activity log')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [buildFilters, activities.length]
  )

  useEffect(() => {
    loadActivities(true)
  }, [typeFilter, severityFilter, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <PanelLoading message="Loading activity log..." />
  }

  return (
    <SectionCard
      title="Moderation Activity Log"
      subtitle="Filter and review all moderation events"
    >
      <Stack space={4}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Flex align="center" gap={2}>
            <Activity style={{ width: 20, height: 20 }} />
            <Badge tone="primary">{activities.length} shown</Badge>
          </Flex>
          <Flex gap={2} wrap="wrap">
            <Button
              mode="ghost"
              icon={Download}
              text="Export shown"
              disabled={activities.length === 0}
              onClick={() => exportToCsv(activities)}
            />
            <Button mode="ghost" text="Refresh" onClick={() => loadActivities(true)} />
          </Flex>
        </Flex>

        {error && <PanelError message={error} onRetry={() => loadActivities(true)} />}

        <Card padding={4} radius={2} shadow={1}>
          <Flex gap={4} wrap="wrap" align="flex-end">
            <Filter style={{ width: 16, height: 16, marginBottom: 8 }} />
            <Stack space={2}>
              <Text size={0} weight="semibold" muted>Type</Text>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter((e.currentTarget as HTMLSelectElement).value)}
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.title}</option>
                ))}
              </Select>
            </Stack>
            <Stack space={2}>
              <Text size={0} weight="semibold" muted>Severity</Text>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter((e.currentTarget as HTMLSelectElement).value)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.title}</option>
                ))}
              </Select>
            </Stack>
            <Stack space={2}>
              <Text size={0} weight="semibold" muted>Period</Text>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange((e.currentTarget as HTMLSelectElement).value as DateRange)}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </Select>
            </Stack>
          </Flex>
        </Card>

        {activities.length === 0 ? (
          <PanelEmpty
            title="No activity found"
            description="Moderation events will appear here when actions are taken on the platform."
          />
        ) : (
          <Stack space={2}>
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </Stack>
        )}

        {hasMore && activities.length > 0 && (
          <Flex justify="center">
            <Button
              mode="ghost"
              text={isLoadingMore ? 'Loading...' : 'Load more'}
              disabled={isLoadingMore}
              onClick={() => loadActivities(false)}
            />
          </Flex>
        )}
      </Stack>
    </SectionCard>
  )
}
