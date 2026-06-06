type BadgeTone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

export function submissionStatusTone(status?: string): BadgeTone {
  switch (status) {
    case 'new':
      return 'primary'
    case 'contacted':
    case 'in-discussion':
      return 'caution'
    case 'interested':
      return 'positive'
    case 'not-interested':
    case 'closed':
      return 'default'
    default:
      return 'primary'
  }
}

export function severityTone(severity: string): BadgeTone {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'critical'
    case 'medium':
      return 'caution'
    case 'low':
      return 'positive'
    default:
      return 'default'
  }
}

export function reportTypeTone(type: string): BadgeTone {
  switch (type) {
    case 'user':
      return 'critical'
    case 'comment':
      return 'caution'
    case 'startup':
      return 'primary'
    default:
      return 'default'
  }
}

export function formatActivityType(type: string): string {
  return type.replace(/_/g, ' ')
}
