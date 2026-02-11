// Internal scheduler — runs auto-publish check every 5 minutes
// Starts automatically when the app loads

let intervalId: ReturnType<typeof setInterval> | null = null
const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function runAutoPublish() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3034'
    const res = await fetch(`${baseUrl}/api/cron/autopublish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.published > 0 || data.failed > 0) {
      console.log(`[Scheduler] Auto-published: ${data.published} success, ${data.failed} failed`)
    }
  } catch (err) {
    console.error('[Scheduler] Auto-publish check failed:', err)
  }
}

export function startScheduler() {
  if (intervalId) return // Already running

  console.log('[Scheduler] Starting auto-publish checker (every 5 min)')

  // Run immediately on start to catch anything overdue
  setTimeout(() => runAutoPublish(), 10000) // 10s delay to let server fully boot

  intervalId = setInterval(runAutoPublish, INTERVAL_MS)
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('[Scheduler] Stopped')
  }
}
