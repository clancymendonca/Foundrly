export class RateLimiter {
  private calls: Map<string, number[]> = new Map()

  constructor(
    private readonly maxCalls: number = 10,
    private readonly windowMs: number = 60000
  ) {}

  canMakeCall(service: string): boolean {
    const now = Date.now()
    const calls = this.calls.get(service) || []
    const validCalls = calls.filter((time) => now - time < this.windowMs)

    if (validCalls.length >= this.maxCalls) {
      return false
    }

    validCalls.push(now)
    this.calls.set(service, validCalls)
    return true
  }
}

export const groqRateLimiter = new RateLimiter(30, 60000)
