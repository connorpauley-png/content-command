import React from 'react'
import { colors, fonts, typeScale, spacing } from './design-system'
import type { TemplateData } from './quote-card'

export function FlyerElement(data: TemplateData): React.ReactNode {
  const headline = (data.headline as string) || (data.title as string) || 'SPRING SPECIAL'
  const subtext = (data.subtext as string) || (data.description as string) || '20% off all services this month'
  const cta = (data.cta as string) || 'BOOK NOW'
  const brandName = (data.brandName as string) || (data.company as string) || ''

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      padding: `${spacing.xl}px`,
      fontFamily: fonts.body,
      justifyContent: 'space-between',
    }
  },
    // Top section
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const }
    },
      brandName ? React.createElement('div', {
        style: {
          fontSize: `${typeScale.caption}px`,
          fontFamily: fonts.mono,
          color: colors.textMuted,
          letterSpacing: '3px',
          textTransform: 'uppercase' as const,
          marginBottom: `${spacing.md}px`,
        }
      }, brandName) : null,
    ),
    // Center content
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        flex: 1,
      }
    },
      React.createElement('div', {
        style: {
          fontSize: `${typeScale.hero}px`,
          fontFamily: fonts.headline,
          color: colors.gold,
          lineHeight: 1.1,
          marginBottom: `${spacing.md}px`,
        }
      }, headline),
      React.createElement('div', {
        style: {
          fontSize: '24px',
          fontFamily: fonts.body,
          color: colors.text,
          lineHeight: 1.5,
          maxWidth: '80%',
        }
      }, subtext),
    ),
    // CTA button
    React.createElement('div', {
      style: {
        display: 'flex',
        backgroundColor: colors.gold,
        padding: `${spacing.sm}px ${spacing.md}px`,
        alignSelf: 'flex-start',
        borderRadius: '4px',
      }
    },
      React.createElement('div', {
        style: {
          fontSize: `${typeScale.body}px`,
          fontFamily: fonts.mono,
          fontWeight: 700,
          color: colors.bg,
          letterSpacing: '3px',
          textTransform: 'uppercase' as const,
        }
      }, cta),
    ),
  )
}
