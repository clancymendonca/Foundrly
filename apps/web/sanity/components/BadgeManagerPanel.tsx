import React, { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Text, Badge, Button, Flex, Select, Label, Spinner, TextInput } from '@sanity/ui'
import { Award } from 'lucide-react'
import {
  PanelShell,
  PanelBadge,
  PanelLoading,
  PanelEmpty,
  PanelError,
  SectionCard,
  ConfirmDialog,
  formatTimeAgo,
  handleKeyboardActivate,
} from './shared'

interface BadgeDoc {
  _id: string
  name: string
  category?: string
  metric?: string
  levels?: { tier?: string; target?: number; rarity?: string }[]
}

interface UserBadgeDoc {
  _id: string
  earnedAt: string
  currentTier?: string
  user?: { _id: string; name?: string }
  badge?: { _id: string; name?: string }
}

interface AuthorOption {
  _id: string
  name?: string
  username?: string
}

type FeedbackMessage = { type: 'success' | 'error'; text: string } | null

export const BadgeManagerPanel = () => {
  const client = useClient({ apiVersion: '2025-01-02' })
  const [badges, setBadges] = useState<BadgeDoc[]>([])
  const [recentAwards, setRecentAwards] = useState<UserBadgeDoc[]>([])
  const [authorSearch, setAuthorSearch] = useState('')
  const [authorResults, setAuthorResults] = useState<AuthorOption[]>([])
  const [isSearchingAuthors, setIsSearchingAuthors] = useState(false)
  const [selectedBadgeId, setSelectedBadgeId] = useState('')
  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAwarding, setIsAwarding] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackMessage>(null)
  const [error, setError] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<UserBadgeDoc | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [badgeData, awardData] = await Promise.all([
        client.fetch<BadgeDoc[]>(`*[_type == "badge" && isActive != false]{ _id, name, category, metric, levels }`),
        client.fetch<UserBadgeDoc[]>(`
          *[_type == "userBadge"] | order(earnedAt desc)[0...20] {
            _id, earnedAt, currentTier,
            "user": user->{ _id, name },
            "badge": badge->{ _id, name }
          }
        `),
      ])
      setBadges(badgeData)
      setRecentAwards(awardData)
      if (badgeData.length && !selectedBadgeId) setSelectedBadgeId(badgeData[0]._id)
    } catch (err) {
      console.error(err)
      setError('Failed to load badge data')
    } finally {
      setIsLoading(false)
    }
  }, [client, selectedBadgeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!authorSearch.trim()) {
      setAuthorResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingAuthors(true)
      try {
        const q = `${authorSearch.trim()}*`
        const results = await client.fetch<AuthorOption[]>(
          `*[_type == "author" && (name match $q || username match $q)][0...20]{ _id, name, username }`,
          { q }
        )
        setAuthorResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearchingAuthors(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [authorSearch, client])

  const awardBadge = async () => {
    if (!selectedBadgeId || !selectedAuthorId) return
    setIsAwarding(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/badges/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: selectedAuthorId, badgeId: selectedBadgeId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to award badge')
      setFeedback({ type: 'success', text: 'Badge awarded successfully' })
      setSelectedAuthorId('')
      setAuthorSearch('')
      await loadData()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to award badge',
      })
    } finally {
      setIsAwarding(false)
    }
  }

  const revokeBadge = async () => {
    if (!revokeTarget) return
    setIsRevoking(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/badges/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userBadgeId: revokeTarget._id }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke badge')
      }
      setFeedback({ type: 'success', text: 'Badge revoked successfully' })
      setRevokeTarget(null)
      await loadData()
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to revoke badge',
      })
    } finally {
      setIsRevoking(false)
    }
  }

  if (isLoading) {
    return <PanelLoading message="Loading badges..." />
  }

  return (
    <>
      <PanelShell
        icon={<Award style={{ width: 32, height: 32 }} />}
        title="Badge Manager"
        subtitle="Manually award or revoke badges for authors"
        badges={
          <>
            <PanelBadge tone="primary">{badges.length} badges</PanelBadge>
            <PanelBadge tone="default">{recentAwards.length} recent awards</PanelBadge>
          </>
        }
        onRefresh={loadData}
      >
        {error && <PanelError message={error} onRetry={loadData} />}

        {feedback && (
          <Card padding={4} radius={2} tone={feedback.type === 'success' ? 'positive' : 'critical'}>
            <Text size={1}>{feedback.text}</Text>
          </Card>
        )}

        <SectionCard title="Manual Award" subtitle="Search for an author and select a badge to award">
          <Stack space={4}>
            <Stack space={2}>
              <Label size={1}>Search Author</Label>
              <TextInput
                placeholder="Type name or username..."
                value={authorSearch}
                onChange={(e) => {
                  setAuthorSearch((e.target as HTMLInputElement).value)
                  setSelectedAuthorId('')
                }}
              />
              {isSearchingAuthors && (
                <Flex align="center" gap={2}>
                  <Spinner />
                  <Text size={0} muted>Searching...</Text>
                </Flex>
              )}
              {authorResults.length > 0 && !selectedAuthorId && (
                <Stack space={1}>
                  {authorResults.map((a) => (
                    <Card
                      key={a._id}
                      padding={3}
                      radius={2}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedAuthorId(a._id)
                        setAuthorSearch(a.name || a.username || a._id)
                        setAuthorResults([])
                      }}
                      onKeyDown={(event) =>
                        handleKeyboardActivate(event, () => {
                          setSelectedAuthorId(a._id)
                          setAuthorSearch(a.name || a.username || a._id)
                          setAuthorResults([])
                        })
                      }
                    >
                      <Text size={1}>{a.name || a.username || a._id}</Text>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>

            <Stack space={2}>
              <Label size={1}>Badge</Label>
              <Select
                value={selectedBadgeId}
                onChange={(e) => setSelectedBadgeId((e.currentTarget as HTMLSelectElement).value)}
              >
                {badges.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </Select>
            </Stack>

            <Button
              mode="default"
              tone="primary"
              text={isAwarding ? 'Awarding...' : 'Award Badge'}
              disabled={isAwarding || !selectedAuthorId || !selectedBadgeId}
              onClick={awardBadge}
            />
          </Stack>
        </SectionCard>

        <SectionCard title="Available Badges">
          {badges.length === 0 ? (
            <PanelEmpty
              title="No badges defined"
              description="Create badge documents under Community → Badges (raw) to get started."
            />
          ) : (
            <Stack space={2}>
              {badges.map((badge) => (
                <Card key={badge._id} padding={4} radius={2} shadow={1}>
                  <Flex justify="space-between" gap={2} wrap="wrap">
                    <Stack space={1}>
                      <Text size={1} weight="semibold">{badge.name}</Text>
                      <Text size={0} muted>
                        {badge.category} · {badge.metric}
                        {badge.levels?.length
                          ? ` · ${badge.levels.length} tiers (diamond @ ${badge.levels[badge.levels.length - 1]?.target})`
                          : ''}
                      </Text>
                    </Stack>
                    <Badge tone="primary">{badge.category}</Badge>
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard title="Recent Awards">
          {recentAwards.length === 0 ? (
            <PanelEmpty
              title="No awards yet"
              description="Manually awarded badges will appear here."
            />
          ) : (
            <Stack space={2}>
              {recentAwards.map((award) => (
                <Card key={award._id} padding={4} radius={2} shadow={1}>
                  <Flex justify="space-between" align="center" gap={2} wrap="wrap">
                    <Stack space={1}>
                      <Text size={1} weight="semibold">
                        {award.badge?.name} → {award.user?.name || 'Unknown'}
                      </Text>
                      <Text size={0} muted>{formatTimeAgo(award.earnedAt)}</Text>
                    </Stack>
                    <Button
                      mode="ghost"
                      tone="critical"
                      text="Revoke"
                      onClick={() => setRevokeTarget(award)}
                    />
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </SectionCard>
      </PanelShell>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke Badge"
        description={`Remove "${revokeTarget?.badge?.name}" from ${revokeTarget?.user?.name || 'this user'}?`}
        confirmLabel="Revoke"
        confirmTone="critical"
        isLoading={isRevoking}
        onConfirm={revokeBadge}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  )
}
