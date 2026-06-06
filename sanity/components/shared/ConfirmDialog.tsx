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

/**
 * Renders a confirmation dialog with a title, description, and Cancel/Confirm actions.
 *
 * @param open - Whether the dialog is visible.
 * @param title - Header text displayed at the top of the dialog.
 * @param description - Body text shown inside the dialog.
 * @param confirmLabel - Label for the confirm button (default: "Confirm").
 * @param confirmTone - Visual tone for the confirm button; one of "default", "critical", or "caution".
 * @param isLoading - When true, disables both buttons and replaces the confirm button text with "Processing...".
 * @param onConfirm - Called when the confirm button is clicked.
 * @param onCancel - Called when the cancel button or dialog close is triggered.
 * @returns The dialog element when `open` is true, otherwise `null`.
 */
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
