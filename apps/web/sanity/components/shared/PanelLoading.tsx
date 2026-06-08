import React from 'react'
import { Card, Flex, Spinner, Text } from '@sanity/ui'

interface PanelLoadingProps {
  message?: string
}

/**
 * Renders a loading panel with a centered spinner and label.
 *
 * @param message - Text to display next to the spinner; defaults to "Loading..."
 * @returns A Card containing a centered Spinner and a muted Text element showing `message`
 */
export function PanelLoading({ message = 'Loading...' }: PanelLoadingProps) {
  return (
    <Card padding={6} radius={3} shadow={2}>
      <Flex align="center" justify="center" gap={3}>
        <Spinner />
        <Text size={2} muted>{message}</Text>
      </Flex>
    </Card>
  )
}
