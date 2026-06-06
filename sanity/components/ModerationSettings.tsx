import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Badge, Button, Box, Flex, Switch, Select, TextInput, Grid } from '@sanity/ui'
import { Shield, AlertTriangle, Settings, Save } from 'lucide-react'
import { useClient } from 'sanity'
import { apiVersion } from '../env'
import { getModerationSettings, type ModerationSettings as ModerationSettingsType } from '../lib/moderation-queries'
import { saveModerationSettingsWithClient } from '../lib/moderation-settings-shared'

export interface ModerationConfig {
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  actions: {
    profanity: 'warn' | 'delete' | 'ban' | 'report'
    hateSpeech: 'warn' | 'delete' | 'ban' | 'report'
    threats: 'warn' | 'delete' | 'ban' | 'report'
    spam: 'warn' | 'delete' | 'ban' | 'report'
    personalInfo: 'warn' | 'delete' | 'ban' | 'report'
  }
  thresholds: {
    messageLength: number
    repetitionCount: number
    capsRatio: number
    confidence: number
  }
  autoBan: {
    enabled: boolean
    duration: '1h' | '24h' | '7d' | '365d' | 'perm'
    strikeThreshold: number
  }
}

const defaultSettings: ModerationConfig = {
  enabled: true,
  severity: 'medium',
  actions: {
    profanity: 'delete',
    hateSpeech: 'ban',
    threats: 'ban',
    spam: 'delete',
    personalInfo: 'delete'
  },
  thresholds: {
    messageLength: 500,
    repetitionCount: 3,
    capsRatio: 0.7,
    confidence: 0.6
  },
  autoBan: {
    enabled: true,
    duration: '24h',
    strikeThreshold: 2
  }
}

