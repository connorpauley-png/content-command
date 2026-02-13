import React from 'react'
import { QuoteCardElement } from './quote-card'
import { TestimonialElement } from './testimonial'
import { BeforeAfterElement } from './before-after'
import { ChecklistElement } from './checklist'
import { FlyerElement } from './flyer'

export type { TemplateData } from './quote-card'

export const TEMPLATE_REGISTRY: Record<string, (data: Record<string, unknown>) => React.ReactNode> = {
  'quote-card': QuoteCardElement,
  'testimonial': TestimonialElement,
  'before-after': BeforeAfterElement,
  'checklist': ChecklistElement,
  'flyer': FlyerElement,
}

export const TEMPLATE_INFO: Record<string, { name: string; description: string; requiredFields: string[] }> = {
  'quote-card': { name: 'Quote Card', description: 'Bold quote with gold accent bar on dark background.', requiredFields: ['quote'] },
  'testimonial': { name: 'Testimonial', description: 'Customer review with star rating and attribution.', requiredFields: ['quote'] },
  'before-after': { name: 'Before & After', description: 'Split layout comparing before and after states.', requiredFields: [] },
  'checklist': { name: 'Checklist', description: 'Numbered checklist with tips.', requiredFields: ['title', 'items'] },
  'flyer': { name: 'Flyer', description: 'Service flyer with gold header and CTA.', requiredFields: ['headline'] },
}
