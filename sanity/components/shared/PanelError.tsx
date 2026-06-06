import React from 'react'
import { Card, Stack, Text, Button, Flex } from '@sanity/ui'

interface PanelErrorProps {
  message: string
  onRetry?: () => void
}

export function PanelError({ message, onRetry }: PanelErrorProps) {
  return (
    <Card padding={5} radius={3} shadow={2} tone="critical">
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Stack space={2}>
          <Text size={2} weight="semibold">Something went wrong</Text>
          <Text size={1}>{message}</Text>
        </Stack>
        {onRetry && (
          <Button mode="default" tone="critical" text="Retry" onClick={onRetry} />
        )}
      </Flex>
    </Card>
  )
}
