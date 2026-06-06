import React from 'react'
import { Card, Stack, Text, Badge, Flex } from '@sanity/ui'
import type { ModerationActivity } from '../../lib/moderation-queries'
import { formatTimeAgo } from './formatTimeAgo'
import { formatActivityType, severityTone } from './statusTone'

interface ActivityRowProps {
  activity: ModerationActivity
  compact?: boolean
}

export function ActivityRow({ activity, compact = false }: ActivityRowProps) {
  return (
    <Card
      padding={compact ? 3 : 4}
      radius={2}
      shadow={1}
      tone={activity.severity === 'critical' || activity.severity === 'high' ? 'caution' : 'default'}
    >
      <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
        <Stack space={2}>
          <Flex align="center" gap={2} wrap="wrap">
            <Text size={1} weight="semibold">{activity.userName}</Text>
            <Badge tone="default">{formatActivityType(activity.type)}</Badge>
          </Flex>
          <Text size={1} muted>{activity.reason}</Text>
          {!compact && activity.itemType && (
            <Text size={0} muted>
              {activity.itemType}{activity.itemId ? `: ${activity.itemId}` : ''}
            </Text>
          )}
          {!compact && activity.source && (
            <Text size={0} muted>
              Source: {activity.source}{activity.model ? ` (${activity.model})` : ''}
            </Text>
          )}
        </Stack>
        <Stack space={2}>
          <Badge tone={severityTone(activity.severity)}>{activity.severity}</Badge>
          <Text size={0} muted>{formatTimeAgo(activity.timestamp)}</Text>
        </Stack>
      </Flex>
    </Card>
  )
}
