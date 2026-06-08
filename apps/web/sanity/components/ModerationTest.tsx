import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Badge, Button, Flex, TextArea, Grid } from '@sanity/ui'
import { TestTube, MessageSquare, Settings, Play } from 'lucide-react'
import { getModerationSettings, type ModerationSettings as ModerationSettingsType } from '../lib/moderation-queries'
import { formatTime } from '../../lib/utils'
import { PanelShell, PanelEmpty, PanelError, SectionCard } from './shared'

interface TestResult {
  id: string
  content: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  action: 'warn' | 'delete' | 'ban' | 'report' | 'allow'
  reason: string
  patterns: string[]
  timestamp: string
  source?: 'groq' | 'regex'
  model?: string
  latencyMs?: number
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function formatSourceLabel(source?: string, model?: string): string {
  if (source === 'groq') return model ? `GROQ ${model}` : 'GROQ model'
  if (source === 'regex') return 'Regex fallback'
  return 'Unknown'
}

const PRESET_EXAMPLES = [
  { name: 'Profanity', type: 'profanity', content: 'This message contains fuck and other bad words.' },
  { name: 'Hate Speech', type: 'hateSpeech', content: 'This message contains discriminatory slurs and hate content.' },
  { name: 'Threats', type: 'threats', content: 'I will kill you if you continue this behavior.' },
  { name: 'Spam', type: 'spam', content: 'BUY NOW! CLICK HERE! FREE MONEY! MAKE MONEY FAST!' },
  { name: 'Personal Info', type: 'personalInfo', content: 'My phone number is 555-123-4567 and my email is test@example.com' },
  { name: 'Clean Content', type: 'clean', content: 'This is a perfectly normal message that should pass moderation.' },
]

export const ModerationTest = () => {
  const [testContent, setTestContent] = useState('')
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<ModerationSettingsType | null>(null)

  useEffect(() => {
    getModerationSettings()
      .then(setSettings)
      .catch((err) => console.error('Error loading moderation settings:', err))
  }, [])

  const runTest = async (content: string, type?: string) => {
    if (!content.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/moderation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Test request failed')
      }
      const data = await response.json()
      const result = data.result
      const testResult: TestResult = {
        id: Date.now().toString(),
        content,
        type: result.primaryCategory || type || (result.isFlagged ? 'detected' : 'clean'),
        severity: result.isFlagged ? result.severity : 'low',
        confidence: result.confidence,
        action: result.isFlagged ? result.action : 'allow',
        reason: result.reason || 'No issues detected',
        patterns: result.patterns || [],
        timestamp: new Date().toISOString(),
        source: data.source,
        model: data.model,
        latencyMs: data.latencyMs,
      }
      setResults((prev) => [testResult, ...prev.slice(0, 9)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run moderation test')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Stack space={5}>
      <PanelShell
        icon={<TestTube style={{ width: 32, height: 32 }} />}
        title="Moderation Test Tools"
        subtitle="Test content against the GROQ AI moderation engine and saved settings"
      >
        {error && <PanelError message={error} />}

        <SectionCard title="Test Content">
          <Stack space={4}>
            <TextArea
              placeholder="Enter content to test moderation..."
              value={testContent}
              onChange={(e) => setTestContent((e.target as HTMLTextAreaElement).value)}
              rows={4}
            />
            <Flex gap={3} justify="flex-end">
              <Button mode="ghost" onClick={() => setTestContent('')} text="Clear input" />
              <Button
                mode="default"
                tone="primary"
                onClick={() => runTest(testContent)}
                disabled={isLoading || !testContent.trim()}
                icon={Play}
                text={isLoading ? 'Testing...' : 'Test Content'}
              />
            </Flex>
          </Stack>
        </SectionCard>

        <SectionCard title="Preset Examples" subtitle="Run common test cases without viewing offensive text">
          <Grid columns={[1, 2, 3]} gap={3}>
            {PRESET_EXAMPLES.map((preset) => (
              <Card key={preset.name} padding={4} radius={2} shadow={1}>
                <Flex align="center" justify="space-between" gap={2}>
                  <Stack space={1}>
                    <Text size={1} weight="semibold">{preset.name}</Text>
                    <Text size={0} muted>{preset.type}</Text>
                  </Stack>
                  <Button
                    mode="ghost"
                    size={1}
                    onClick={() => runTest(preset.content, preset.type)}
                    disabled={isLoading}
                    icon={Play}
                    text="Run"
                  />
                </Flex>
              </Card>
            ))}
          </Grid>
        </SectionCard>

        <SectionCard
          title="Test Results"
          subtitle={results.length > 0 ? `${results.length} results` : undefined}
        >
          <Flex justify="flex-end" style={{ marginBottom: 8 }}>
            {results.length > 0 && (
              <Button mode="ghost" text="Clear results" onClick={() => setResults([])} />
            )}
          </Flex>

          {results.length === 0 ? (
            <PanelEmpty
              title="No test results yet"
              description="Run a test or preset to see moderation results here."
            />
          ) : (
            <Stack space={3}>
              {results.map((result) => (
                <Card key={result.id} padding={4} radius={2} shadow={1}>
                  <Stack space={3}>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={2}>
                      <Stack space={1}>
                        <Text size={1} weight="semibold">{formatCategoryLabel(result.type)}</Text>
                        <Text size={0} muted>{formatTime(result.timestamp)}</Text>
                      </Stack>
                      <Flex gap={2} wrap="wrap">
                        <Badge tone={result.source === 'groq' ? 'primary' : 'caution'}>
                          {formatSourceLabel(result.source, result.model)}
                        </Badge>
                        <Badge tone={result.action === 'allow' ? 'positive' : 'caution'}>
                          {result.severity}
                        </Badge>
                        <Badge tone={result.action === 'allow' ? 'positive' : 'critical'}>
                          {result.action}
                        </Badge>
                      </Flex>
                    </Flex>

                    <Card padding={3} radius={1} tone="caution">
                      <Text size={1} style={{ fontStyle: 'italic' }}>&quot;{result.content}&quot;</Text>
                    </Card>

                    <Text size={1} muted>{result.reason}</Text>

                    {result.patterns.length > 0 && (
                      <Flex gap={2} wrap="wrap">
                        {result.patterns.map((pattern) => (
                          <Badge key={pattern} tone="default">{formatCategoryLabel(pattern)}</Badge>
                        ))}
                      </Flex>
                    )}

                    <Flex align="center" justify="space-between">
                      <Stack space={1}>
                        <Text size={1}>
                          Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
                        </Text>
                        {typeof result.latencyMs === 'number' && (
                          <Text size={0} muted>Latency: {result.latencyMs}ms</Text>
                        )}
                      </Stack>
                      <Badge tone={result.action === 'allow' ? 'positive' : 'critical'}>
                        {result.action === 'allow' ? 'Passed' : 'Flagged'}
                      </Badge>
                    </Flex>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </SectionCard>

        {settings && (
          <Card padding={4} radius={2} shadow={1}>
            <Flex align="center" gap={3}>
              <Settings style={{ width: 20, height: 20 }} />
              <Stack space={2}>
                <Text size={1} weight="semibold">Current Settings</Text>
                <Flex gap={2} wrap="wrap">
                  <Badge tone={settings.enabled ? 'positive' : 'caution'}>
                    {settings.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge tone="primary">Severity: {settings.severity}</Badge>
                  <Badge tone={settings.useModelModeration !== false ? 'positive' : 'caution'}>
                    Model: {settings.useModelModeration !== false ? 'GROQ' : 'Regex only'}
                  </Badge>
                  <Badge tone={settings.autoBan.enabled ? 'positive' : 'caution'}>
                    Auto-ban: {settings.autoBan.enabled ? 'On' : 'Off'}
                  </Badge>
                </Flex>
              </Stack>
            </Flex>
          </Card>
        )}
      </PanelShell>
    </Stack>
  )
}
