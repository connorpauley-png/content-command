import type { Platform } from '@/types'

export const platformColors: Record<Platform, { bg: string; text: string; pill: string }> = {
  instagram: { bg: 'bg-gradient-to-r from-pink-500 to-purple-500', text: 'text-white', pill: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' },
  facebook: { bg: 'bg-blue-600', text: 'text-white', pill: 'bg-blue-600 text-white' },
  linkedin: { bg: 'bg-blue-800', text: 'text-white', pill: 'bg-blue-800 text-white' },
  twitter: { bg: 'bg-sky-500', text: 'text-white', pill: 'bg-sky-500 text-white' },
  tiktok: { bg: 'bg-black', text: 'text-red-500', pill: 'bg-black text-white' },
  google_business: { bg: 'bg-green-600', text: 'text-white', pill: 'bg-green-600 text-white' },
  nextdoor: { bg: 'bg-emerald-600', text: 'text-white', pill: 'bg-emerald-600 text-white' },
}

export const platformIcons: Record<Platform, string> = {
  instagram: '📸',
  facebook: '👤',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎵',
  google_business: '🏢',
  nextdoor: '🏘️',
}
