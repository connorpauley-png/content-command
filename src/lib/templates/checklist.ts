import React from 'react'
import { colors, fonts, typeScale, spacing } from './design-system'
import type { TemplateData } from './quote-card'

export function ChecklistElement(data: TemplateData): React.ReactNode {
  const title = (data.title as string) || (data.headline as string) || '5 Tips You Need to Know'
  const items = (data.items as string[]) || [
    'Start with a clear plan',
    'Use quality materials',
    'Measure twice, cut once',
    'Stay consistent',
    'Review your work',
  ]
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
    }
  },
    // Headline
    React.createElement('div', {
      style: {
        fontSize: `${typeScale.h1}px`,
        fontFamily: fonts.body,
        fontWeight: 700,
        color: colors.text,
        marginBottom: `${spacing.lg}px`,
        lineHeight: 1.2,
      }
    }, title),
    // Items
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, flex: 1, justifyContent: 'center' }
    },
      ...items.slice(0, 5).map((item, i) =>
        React.createElement('div', {
          key: i,
          style: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'baseline',
            marginBottom: `${spacing.sm}px`,
          }
        },
          React.createElement('div', {
            style: {
              fontSize: `${typeScale.h2}px`,
              fontFamily: fonts.headline,
              color: colors.gold,
              marginRight: `${spacing.sm}px`,
              width: '50px',
            }
          }, `${i + 1}.`),
          React.createElement('div', {
            style: {
              fontSize: `${typeScale.body}px`,
              fontFamily: fonts.body,
              color: colors.text,
              lineHeight: 1.5,
              flex: 1,
            }
          }, item),
        )
      ),
    ),
    // Bottom bar
    brandName ? React.createElement('div', {
      style: {
        borderTop: `1px solid ${colors.border}`,
        paddingTop: `${spacing.xs}px`,
        fontSize: '14px',
        fontFamily: fonts.mono,
        color: 'rgba(245,245,240,0.25)',
      }
    }, brandName) : null,
  )
}
