import React from 'react'
import { Card, Stack, Text } from '@sanity/ui'

interface PanelEmptyProps {
  title: string
  description?: string
  tone?: 'caution' | 'positive' | 'default'
}

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
