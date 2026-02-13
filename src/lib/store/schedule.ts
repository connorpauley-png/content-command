import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarSlot, IndustryTemplate } from '@/types'

interface ScheduleStore {
  weeklySlots: CalendarSlot[]
  addSlot: (slot: CalendarSlot) => void
  removeSlot: (dayOfWeek: number, time: string, accountId: string) => void
  updateSlot: (oldSlot: CalendarSlot, newSlot: CalendarSlot) => void
  clearWeek: () => void
  fillFromTemplate: (template: IndustryTemplate, accountIds: string[]) => void
  setSlots: (slots: CalendarSlot[]) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      weeklySlots: [],

      addSlot: (slot) =>
        set((state) => ({ weeklySlots: [...state.weeklySlots, slot] })),

      removeSlot: (dayOfWeek, time, accountId) =>
        set((state) => ({
          weeklySlots: state.weeklySlots.filter(
            (s) => !(s.dayOfWeek === dayOfWeek && s.time === time && s.accountId === accountId)
          ),
        })),

      updateSlot: (oldSlot, newSlot) =>
        set((state) => ({
          weeklySlots: state.weeklySlots.map((s) =>
            s.dayOfWeek === oldSlot.dayOfWeek &&
            s.time === oldSlot.time &&
            s.accountId === oldSlot.accountId
              ? newSlot
              : s
          ),
        })),

      clearWeek: () => set({ weeklySlots: [] }),

      fillFromTemplate: (template, accountIds) => {
        if (!template?.weeklySchedule?.length || !accountIds.length) return
        const slots: CalendarSlot[] = template.weeklySchedule.map((slot, i) => ({
          ...slot,
          accountId: slot.accountId || accountIds[i % accountIds.length],
        }))
        set({ weeklySlots: slots })
      },

      setSlots: (slots) => set({ weeklySlots: slots }),
    }),
    { name: 'content-command-schedule' }
  )
)
