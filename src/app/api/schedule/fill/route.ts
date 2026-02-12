import { NextRequest, NextResponse } from 'next/server'
import type { AppConfig, Post } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { config, posts }: { config: AppConfig; posts: Post[] } = await req.json()

    if (!config?.accounts?.length) {
      return NextResponse.json({ error: 'No accounts configured' }, { status: 400 })
    }

    const scheduledPosts = posts.filter(p => p.status === 'scheduled')
    const unscheduled = scheduledPosts.filter(p => !p.scheduledAt)
    const alreadyScheduled = scheduledPosts.filter(p => !!p.scheduledAt)

    if (unscheduled.length === 0) {
      return NextResponse.json({ updated: [] })
    }

    const now = new Date()
    const oneHourFromNow = now.getTime() + 60 * 60 * 1000
    const twoHoursMs = 2 * 60 * 60 * 1000
    const updated: { id: string; scheduledAt: string }[] = []

    // Build per-account scheduling state
    const accountStates: Map<string, {
      postsPerWeek: number
      bestTimes: string[]
      takenSlots: number[]
      unscheduledPosts: Post[]
      intervalDays: number
    }> = new Map()

    const accountIds = Array.from(new Set(unscheduled.map(p => p.accountId)))

    for (const accountId of accountIds) {
      const account = config.accounts.find(a => a.id === accountId)
      if (!account) continue

      const bestTimes = (account.bestTimes?.length > 0 ? account.bestTimes : ['09:00', '12:00', '17:00']).sort()
      const postsPerWeek = account.postsPerWeek || 3

      accountStates.set(accountId, {
        postsPerWeek,
        bestTimes,
        takenSlots: alreadyScheduled
          .filter(p => p.accountId === accountId)
          .map(p => new Date(p.scheduledAt!).getTime()),
        unscheduledPosts: unscheduled.filter(p => p.accountId === accountId),
        intervalDays: 7 / postsPerWeek,
      })
    }

    // Build a master calendar day by day
    // For each day starting from today, assign posts across ALL accounts
    // This ensures every day has content on multiple platforms

    const startDay = new Date(now)
    startDay.setHours(0, 0, 0, 0)

    // Track how many posts each account still needs to schedule
    const remaining: Map<string, Post[]> = new Map()
    for (const [id, state] of Array.from(accountStates)) {
      remaining.set(id, [...state.unscheduledPosts])
    }

    // Calculate posts per day per account
    // e.g., 5/week = 0.714/day, 3/week = 0.428/day, 2/week = 0.285/day
    // We use an accumulator pattern: each day, add postsPerWeek/7 to each account's "budget"
    // When budget >= 1, schedule a post and subtract 1

    const budgets: Map<string, number> = new Map()
    for (const id of accountIds) {
      budgets.set(id, 0)
    }

    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const day = new Date(startDay)
      day.setDate(startDay.getDate() + dayOffset)

      // Check if all posts are scheduled
      let allDone = true
      for (const [, posts] of Array.from(remaining)) {
        if (posts.length > 0) { allDone = false; break }
      }
      if (allDone) break

      // For each account, add daily budget and schedule if >= 1
      for (const [accountId, state] of Array.from(accountStates)) {
        const accountRemaining = remaining.get(accountId)!
        if (accountRemaining.length === 0) continue

        const dailyRate = state.postsPerWeek / 7
        const currentBudget = (budgets.get(accountId) || 0) + dailyRate
        budgets.set(accountId, currentBudget)

        // Schedule as many posts as the budget allows today
        let postsToday = 0
        while (budgets.get(accountId)! >= 0.99 && accountRemaining.length > 0) {
          // Pick the best time for this post
          const timeIndex = postsToday % state.bestTimes.length
          const timeStr = state.bestTimes[timeIndex]
          const [hours, minutes] = timeStr.split(':').map(Number)

          const slot = new Date(day)
          slot.setHours(hours, minutes, 0, 0)

          // Skip if in the past
          if (slot.getTime() < oneHourFromNow) {
            postsToday++
            // Don't consume budget for skipped slots
            if (postsToday >= state.bestTimes.length) break
            continue
          }

          // Check for conflicts
          const hasConflict = state.takenSlots.some(t => Math.abs(t - slot.getTime()) < twoHoursMs)
          if (hasConflict) {
            postsToday++
            if (postsToday >= state.bestTimes.length) break
            continue
          }

          // Schedule it
          const post = accountRemaining.shift()!
          updated.push({ id: post.id, scheduledAt: slot.toISOString() })
          state.takenSlots.push(slot.getTime())
          budgets.set(accountId, budgets.get(accountId)! - 1)
          postsToday++

          // Don't schedule more posts in a day than we have bestTimes for
          if (postsToday >= state.bestTimes.length) break
        }
      }
    }

    return NextResponse.json({ updated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
