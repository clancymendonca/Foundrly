import React from 'react'
import { Card, Stack, Text } from '@sanity/ui'

interface PanelEmptyProps {
  title: string
  description?: string
  tone?: 'caution' | 'positive' | 'default'
}

/**
 * Render a Sanity UI Card used as an empty panel with a title and optional description.
 *
 * @param title - The panel's title text
 * @param description - Optional descriptive text displayed below the title
 * @param tone - Visual tone of the card; one of `'caution' | 'positive' | 'default'`. Defaults to `'caution'`
 * @returns The React element representing the empty panel
 */
export function PanelEmpty({ title, description, tone = 'caution' }: PanelEmptyProps) {
  return (
    <Card padding={6} radius={3} shadow={2} tone={tone}>
      <Stack space={3}>
        <Text size={2} weight="semibold">{title}</Text>
        {description && <Text size={1} muted>{description}</Text>}
      </Stack>
    </Card>
  )
}
