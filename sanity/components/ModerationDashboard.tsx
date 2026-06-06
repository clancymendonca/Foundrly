import React, { useState, useEffect, useCallback } from 'react'
import { Card, Stack, Text, Badge, Button, Flex, Grid } from '@sanity/ui'
import {
  Shield,
  MessageSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Ban,
  Settings,
  TestTube,
  BarChart3,
} from 'lucide-react'
import { ModerationSettings } from './ModerationSettings'
import { ModerationTest } from './ModerationTest'
import { ModerationActivityLog } from './ModerationActivityLog'
import {
  getModerationStats,
  getModerationActivity,
  getModerationSettings,
  type ModerationStats,
  type ModerationActivity,
} from '../lib/moderation-queries'
import { isGroqModerationAvailable } from '@/lib/moderation-service'
import {
  PanelShell,
  PanelBadge,
  PanelLoading,
  PanelEmpty,
  PanelError,
  ActivityRow,
} from './shared'

export const ModerationDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'test' | 'activity'>('overview')
  const [stats, setStats] = useState<ModerationStats>({
    moderationEvents: 0,
    flaggedMessages: 0,
    deletedMessages: 0,
    bannedUsers: 0,
    activeReports: 0,
    moderationRate: 0,
    totalComments: 0,
    flaggedComments: 0,
    totalStartups: 0,
    bannedStartups: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ModerationActivity[]>([])
  const [settingsEnabled, setSettingsEnabled] = useState<boolean | null>(null)
  const [useModelModeration, setUseModelModeration] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadModerationData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const [statsData, activityData, settings] = await Promise.all([
        getModerationStats(),
        getModerationActivity({ limit: 20 }),
        getModerationSettings(),
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      setSettingsEnabled(settings?.enabled ?? true)
      setUseModelModeration(settings?.useModelModeration ?? true)
    } catch (err) {
      console.error('Error loading moderation data:', err)
      setError('Failed to load moderation data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadModerationData()
  }, [loadModerationData])

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'overview':
        return <BarChart3 style={{ width: 16, height: 16 }} />
      case 'settings':
        return <Settings style={{ width: 16, height: 16 }} />
      case 'test':
        return <TestTube style={{ width: 16, height: 16 }} />
      case 'activity':
        return <Activity style={{ width: 16, height: 16 }} />
      default:
        return <Activity style={{ width: 16, height: 16 }} />
    }
  }

  if (isLoading) {
    return <PanelLoading message="Loading moderation data..." />
  }

  return (
    <Stack space={5}>
      <PanelShell
        icon={<Shield style={{ width: 32, height: 32 }} />}
        title="Moderation Dashboard"
        subtitle="Monitor and manage content moderation across the platform"
        badges={
          <>
            <PanelBadge tone={settingsEnabled ? 'positive' : 'caution'}>
              {settingsEnabled ? 'Enabled' : 'Disabled'}
            </PanelBadge>
            <PanelBadge tone={useModelModeration ? 'primary' : 'caution'}>
              {useModelModeration ? 'GROQ AI' : 'Regex only'}
            </PanelBadge>
            <PanelBadge tone={isGroqModerationAvailable() ? 'positive' : 'caution'}>
              GROQ {isGroqModerationAvailable() ? 'available' : 'unavailable'}
            </PanelBadge>
          </>
        }
        onRefresh={() => loadModerationData(true)}
        isRefreshing={isRefreshing}
      >
        {error && <PanelError message={error} onRetry={() => loadModerationData(true)} />}

        <Card padding={3} radius={2} shadow={1}>
          <Flex gap={2} wrap="wrap">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'settings', label: 'Settings' },
              { id: 'test', label: 'Test Tools' },
              { id: 'activity', label: 'Activity Log' },
            ].map((tab) => (
              <Button
                key={tab.id}
                mode={activeTab === tab.id ? 'default' : 'ghost'}
                tone={activeTab === tab.id ? 'primary' : 'default'}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                padding={3}
                style={
                  activeTab === tab.id
                    ? { borderBottom: '2px solid var(--card-focus-ring-color, #2276fc)' }
                    : undefined
                }
              >
                <Flex align="center" gap={2}>
                  {getTabIcon(tab.id)}
                  <Text size={1} weight="semibold">{tab.label}</Text>
                </Flex>
              </Button>
            ))}
          </Flex>
        </Card>

        {activeTab === 'overview' && (
          <Stack space={5}>
            <Card padding={5} radius={3} shadow={2}>
              <Stack space={4}>
                <Flex align="center" justify="space-between">
                  <Text size={3} weight="bold">Key Metrics</Text>
                  <Badge tone="primary">Last 24 hours</Badge>
                </Flex>

                <Grid columns={[1, 2, 4]} gap={4}>
                  <Card padding={4} radius={3} shadow={2} tone="positive">
                    <Stack space={3}>
                      <Flex align="center" gap={3}>
                        <MessageSquare style={{ width: 24, height: 24 }} />
                        <Text size={4} weight="bold">{stats.moderationEvents.toLocaleString()}</Text>
                      </Flex>
                      <Text size={1} muted>Moderation Events</Text>
                    </Stack>
                  </Card>

                  <Card padding={4} radius={3} shadow={2} tone="caution">
                    <Stack space={3}>
                      <Flex align="center" gap={3}>
                        <TrendingDown style={{ width: 24, height: 24 }} />
                        <Text size={4} weight="bold">{stats.flaggedMessages.toLocaleString()}</Text>
                      </Flex>
                      <Text size={1} muted>Flagged Messages</Text>
                    </Stack>
                  </Card>

                  <Card padding={4} radius={3} shadow={2} tone="critical">
                    <Stack space={3}>
                      <Flex align="center" gap={3}>
                        <Ban style={{ width: 24, height: 24 }} />
                        <Text size={4} weight="bold">{stats.deletedMessages.toLocaleString()}</Text>
                      </Flex>
                      <Text size={1} muted>Deleted Messages</Text>
                    </Stack>
                  </Card>

                  <Card padding={4} radius={3} shadow={2}>
                    <Stack space={3}>
                      <Flex align="center" gap={3}>
                        <Ban style={{ width: 24, height: 24 }} />
                        <Text size={4} weight="bold">{stats.bannedUsers.toLocaleString()}</Text>
                      </Flex>
                      <Text size={1} muted>Banned Users (all time)</Text>
                    </Stack>
                  </Card>
                </Grid>
              </Stack>
            </Card>

            <Grid columns={[1, 2]} gap={4}>
              <Card padding={4} radius={3} shadow={2}>
                <Stack space={3}>
                  <Flex align="center" gap={2}>
                    <Shield style={{ width: 20, height: 20 }} />
                    <Text size={2} weight="semibold">Active Reports</Text>
                  </Flex>
                  <Text size={4} weight="bold">{stats.activeReports}</Text>
                  <Text size={1} muted>Pending reports awaiting triage</Text>
                  {stats.activeReports > 0 && (
                    <Button
                      as="a"
                      href="/studio/structure/report-triage"
                      mode="default"
                      tone="primary"
                      text="Open Report Triage"
                    />
                  )}
                </Stack>
              </Card>

              <Card padding={4} radius={3} shadow={2}>
                <Stack space={3}>
                  <Flex align="center" gap={2}>
                    <TrendingUp style={{ width: 20, height: 20 }} />
                    <Text size={2} weight="semibold">Moderation Rate</Text>
                  </Flex>
                  <Text size={4} weight="bold">{stats.moderationRate.toFixed(1)}%</Text>
                  <Text size={1} muted>Content flagged or banned (comments + startups)</Text>
                </Stack>
              </Card>
            </Grid>

            <Card padding={5} radius={3} shadow={2}>
              <Stack space={4}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    <Activity style={{ width: 20, height: 20 }} />
                    <Text size={2} weight="semibold">Recent Activity</Text>
                  </Flex>
                  <Badge tone="primary">{recentActivity.length} items</Badge>
                </Flex>

                {recentActivity.length === 0 ? (
                  <PanelEmpty
                    title="No recent activity"
                    description="Moderation events will appear here when actions are taken."
                  />
                ) : (
                  <Stack space={2}>
                    {recentActivity.slice(0, 5).map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} compact />
                    ))}
                  </Stack>
                )}

                {recentActivity.length > 0 && (
                  <Flex justify="center">
                    <Button
                      mode="ghost"
                      tone="primary"
                      text="View All Activity"
                      onClick={() => setActiveTab('activity')}
                    />
                  </Flex>
                )}
              </Stack>
            </Card>
          </Stack>
        )}
      </PanelShell>

      {activeTab === 'settings' && <ModerationSettings />}
      {activeTab === 'test' && <ModerationTest />}
      {activeTab === 'activity' && <ModerationActivityLog />}
    </Stack>
  )
}
