import React from 'react'
import { Card, Stack, Text, Button, Flex } from '@sanity/ui'

interface PanelErrorProps {
  message: string
  onRetry?: () => void
}

/**
 * Renders a critical-styled error panel showing an error message and an optional retry action.
 *
 * @param message - Error text to display inside the panel
 * @param onRetry - Optional callback invoked when the user clicks the "Retry" button
 * @returns A Sanity UI `Card` element containing the error headline, message, and optional retry button
 */
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
