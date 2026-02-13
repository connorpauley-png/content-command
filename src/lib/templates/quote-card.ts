import React from 'react'
import { colors, fonts, typeScale, spacing } from './design-system'

export interface TemplateData {
  quote?: string
  author?: string
  company?: string
  brandName?: string
  [key: string]: unknown
}

export function QuoteCardElement(data: TemplateData): React.ReactNode {
  const quote = data.quote || 'Quality is never an accident; it is always the result of intelligent effort.'
  const author = data.author || ''
  const company = data.company || data.brandName || ''

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      padding: `${spacing.xl}px`,
      fontFamily: fonts.body,
    }
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'stretch',
        flex: 1,
      }
    },
      // Gold vertical line
      React.createElement('div', {
        style: {
          width: '2px',
          backgroundColor: colors.gold,
          marginRight: `${spacing.md}px`,
          marginTop: '20%',
          marginBottom: '20%',
        }
      }),
      // Quote content
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
            fontSize: `${Math.min(56, Math.max(40, 2400 / quote.length))}px`,
            fontFamily: fonts.headline,
            color: colors.text,
            lineHeight: 1.3,
            marginBottom: `${spacing.md}px`,
          }
        }, `\u201C${quote}\u201D`),
        author ? React.createElement('div', {
          style: {
            fontSize: `${typeScale.caption}px`,
            fontFamily: fonts.mono,
            color: colors.textMuted,
            letterSpacing: '3px',
            textTransform: 'uppercase' as const,
            marginBottom: `${spacing.xs}px`,
          }
        }, `\u2014 ${author}`) : null,
        company ? React.createElement('div', {
          style: {
            fontSize: '14px',
            fontFamily: fonts.mono,
            color: 'rgba(245, 245, 240, 0.3)',
          }
        }, company) : null,
      )
    )
  )
}
