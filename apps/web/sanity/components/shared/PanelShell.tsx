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

/**
 * Render a panel layout with a header (icon, title, optional subtitle, optional badges/actions, and an optional refresh control) and a content area.
 *
 * @param icon - Element displayed at the start of the header (typically an icon)
 * @param title - Header title text
 * @param subtitle - Optional header subtitle shown beneath the title
 * @param badges - Optional badge elements shown in the header actions area
 * @param actions - Optional custom action elements shown in the header actions area
 * @param onRefresh - Optional refresh callback; when provided a refresh button is shown that calls this handler
 * @param isRefreshing - When `true`, the refresh button label shows "Refreshing..." and the button is disabled
 * @param children - Content rendered below the header card
 * @returns The panel element containing the header card and the provided children
 */
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

/**
 * Renders a badge with a selectable visual tone.
 *
 * @param children - Content to display inside the badge
 * @param tone - Visual tone to apply; one of `'default'`, `'primary'`, `'positive'`, `'caution'`, or `'critical'`
 * @returns A Badge element with the specified `tone` containing `children`
 */
export function PanelBadge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
}) {
  return <Badge tone={tone}>{children}</Badge>
}

/**
 * Renders a card-styled section with an optional title and subtitle above arbitrary body content.
 *
 * @param title - Optional section heading text
 * @param subtitle - Optional section subtitle text shown below the title
 * @param children - Content rendered inside the card below the optional heading
 * @returns The rendered section `Card` element containing the heading (if provided) and `children`
 */
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
