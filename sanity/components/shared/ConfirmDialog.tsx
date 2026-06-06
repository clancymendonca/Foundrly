import React from 'react'
import { Dialog, Card, Stack, Text, Button, Flex } from '@sanity/ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmTone?: 'default' | 'critical' | 'caution'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmTone = 'critical',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <Dialog
      id="confirm-dialog"
      header={title}
      onClose={onCancel}
      width={1}
    >
      <Card padding={4}>
        <Stack space={4}>
          <Text size={1}>{description}</Text>
          <Flex gap={2} justify="flex-end">
            <Button mode="ghost" text="Cancel" disabled={isLoading} onClick={onCancel} />
            <Button
              mode="default"
              tone={confirmTone}
              text={isLoading ? 'Processing...' : confirmLabel}
              disabled={isLoading}
              onClick={onConfirm}
            />
          </Flex>
        </Stack>
      </Card>
    </Dialog>
  )
}