export const ModerationSettings = () => {
  const client = useClient({ apiVersion })
  const [settings, setSettings] = useState<ModerationConfig>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Load settings from Sanity on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const savedSettings = await getModerationSettings()
        if (savedSettings) {
          setSettings(savedSettings as ModerationConfig)
        }
      } catch (error) {
        console.error('Error loading moderation settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      const success = await saveModerationSettingsWithClient(
        client,
        settings as ModerationSettingsType
      )
      if (success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving moderation settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof ModerationConfig>(
    key: K,
    value: ModerationConfig[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateAction = (category: keyof ModerationConfig['actions'], action: string) => {
    setSettings(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [category]: action as any
      }
    }))
  }

  const updateThreshold = (key: keyof ModerationConfig['thresholds'], value: number) => {
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value
      }
    }))
  }

  const updateAutoBan = (key: keyof ModerationConfig['autoBan'], value: any) => {
    setSettings(prev => ({
      ...prev,
      autoBan: {
        ...prev.autoBan,
        [key]: value
      }
    }))
  }

  return (
    <Stack space={6}>
      {/* Header */}
      <Card padding={5} radius={3} shadow={2} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Stack space={4}>
          <Flex align="center" justify="space-between">
            <Stack space={3}>
              <Flex align="center" gap={3}>
                <div className="p-3 bg-white/20 rounded-full">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <Stack space={2}>
                  <Text size={3} weight="bold" style={{ color: 'white' }}>
                    Moderation Settings
                  </Text>
                  <Text size={1} style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Configure auto-moderation rules and thresholds
                  </Text>
                </Stack>
              </Flex>
            </Stack>
            <Badge 
              tone={settings.enabled ? 'positive' : 'caution'} 
              padding={2}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Flex>
        </Stack>
      </Card>

      {/* Enable/Disable */}
      <Card padding={5} radius={3} shadow={2} tone="primary">
        <Stack space={4}>
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Text size={2} weight="semibold" style={{ color: '#1e40af' }}>Auto-Moderation</Text>
              <Text size={1} style={{ color: '#3b82f6' }}>Enable real-time content moderation</Text>
            </Stack>
            <Switch
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
            />
          </Flex>
        </Stack>
      </Card>

      {settings.enabled && (
        <Stack space={5}>
          {/* Severity Level */}
          <Card padding={5} radius={3} shadow={2}>
            <Stack space={4}>
              <Stack space={3}>
                <Text size={2} weight="semibold">Moderation Severity</Text>
                <Text size={1} muted>Set the overall strictness of moderation</Text>
              </Stack>
              <Flex gap={3} wrap="wrap">
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                  <Button
                    key={level}
                    mode={settings.severity === level ? 'default' : 'ghost'}
                    onClick={() => updateSetting('severity', level)}
                    padding={3}
                    style={{ 
                      borderRadius: '8px',
                      minWidth: '100px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Text size={1} weight="semibold">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Button>
                ))}
              </Flex>
            </Stack>
          </Card>

          {/* Action Settings */}
          <Card padding={5} radius={3} shadow={2}>
            <Stack space={5}>
              <Stack space={3}>
                <Text size={2} weight="semibold">Content Actions</Text>
                <Text size={1} muted>Set actions for different content types</Text>
              </Stack>
              <Stack space={4}>
                {Object.entries(settings.actions).map(([category, action]) => (
                  <Card key={category} padding={4} radius={2} shadow={1}>
                    <Flex align="center" justify="space-between">
                      <Stack space={2}>
                        <Text size={1} weight="semibold" style={{ textTransform: 'capitalize' }}>
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                        <Text size={0} muted>
                          Action to take when detected
                        </Text>
                      </Stack>
                      <Select
                        value={action}
                        onChange={(e) => updateAction(category as any, e.target.value)}
                        style={{ minWidth: '140px' }}
                      >
                        <option value="warn">Warn</option>
                        <option value="delete">Delete</option>
                        <option value="ban">Ban</option>
                        <option value="report">Report</option>
                      </Select>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Thresholds */}
          <Card padding={5} radius={3} shadow={2}>
            <Stack space={5}>
              <Stack space={3}>
                <Text size={2} weight="semibold">Detection Thresholds</Text>
                <Text size={1} muted>Configure sensitivity levels for content detection</Text>
              </Stack>
              <Grid columns={[1, 2]} gap={4}>
                <Stack space={4}>
                  <Card padding={4} radius={2} shadow={1}>
                    <Stack space={3}>
                      <Text size={1} weight="semibold">Message Length (chars)</Text>
                      <Text size={0} muted>Maximum characters before flagging</Text>
                      <TextInput
                        type="number"
                        value={settings.thresholds.messageLength}
                        onChange={(e) => updateThreshold('messageLength', parseInt(e.target.value))}
                      />
                    </Stack>
                  </Card>
                  <Card padding={4} radius={2} shadow={1}>
                    <Stack space={3}>
                      <Text size={1} weight="semibold">Repetition Count</Text>
                      <Text size={0} muted>Number of repeated messages</Text>
                      <TextInput
                        type="number"
                        value={settings.thresholds.repetitionCount}
                        onChange={(e) => updateThreshold('repetitionCount', parseInt(e.target.value))}
                      />
                    </Stack>
                  </Card>
                </Stack>
                <Stack space={4}>
                  <Card padding={4} radius={2} shadow={1}>
                    <Stack space={3}>
                      <Text size={1} weight="semibold">Caps Ratio (0-1)</Text>
                      <Text size={0} muted>Ratio of uppercase letters</Text>
                      <TextInput
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={settings.thresholds.capsRatio}
                        onChange={(e) => updateThreshold('capsRatio', parseFloat(e.target.value))}
                      />
                    </Stack>
                  </Card>
                  <Card padding={4} radius={2} shadow={1}>
                    <Stack space={3}>
                      <Text size={1} weight="semibold">Confidence (0-1)</Text>
                      <Text size={0} muted>AI detection confidence level</Text>
                      <TextInput
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={settings.thresholds.confidence}
                        onChange={(e) => updateThreshold('confidence', parseFloat(e.target.value))}
                      />
                    </Stack>
                  </Card>
                </Stack>
              </Grid>
            </Stack>
          </Card>

          {/* Auto-Ban Settings */}
          <Card padding={5} radius={3} shadow={2}>
            <Stack space={5}>
              <Flex align="center" justify="space-between">
                <Stack space={3}>
                  <Text size={2} weight="semibold">Auto-Ban Settings</Text>
                  <Text size={1} muted>Configure automatic ban actions</Text>
                </Stack>
                <Switch
                  checked={settings.autoBan.enabled}
                  onChange={(e) => updateAutoBan('enabled', e.target.checked)}
                />
              </Flex>
              
              {settings.autoBan.enabled && (
                <Stack space={4}>
                  <Grid columns={[1, 2]} gap={4}>
                    <Card padding={4} radius={2} shadow={1}>
                      <Stack space={3}>
                        <Text size={1} weight="semibold">Ban Duration</Text>
                        <Text size={0} muted>How long to ban users</Text>
                        <Select
                          value={settings.autoBan.duration}
                          onChange={(e) => updateAutoBan('duration', e.target.value)}
                        >
                          <option value="1h">1 Hour</option>
                          <option value="24h">24 Hours</option>
                          <option value="7d">7 Days</option>
                          <option value="365d">1 Year</option>
                          <option value="perm">Permanent</option>
                        </Select>
                      </Stack>
                    </Card>
                    <Card padding={4} radius={2} shadow={1}>
                      <Stack space={3}>
                        <Text size={1} weight="semibold">Strike Threshold</Text>
                        <Text size={0} muted>Strikes before auto-ban</Text>
                        <TextInput
                          type="number"
                          min="1"
                          max="3"
                          value={settings.autoBan.strikeThreshold}
                          onChange={(e) => updateAutoBan('strikeThreshold', parseInt(e.target.value))}
                        />
                      </Stack>
                    </Card>
                  </Grid>
                </Stack>
              )}
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Save Button */}
      <Card padding={4} radius={3} shadow={2}>
        <Stack space={4}>
          <Flex justify="flex-end" gap={3}>
            <Button
              mode="default"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              icon={Save}
              padding={3}
              text={isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Settings'}
            />
            
            {saveStatus === 'success' && (
              <Badge tone="positive" mode="outline" padding={2}>
                Settings saved successfully!
              </Badge>
            )}
            
            {saveStatus === 'error' && (
              <Badge tone="critical" mode="outline" padding={2}>
                Error saving settings
              </Badge>
            )}
          </Flex>
        </Stack>
      </Card>
    </Stack>
  )
} 