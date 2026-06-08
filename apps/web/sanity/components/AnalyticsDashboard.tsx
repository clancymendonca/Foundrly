import React, { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Text, Badge, Button, Flex, Select, Grid, Box, Spinner } from '@sanity/ui'
import { BarChart3, Heart, ThumbsDown, MessageSquare, Search } from 'lucide-react'
import {
  PanelShell,
  PanelBadge,
  PanelLoading,
  PanelEmpty,
  PanelError,
  SectionCard,
} from './shared'

type DateRange = '7d' | '30d' | 'all'

interface AnalyticsStats {
  likes: number
  dislikes: number
  comments: number
  searches: number
  topStartups: Array<{ _id?: string; title?: string; count: number }>
}

/**
 * Compute the ISO 8601 timestamp for the start of the given date range.
 *
 * @param range - One of `'7d'`, `'30d'`, or `'all'`. `'7d'` maps to 7 days ago, `'30d'` maps to 30 days ago.
 * @returns An ISO 8601 timestamp string for the computed start date, or `null` when `range` is `'all'`.
 */
function getSince(range: DateRange): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : 30
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
}

export const AnalyticsDashboard = () => {
  const client = useClient({ apiVersion: '2025-01-02' })
  const [range, setRange] = useState<DateRange>('7d')
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    const since = getSince(range)
    const sinceFilter = since ? `&& timestamp >= $since` : ''

    try {
      const [likes, dislikes, comments, searches, topStartups] = await Promise.all([
        client.fetch<number>(`count(*[_type == "startupLikeEvent" && action == "like" ${sinceFilter}])`, { since }),
        client.fetch<number>(`count(*[_type == "startupDislikeEvent" ${sinceFilter}])`, { since }),
        client.fetch<number>(`count(*[_type == "startupCommentEvent" ${sinceFilter}])`, { since }),
        client.fetch<number>(`count(*[_type == "searchEvent" ${sinceFilter}])`, { since }),
        client.fetch<Array<{ _id: string; title?: string; count: number }>>(`
          *[_type == "startup"] {
            _id,
            title,
            "count": count(*[_type == "startupLikeEvent" && startupId == ^._id && action == "like" ${sinceFilter}])
          } | order(count desc)[0...5]
        `, { since }),
      ])

      setStats({ likes, dislikes, comments, searches, topStartups: topStartups || [] })
    } catch (err) {
      console.error(err)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [client, range])

  useEffect(() => {
    loadStats(false)
  }, [loadStats])

  if (isLoading && !stats) {
    return <PanelLoading message="Loading analytics..." />
  }

  const maxLikes = stats?.topStartups.reduce((max, s) => Math.max(max, s.count), 0) ?? 0

  const metrics = stats
    ? [
        { label: 'Likes', value: stats.likes, icon: Heart, tone: 'primary' as const },
        { label: 'Dislikes', value: stats.dislikes, icon: ThumbsDown, tone: 'caution' as const },
        { label: 'Comment Events', value: stats.comments, icon: MessageSquare, tone: 'default' as const },
        { label: 'Searches', value: stats.searches, icon: Search, tone: 'default' as const },
      ]
    : []

  return (
    <PanelShell
      icon={<BarChart3 style={{ width: 32, height: 32 }} />}
      title="Analytics Dashboard"
      subtitle="Engagement metrics across the platform"
      badges={<PanelBadge tone="primary">{RANGE_LABELS[range]}</PanelBadge>}
      actions={
        <Select
          value={range}
          onChange={(e) => setRange((e.currentTarget as HTMLSelectElement).value as DateRange)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </Select>
      }
      onRefresh={() => loadStats(true)}
      isRefreshing={isRefreshing}
    >
      {error && <PanelError message={error} onRetry={() => loadStats(true)} />}

      <Box style={{ position: 'relative' }}>
        {isRefreshing && (
          <Flex
            align="center"
            justify="center"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.05)',
              zIndex: 1,
              borderRadius: 8,
            }}
          >
            <Spinner />
          </Flex>
        )}

        {stats && (
          <Stack space={5}>
            <Grid columns={[2, 4]} gap={4}>
              {metrics.map(({ label, value, icon: Icon, tone }) => (
                <Card key={label} padding={4} radius={3} shadow={2} tone={tone}>
                  <Stack space={3}>
                    <Flex align="center" gap={3}>
                      <Icon style={{ width: 24, height: 24 }} />
                      <Text size={4} weight="bold">{value.toLocaleString()}</Text>
                    </Flex>
                    <Text size={1} muted>{label}</Text>
                  </Stack>
                </Card>
              ))}
            </Grid>

            <SectionCard title="Top Startups by Likes">
              {stats.topStartups.length === 0 || maxLikes === 0 ? (
                <Text size={1} muted>No like data for this period.</Text>
              ) : (
                <Stack space={3}>
                  {stats.topStartups.map((startup) => (
                    <Stack key={startup._id ?? startup.title} space={2}>
                      <Flex justify="space-between" align="center">
                        <Text size={1}>{startup.title || 'Untitled'}</Text>
                        <Badge tone="primary">{startup.count}</Badge>
                      </Flex>
                      <Box
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: 'var(--card-border-color)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          style={{
                            height: '100%',
                            width: `${maxLikes > 0 ? (startup.count / maxLikes) * 100 : 0}%`,
                            background: 'var(--card-focus-ring-color, #2276fc)',
                            borderRadius: 4,
                            minWidth: startup.count > 0 ? 4 : 0,
                          }}
                        />
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>

            <Card padding={4} radius={2} shadow={1} tone="transparent">
              <Text size={1} muted>
                Total events: {(stats.likes + stats.dislikes + stats.comments + stats.searches).toLocaleString()}
              </Text>
            </Card>
          </Stack>
        )}

        {!stats && !error && (
          <PanelEmpty
            title="No analytics data"
            description="Analytics events will appear once users interact with startups."
          />
        )}
      </Box>
    </PanelShell>
  )
}
