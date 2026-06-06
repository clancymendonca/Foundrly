import React, { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Text, Badge, Button, Flex, Box } from '@sanity/ui'
import { Ban, Clock, ShieldAlert } from 'lucide-react'
import { getBanSummary } from '../lib/strike-system'
import {
  PanelLoading,
  PanelEmpty,
  PanelError,
  ConfirmDialog,
  formatDateTime,
} from './shared'

interface AuthorBanPanelProps {
  documentId?: string
  document?: {
    displayed?: {
      _id?: string
    }
  }
}

interface AuthorBanData {
  _id: string
  name?: string
  username?: string
  isBanned?: boolean
  bannedUntil?: string | null
  strikeCount?: number
  banHistory?: Array<{
    timestamp: string
    duration: string
    reason?: string
    strikeNumber: number
  }>
}

function getStrikeColor(strikes: number): 'positive' | 'caution' | 'critical' {
  if (strikes === 0) return 'positive'
  if (strikes <= 2) return 'caution'
  return 'critical'
}

function StrikeMeter({ strikes }: { strikes: number }) {
  const segments = [0, 1, 2].map((i) => {
    if (strikes === 0) return 'positive'
    if (i < strikes) return strikes >= 3 ? 'critical' : 'caution'
    return 'default'
  })

  return (
    <Flex gap={2}>
      {segments.map((tone, i) => (
        <Box
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            background:
              tone === 'positive'
                ? 'var(--card-badge-positive-fg-color, #43d675)'
                : tone === 'caution'
                  ? 'var(--card-badge-caution-fg-color, #fbbf24)'
                  : tone === 'critical'
                    ? 'var(--card-badge-critical-fg-color, #f03e2f)'
                    : 'var(--card-border-color)',
          }}
        />
      ))}
    </Flex>
  )
}

export const AuthorBanPanel = (props: AuthorBanPanelProps) => {
  const rawId = props.documentId ?? props.document?.displayed?._id
  const documentId = rawId?.replace(/^drafts\./, '') ?? ''
  const client = useClient({ apiVersion: '2025-01-02' })
  const [author, setAuthor] = useState<AuthorBanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false)

  const loadAuthor = useCallback(async () => {
    if (!documentId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await client.fetch<AuthorBanData>(
        `*[_type == "author" && _id == $id][0]{
          _id, name, username, isBanned, bannedUntil, strikeCount, banHistory
        }`,
        { id: documentId }
      )
      setAuthor(data)
    } catch (err) {
      console.error('Error loading author ban data:', err)
      setError('Failed to load ban status')
    } finally {
      setIsLoading(false)
    }
  }, [client, documentId])

  useEffect(() => {
    loadAuthor()
  }, [loadAuthor])

  const handleUnban = async () => {
    if (!author?._id) return
    setIsSaving(true)
    setError(null)
    try {
      await client
        .patch(author._id)
        .set({ isBanned: false, bannedUntil: null })
        .commit()
      setShowUnbanConfirm(false)
      await loadAuthor()
    } catch (err) {
      console.error('Error removing ban:', err)
      setError('Failed to remove ban')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <PanelLoading message="Loading ban status..." />
  }

  if (!author) {
    return (
      <PanelEmpty
        title="Author not found"
        description="Could not load ban data for this document."
      />
    )
  }

  const banSummary = getBanSummary(
    author.isBanned ?? false,
    author.bannedUntil ?? null,
    author.strikeCount ?? 0,
    author.banHistory ?? []
  )

  return (
    <>
      <Card padding={5} radius={3} shadow={2}>
        <Stack space={5}>
          <Stack space={2}>
            <Flex align="center" gap={2}>
              <ShieldAlert style={{ width: 20, height: 20 }} />
              <Text size={3} weight="bold">Ban & Strike Management</Text>
            </Flex>
            <Text size={1} muted>
              {author.name || author.username || author._id}
            </Text>
          </Stack>

          {error && <PanelError message={error} onRetry={loadAuthor} />}

          <Stack space={3}>
            <Flex align="center" gap={3} wrap="wrap">
              <Badge tone={getStrikeColor(banSummary.currentStrikes)}>
                {banSummary.currentStrikes} / 3 Strikes
              </Badge>
              {banSummary.isCurrentlyBanned && (
                <Badge tone="critical">Currently Banned</Badge>
              )}
            </Flex>
            <StrikeMeter strikes={banSummary.currentStrikes} />
            <Text size={1} muted>{banSummary.nextStrikeAction}</Text>
          </Stack>

          {banSummary.banHistory.length > 0 ? (
            <Stack space={3}>
              <Text size={2} weight="semibold">Ban History</Text>
              {banSummary.banHistory.slice(-5).reverse().map((entry, index) => (
                <Card key={index} padding={4} radius={2} shadow={1} tone="caution">
                  <Flex justify="space-between" align="flex-start" gap={3}>
                    <Stack space={2}>
                      <Flex gap={2} align="center">
                        <Clock style={{ width: 14, height: 14 }} />
                        <Badge tone="caution">Strike {entry.strikeNumber}</Badge>
                        <Text size={1} weight="semibold">{entry.duration}</Text>
                      </Flex>
                      {entry.reason && <Text size={0} muted>{entry.reason}</Text>}
                    </Stack>
                    <Text size={0} muted>{formatDateTime(entry.timestamp)}</Text>
                  </Flex>
                </Card>
              ))}
            </Stack>
          ) : (
            <PanelEmpty
              tone="positive"
              title="Clean record"
              description="This author has no ban history."
            />
          )}

          {banSummary.isCurrentlyBanned && (
            <Button
              mode="default"
              tone="critical"
              text={isSaving ? 'Removing ban...' : 'Remove Ban'}
              disabled={isSaving}
              onClick={() => setShowUnbanConfirm(true)}
            />
          )}

          {banSummary.currentStrikes >= 2 && (
            <Card padding={4} radius={2} tone="critical">
              <Flex align="center" gap={2}>
                <Ban style={{ width: 16, height: 16 }} />
                <Text size={1} weight="semibold">
                  Next violation may result in a permanent ban
                </Text>
              </Flex>
            </Card>
          )}
        </Stack>
      </Card>

      <ConfirmDialog
        open={showUnbanConfirm}
        title="Remove Ban"
        description={`Remove the active ban for ${author.name || author.username || 'this author'}? They will be able to post again immediately.`}
        confirmLabel="Remove Ban"
        confirmTone="critical"
        isLoading={isSaving}
        onConfirm={handleUnban}
        onCancel={() => setShowUnbanConfirm(false)}
      />
    </>
  )
}
