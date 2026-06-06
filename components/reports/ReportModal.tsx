'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Flag, X } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedType: 'startup' | 'comment' | 'user'
  reportedRef: string
  reportedTitle?: string
}

export function ReportModal({
  isOpen,
  onClose,
  reportedType,
  reportedRef,
  reportedTitle
}: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the report.",
        variant: "destructive",
      })
      return
    }

    if (reason.trim().length < 10) {
      toast({
        title: "Error",
        description: "Report reason must be at least 10 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedType,
          reportedRef,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      toast({
        title: "Report Submitted",
        description: "Your report has been submitted and will be reviewed by our team.",
      })

      onClose()
      setReason('')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReportTypeLabel = () => {
    switch (reportedType) {
      case 'startup':
        return 'Startup'
      case 'comment':
        return 'Comment'
      case 'user':
        return 'User'
      default:
        return 'Content'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Report {getReportTypeLabel()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* What are you reporting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you reporting?
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <strong>{getReportTypeLabel()}:</strong> {reportedTitle || 'Unknown'}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for report *
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for this report (minimum 10 characters)..."
              className="min-h-[120px]"
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/1000 characters
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Reports are reviewed by our moderation team. 
              False reports may result in account restrictions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 10}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 