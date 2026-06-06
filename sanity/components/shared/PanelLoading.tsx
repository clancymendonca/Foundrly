import React from 'react'
import { Card, Flex, Spinner, Text } from '@sanity/ui'

interface PanelLoadingProps {
  message?: string
}

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
