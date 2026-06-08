import React, { useState, useEffect } from 'react'
import { set, unset, useClient } from 'sanity'
import { Card, Stack, Text, Badge, Button, Box } from '@sanity/ui'
import { AlertTriangle, Clock, Ban, Shield } from 'lucide-react'
import { getBanSummary } from '../lib/strike-system'

interface StrikeSystemInputProps {
  value?: {
    isBanned?: boolean
    bannedUntil?: string | null
    strikeCount?: number
    banHistory?: Array<{
      timestamp: string
      duration: string
      reason?: string
      reportId?: string
      strikeNumber: number
    }>
  }
  onChange: (patch: any) => void
}

export const StrikeSystemInput = React.forwardRef<HTMLDivElement, StrikeSystemInputProps>(
  (props, ref) => {
    const { value, onChange } = props
    const [isLoading, setIsLoading] = useState(false)
    const client = useClient()

    const banSummary = getBanSummary(
      value?.isBanned || false,
      value?.bannedUntil || null,
      value?.strikeCount || 0,
      value?.banHistory || []
    )

    const handleUnban = async () => {
      setIsLoading(true)
      try {
        onChange(set({
          isBanned: false,
          bannedUntil: null
        }))
      } catch (error) {
        console.error('Error removing ban:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const getStrikeColor = (strikes: number) => {
      if (strikes === 0) return 'green'
      if (strikes === 1) return 'yellow'
      if (strikes === 2) return 'orange'
      return 'red'
    }

    const getStrikeIcon = (strikes: number) => {
      if (strikes === 0) return <Shield className="h-4 w-4 text-green-600" />
      if (strikes === 1) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      if (strikes === 2) return <Clock className="h-4 w-4 text-orange-600" />
      return <Ban className="h-4 w-4 text-red-600" />
    }

    return (
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={4}>
          {/* Current Status */}
          <Box>
            <Stack space={3}>
              <div className="flex items-center space-x-2">
                {getStrikeIcon(banSummary.currentStrikes)}
                <Text size={2} weight="semibold">
                  Strike System Status
                </Text>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge 
                  tone={getStrikeColor(banSummary.currentStrikes) as any}
                  padding={2}
                >
                  {banSummary.currentStrikes} / 3 Strikes
                </Badge>
                
                {banSummary.isCurrentlyBanned && (
                  <Badge tone="critical" padding={2}>
                    Currently Banned
                  </Badge>
                )}
              </div>

              <Text size={1} muted>
                {banSummary.nextStrikeAction}
              </Text>
            </Stack>
          </Box>

          {/* Ban History */}
          {banSummary.banHistory.length > 0 && (
            <Box>
              <Stack space={3}>
                <Text size={1} weight="semibold">
                  Ban History
                </Text>
                <Stack space={2}>
                  {banSummary.banHistory.slice(-3).reverse().map((entry, index) => (
                    <Card key={index} padding={3} radius={1} tone="caution">
                      <Stack space={2}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge tone="caution" padding={1}>
                              Strike {entry.strikeNumber}
                            </Badge>
                            <Text size={1} weight="semibold">
                              {entry.duration}
                            </Text>
                          </div>
                          <Text size={0} muted>
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </Text>
                        </div>
                        {entry.reason && (
                          <Text size={1} muted>
                            {entry.reason}
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Actions */}
          {banSummary.isCurrentlyBanned && (
            <Box>
              <Button
                mode="ghost"
                tone="critical"
                onClick={handleUnban}
                disabled={isLoading}
                text={isLoading ? 'Removing ban...' : 'Remove Ban'}
              />
            </Box>
          )}

          {/* Warning for 3rd strike */}
          {banSummary.currentStrikes >= 2 && (
            <Card padding={3} radius={1} tone="critical">
              <div className="flex items-center space-x-2">
                <Ban className="h-4 w-4 text-red-600" />
                <Text size={1} weight="semibold">
                  ⚠️ Next violation will result in a PERMANENT BAN
                </Text>
              </div>
            </Card>
          )}
        </Stack>
      </Card>
    )
  }
) 