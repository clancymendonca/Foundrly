import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import { Card, Stack, Text, Button, Flex, Select, TextInput, Label, Spinner } from '@sanity/ui'
import { Heart } from 'lucide-react'
import {
  PanelShell,
  PanelBadge,
  PanelLoading,
  PanelEmpty,
  PanelError,
  SectionCard,
  formatDateTime,
} from './shared'

interface Submission {
  _id: string
  name?: string
  email?: string
  startupTitle?: string
  company?: string
  status?: string
  submittedAt?: string
  message?: string
}

const STATUS_OPTIONS = [
  { value: 'all', title: 'All statuses' },
  { value: 'new', title: 'New' },
  { value: 'contacted', title: 'Contacted' },
  { value: 'in-discussion', title: 'In Discussion' },
  { value: 'interested', title: 'Interested' },
  { value: 'not-interested', title: 'Not Interested' },
  { value: 'closed', title: 'Closed' },
]

export const InterestedSubmissionsPanel = () => {
  const client = useClient({ apiVersion: '2025-01-02' })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await client.fetch<Submission[]>(`
        *[_type == "interestedSubmission"] | order(submittedAt desc) {
          _id, name, email, startupTitle, company, status, submittedAt, message
        }
      `)
      setSubmissions(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }, [client])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        (s.name?.toLowerCase().includes(q) ?? false) ||
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.startupTitle?.toLowerCase().includes(q) ?? false) ||
        (s.company?.toLowerCase().includes(q) ?? false)
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [submissions, search, statusFilter])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    setError(null)
    try {
      await client.patch(id).set({ status }).commit()
      await loadSubmissions()
    } catch (err) {
      console.error(err)
      setError('Failed to update submission status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return <PanelLoading message="Loading submissions..." />
  }

  return (
    <PanelShell
      icon={<Heart style={{ width: 32, height: 32 }} />}
      title="Interested Submissions"
      subtitle="Manage investor and partner interest submissions"
      badges={
        <PanelBadge tone="primary">
          {filtered.length} of {submissions.length}
        </PanelBadge>
      }
      onRefresh={loadSubmissions}
    >
      {error && <PanelError message={error} onRetry={loadSubmissions} />}

      <SectionCard title="Filters">
        <Flex gap={4} wrap="wrap">
          <Stack space={2} style={{ flex: 1, minWidth: 200 }}>
            <Label size={1}>Search</Label>
            <TextInput
              placeholder="Name, email, startup, company..."
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            />
          </Stack>
          <Stack space={2} style={{ minWidth: 180 }}>
            <Label size={1}>Status</Label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.currentTarget as HTMLSelectElement).value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.title}</option>
              ))}
            </Select>
          </Stack>
        </Flex>
      </SectionCard>

      {submissions.length === 0 ? (
        <PanelEmpty
          title="No submissions yet"
          description="Interested submission documents will appear here when users express interest in startups."
        />
      ) : filtered.length === 0 ? (
        <PanelEmpty
          title="No matching submissions"
          description="Try adjusting your search or status filter."
        />
      ) : (
        <Stack space={2}>
          {filtered.map((submission) => (
            <Card key={submission._id} padding={4} radius={2} shadow={1}>
              <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
                <Stack space={2} style={{ flex: 1 }}>
                  <Text size={1} weight="semibold">{submission.name}</Text>
                  <Text size={1} muted>{submission.email}</Text>
                  <Text size={1}>Startup: {submission.startupTitle}</Text>
                  {submission.company && (
                    <Text size={0} muted>Company: {submission.company}</Text>
                  )}
                  {submission.submittedAt && (
                    <Text size={0} muted>
                      Submitted: {formatDateTime(submission.submittedAt)}
                    </Text>
                  )}
                  {submission.message && (
                    <Text size={0} muted>{submission.message.slice(0, 200)}</Text>
                  )}
                </Stack>
                <Flex align="center" gap={2}>
                  {updatingId === submission._id && <Spinner />}
                  <Stack space={2}>
                    <Label size={0}>Status</Label>
                    <Select
                      value={submission.status || 'new'}
                      disabled={updatingId === submission._id}
                      onChange={(e) =>
                        updateStatus(submission._id, (e.currentTarget as HTMLSelectElement).value)
                      }
                    >
                      {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                        <option key={o.value} value={o.value}>{o.title}</option>
                      ))}
                    </Select>
                  </Stack>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Stack>
      )}
    </PanelShell>
  )
}
