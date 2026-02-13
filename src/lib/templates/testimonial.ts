import React from 'react'
import { colors, fonts, typeScale, spacing } from './design-system'
import type { TemplateData } from './quote-card'

export function TestimonialElement(data: TemplateData): React.ReactNode {
  const quote = data.quote || 'Absolutely incredible work. Transformed our entire yard in one day.'
  const author = data.author || 'Happy Customer'
  const rating = (data.rating as number) || 4.9

  const stars = Array.from({ length: 5 }, (_, i) =>
    React.createElement('div', {
      key: i,
      style: { fontSize: '36px', color: colors.gold, marginRight: '8px' }
    }, '\u2605')
  )

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      padding: `${spacing.xl}px`,
      fontFamily: fonts.body,
      border: `1px solid ${colors.border}`,
    }
  },
    // Stars row
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'row' as const, marginBottom: `${spacing.md}px` }
    }, ...stars),
    // Quote
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'row' as const,
        flex: 1,
      }
    },
      React.createElement('div', {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
        }
      },
        React.createElement('div', {
          style: {
            fontSize: `${Math.min(40, Math.max(28, 2000 / quote.length))}px`,
            fontFamily: fonts.headline,
            color: colors.text,
            lineHeight: 1.35,
            marginBottom: `${spacing.md}px`,
          }
        }, `\u201C${quote}\u201D`),
        React.createElement('div', {
          style: {
            fontSize: `${typeScale.caption}px`,
            fontFamily: fonts.mono,
            color: colors.text,
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
          }
        }, author),
        React.createElement('div', {
          style: {
            fontSize: '14px',
            fontFamily: fonts.mono,
            color: colors.accent,
            marginTop: '8px',
          }
        }, 'Verified Customer'),
      ),
      // Big rating number
      React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '200px',
        }
      },
        React.createElement('div', {
          style: {
            fontSize: '120px',
            fontFamily: fonts.headline,
            color: colors.gold,
            opacity: 0.9,
          }
        }, String(rating)),
      ),
    ),
  )
}
