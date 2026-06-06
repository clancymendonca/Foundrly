import React from 'react'
import { Box, Card, Stack, Text, Flex, Badge, Button } from '@sanity/ui'
import { RefreshCw } from 'lucide-react'

interface PanelShellProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  badges?: React.ReactNode
  actions?: React.ReactNode
  onRefresh?: () => void
  isRefreshing?: boolean
  children: React.ReactNode
}

export function PanelShell({
  icon,
  title,
  subtitle,
  badges,
  actions,
  onRefresh,
  isRefreshing,
  children,
}: PanelShellProps) {
  return (
    <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Stack space={5}>
        <Card padding={5} radius={3} shadow={2} tone="primary">
          <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
            <Flex align="center" gap={3}>
              {icon}
              <Stack space={2}>
                <Text size={4} weight="bold">{title}</Text>
                {subtitle && <Text size={1} muted>{subtitle}</Text>}
              </Stack>
            </Flex>
            <Flex align="center" gap={2} wrap="wrap">
              {badges}
              {actions}
              {onRefresh && (
                <Button
                  mode="ghost"
                  icon={RefreshCw}
                  text={isRefreshing ? 'Refreshing...' : 'Refresh'}
                  disabled={isRefreshing}
                  onClick={onRefresh}
                />
              )}
            </Flex>
          </Flex>
        </Card>
        {children}
      </Stack>
    </Box>
  )
}

export function PanelBadge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
}) {
  return <Badge tone={tone}>{children}</Badge>
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card padding={5} radius={3} shadow={2}>
      <Stack space={4}>
        {(title || subtitle) && (
          <Stack space={1}>
            {title && <Text size={2} weight="semibold">{title}</Text>}
            {subtitle && <Text size={1} muted>{subtitle}</Text>}
          </Stack>
        )}
        {children}
      </Stack>
    </Card>
  )
}
