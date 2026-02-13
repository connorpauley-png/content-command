import React from 'react'
import { colors, fonts, typeScale, spacing } from './design-system'
import type { TemplateData } from './quote-card'

export function BeforeAfterElement(data: TemplateData): React.ReactNode {
  const caption = (data.caption as string) || (data.headline as string) || ''
  const brandName = (data.brandName as string) || (data.company as string) || ''

  const labelStyle = {
    fontSize: `${typeScale.caption}px`,
    fontFamily: fonts.mono,
    color: colors.gold,
    letterSpacing: '4px',
    textTransform: 'uppercase' as const,
    marginBottom: `${spacing.xs}px`,
  }

  const blockStyle = (color: string) => ({
    display: 'flex' as const,
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: color,
    borderRadius: '4px',
  })

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      padding: `${spacing.xl}px`,
      fontFamily: fonts.body,
    }
  },
    // Split area
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'row' as const,
        flex: 1,
        gap: '0px',
      }
    },
      // Before
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column' as const, flex: 1, marginRight: `${spacing.sm}px` }
      },
        React.createElement('div', { style: labelStyle }, 'BEFORE'),
        React.createElement('div', { style: blockStyle('rgba(139, 69, 19, 0.3)') },
          React.createElement('div', {
            style: { fontSize: '48px', color: 'rgba(245,245,240,0.15)' }
          }, '\u25A0')
        ),
      ),
      // Gold divider
      React.createElement('div', {
        style: {
          width: '2px',
          backgroundColor: colors.gold,
          marginTop: `${spacing.md}px`,
          marginBottom: `${spacing.md}px`,
        }
      }),
      // After
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column' as const, flex: 1, marginLeft: `${spacing.sm}px` }
      },
        React.createElement('div', { style: labelStyle }, 'AFTER'),
        React.createElement('div', { style: blockStyle('rgba(129, 199, 132, 0.15)') },
          React.createElement('div', {
            style: { fontSize: '48px', color: 'rgba(245,245,240,0.15)' }
          }, '\u25A0')
        ),
      ),
    ),
    // Caption
    caption ? React.createElement('div', {
      style: {
        fontSize: `${typeScale.body}px`,
        color: colors.textMuted,
        fontFamily: fonts.body,
        marginTop: `${spacing.sm}px`,
        textAlign: 'center' as const,
      }
    }, caption) : null,
    brandName ? React.createElement('div', {
      style: {
        fontSize: '14px',
        color: 'rgba(245,245,240,0.25)',
        fontFamily: fonts.mono,
        marginTop: `${spacing.xs}px`,
        textAlign: 'center' as const,
      }
    }, brandName) : null,
  )
}
