import { QuoteCard } from './quote-card';
import { BeforeAfter } from './before-after';
import { Testimonial } from './testimonial';
import { StatCard } from './stat-card';
import { Flyer } from './flyer';
import { Checklist } from './checklist';
import { HotTake } from './hot-take';
import { XvsY } from './x-vs-y';
import { CrewSpotlight } from './crew-spotlight';
import { NumbersGrid } from './numbers-grid';

export interface TemplateMetadata {
  name: string;
  description: string;
  requiredFields: string[];
  defaultWidth: number;
  defaultHeight: number;
  render: (data: Record<string, unknown>) => string;
}

export const TEMPLATES: Record<string, TemplateMetadata> = {
  'quote-card': {
    name: 'Quote Card',
    description: 'Bold quote with gold accent bar on dark background.',
    requiredFields: ['quote'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: QuoteCard as unknown as TemplateMetadata['render'],
  },
  'before-after': {
    name: 'Before & After',
    description: 'Split layout comparing before and after states.',
    requiredFields: [],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: BeforeAfter as unknown as TemplateMetadata['render'],
  },
  'testimonial': {
    name: 'Testimonial',
    description: 'Customer review with star rating and attribution.',
    requiredFields: ['quote'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: Testimonial as unknown as TemplateMetadata['render'],
  },
  'stat-card': {
    name: 'Stat Card',
    description: 'One big number with label and gold border frame.',
    requiredFields: ['label'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: StatCard as unknown as TemplateMetadata['render'],
  },
  'flyer': {
    name: 'Flyer',
    description: 'Service flyer with gold header, bullets, and CTA.',
    requiredFields: ['headline'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: Flyer as unknown as TemplateMetadata['render'],
  },
  'checklist': {
    name: 'Checklist',
    description: 'Numbered checklist with gold header block.',
    requiredFields: ['title', 'items'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: Checklist as unknown as TemplateMetadata['render'],
  },
  'hot-take': {
    name: 'Hot Take',
    description: 'Bold statement with gold accent bar.',
    requiredFields: [],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: HotTake as unknown as TemplateMetadata['render'],
  },
  'x-vs-y': {
    name: 'X vs Y',
    description: 'Two-column comparison with gold divider.',
    requiredFields: [],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: XvsY as unknown as TemplateMetadata['render'],
  },
  'crew-spotlight': {
    name: 'Crew Spotlight',
    description: 'Team member highlight with role and achievements.',
    requiredFields: ['name'],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: CrewSpotlight as unknown as TemplateMetadata['render'],
  },
  'numbers-grid': {
    name: 'Numbers Grid',
    description: '2x2 grid of stats with gold numbers.',
    requiredFields: [],
    defaultWidth: 1080,
    defaultHeight: 1080,
    render: NumbersGrid as unknown as TemplateMetadata['render'],
  },
};

export function renderTemplate(
  templateId: string,
  data: Record<string, unknown>,
  options?: { width?: number; height?: number }
): { html: string; width: number; height: number } {
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown template: ${templateId}. Available: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  return {
    html: template.render(data),
    width: options?.width || template.defaultWidth,
    height: options?.height || template.defaultHeight,
  };
}
