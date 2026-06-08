import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Badge, Button, Flex, Switch, Select, TextInput, Grid, Label } from '@sanity/ui'
import { Shield, Save } from 'lucide-react'
import { useClient } from 'sanity'
import { apiVersion } from '../env'
import { getModerationSettings, type ModerationSettings as ModerationSettingsType } from '../lib/moderation-queries'
import { saveModerationSettingsWithClient } from '../lib/moderation-settings-shared'
import { PanelLoading, SectionCard } from './shared'

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
  useModelModeration: boolean
  fallbackToRegex: boolean
}

const defaultSettings: ModerationConfig = {
  enabled: true,
  severity: 'medium',
  actions: {
    profanity: 'delete',
    hateSpeech: 'ban',
    threats: 'ban',
    spam: 'delete',
    personalInfo: 'delete',
  },
  thresholds: {
    messageLength: 500,
    repetitionCount: 3,
    capsRatio: 0.7,
    confidence: 0.6,
  },
  autoBan: {
    enabled: true,
    duration: '24h',
    strikeThreshold: 2,
  },
  useModelModeration: true,
  fallbackToRegex: true,
}

export const ModerationSettings = () => {
  const client = useClient({ apiVersion })
  const [settings, setSettings] = useState<ModerationConfig>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

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
      setSaveStatus(success ? 'success' : 'error')
      if (success) setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving moderation settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof ModerationConfig>(key: K, value: ModerationConfig[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateAction = (category: keyof ModerationConfig['actions'], action: string) => {
    setSettings((prev) => ({
      ...prev,
      actions: { ...prev.actions, [category]: action as ModerationConfig['actions'][typeof category] },
    }))
  }

  const updateThreshold = (key: keyof ModerationConfig['thresholds'], value: number) => {
    setSettings((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [key]: value },
    }))
  }

  const updateAutoBan = (key: keyof ModerationConfig['autoBan'], value: boolean | string | number) => {
    setSettings((prev) => ({
      ...prev,
      autoBan: { ...prev.autoBan, [key]: value },
    }))
  }

  if (isLoading) {
    return <PanelLoading message="Loading moderation settings..." />
  }

  return (
    <Stack space={5}>
      <Card padding={5} radius={3} shadow={2} tone="primary">
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Flex align="center" gap={3}>
            <Shield style={{ width: 28, height: 28 }} />
            <Stack space={2}>
              <Text size={3} weight="bold">Moderation Settings</Text>
              <Text size={1} muted>Configure auto-moderation rules and thresholds</Text>
              <Text size={0} muted>Enforced on: Stream Chat, Comments, Startups</Text>
            </Stack>
          </Flex>
          <Badge tone={settings.enabled ? 'positive' : 'caution'}>
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </Flex>
      </Card>

      <SectionCard title="Auto-Moderation">
        <Flex align="center" justify="space-between">
          <Stack space={1}>
            <Text size={1} weight="semibold">Enable moderation</Text>
            <Text size={0} muted>Real-time content screening across the platform</Text>
          </Stack>
          <Switch
            checked={settings.enabled}
            onChange={(e) => updateSetting('enabled', (e.target as HTMLInputElement).checked)}
          />
        </Flex>
      </SectionCard>

      <SectionCard title="AI Model Moderation" subtitle="GROQ LLM with optional regex fallback">
        <Stack space={4}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">Use GROQ model</Text>
            <Switch
              checked={settings.useModelModeration}
              onChange={(e) => updateSetting('useModelModeration', (e.target as HTMLInputElement).checked)}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">Fallback to regex if model fails</Text>
            <Switch
              checked={settings.fallbackToRegex}
              onChange={(e) => updateSetting('fallbackToRegex', (e.target as HTMLInputElement).checked)}
            />
          </Flex>
        </Stack>
      </SectionCard>

      {settings.enabled && (
        <Stack space={5}>
          <SectionCard title="Moderation Severity" subtitle="Overall strictness level">
            <Flex gap={3} wrap="wrap">
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                <Button
                  key={level}
                  mode={settings.severity === level ? 'default' : 'ghost'}
                  tone={settings.severity === level ? 'primary' : 'default'}
                  onClick={() => updateSetting('severity', level)}
                  padding={3}
                  text={level.charAt(0).toUpperCase() + level.slice(1)}
                />
              ))}
            </Flex>
          </SectionCard>

          <SectionCard title="Content Actions" subtitle="Action per content category">
            <Stack space={3}>
              {Object.entries(settings.actions).map(([category, action]) => (
                <Card key={category} padding={4} radius={2} shadow={1}>
                  <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                    <Text size={1} weight="semibold" style={{ textTransform: 'capitalize' }}>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Select
                      value={action}
                      onChange={(e) => updateAction(category as keyof ModerationConfig['actions'], (e.currentTarget as HTMLSelectElement).value)}
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
          </SectionCard>

          <SectionCard title="Detection Thresholds">
            <Grid columns={[1, 2]} gap={4}>
              {([
                ['messageLength', 'Message Length (chars)', 'Maximum characters before flagging'],
                ['repetitionCount', 'Repetition Count', 'Repeated messages threshold'],
                ['capsRatio', 'Caps Ratio (0-1)', 'Uppercase letter ratio'],
                ['confidence', 'Confidence (0-1)', 'AI detection confidence'],
              ] as const).map(([key, label, hint]) => (
                <Card key={key} padding={4} radius={2} shadow={1}>
                  <Stack space={2}>
                    <Label size={1}>{label}</Label>
                    <Text size={0} muted>{hint}</Text>
                    <TextInput
                      type="number"
                      step={key === 'messageLength' || key === 'repetitionCount' ? '1' : '0.1'}
                      min={key === 'messageLength' || key === 'repetitionCount' ? '1' : '0'}
                      max={key === 'capsRatio' || key === 'confidence' ? '1' : undefined}
                      value={settings.thresholds[key]}
                      onChange={(e) => {
                        const val = key === 'messageLength' || key === 'repetitionCount'
                          ? parseInt((e.target as HTMLInputElement).value, 10)
                          : parseFloat((e.target as HTMLInputElement).value)
                        if (!Number.isNaN(val)) updateThreshold(key, val)
                      }}
                    />
                  </Stack>
                </Card>
              ))}
            </Grid>
          </SectionCard>

          <SectionCard title="Auto-Ban Settings">
            <Stack space={4}>
              <Flex align="center" justify="space-between">
                <Text size={1} weight="semibold">Enable auto-ban</Text>
                <Switch
                  checked={settings.autoBan.enabled}
                  onChange={(e) => updateAutoBan('enabled', (e.target as HTMLInputElement).checked)}
                />
              </Flex>
              {settings.autoBan.enabled && (
                <Grid columns={[1, 2]} gap={4}>
                  <Stack space={2}>
                    <Label size={1}>Ban Duration</Label>
                    <Select
                      value={settings.autoBan.duration}
                      onChange={(e) => updateAutoBan('duration', (e.currentTarget as HTMLSelectElement).value)}
                    >
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="365d">1 Year</option>
                      <option value="perm">Permanent</option>
                    </Select>
                  </Stack>
                  <Stack space={2}>
                    <Label size={1}>Strike Threshold</Label>
                    <TextInput
                      type="number"
                      min="1"
                      max="3"
                      value={settings.autoBan.strikeThreshold}
                      onChange={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value, 10)
                        if (!Number.isNaN(val)) updateAutoBan('strikeThreshold', val)
                      }}
                    />
                  </Stack>
                </Grid>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      )}

      <Card padding={4} radius={3} shadow={2}>
        <Flex justify="flex-end" gap={3} align="center" wrap="wrap">
          <Button
            mode="default"
            tone="primary"
            onClick={handleSave}
            disabled={isSaving}
            icon={Save}
            text={isSaving ? 'Saving...' : 'Save Settings'}
          />
          {saveStatus === 'success' && (
            <Badge tone="positive">Settings saved successfully</Badge>
          )}
          {saveStatus === 'error' && (
            <Badge tone="critical">Error saving settings</Badge>
          )}
        </Flex>
      </Card>
    </Stack>
  )
}
