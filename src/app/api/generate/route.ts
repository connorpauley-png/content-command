import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentOrg } from '@/lib/tenant'
import { getTemplateById, fillTemplate, SYSTEM_TEMPLATES } from '@/lib/templates'

// Lazy-load OpenAI only when needed
async function getOpenAI() {
  const OpenAI = (await import('openai')).default
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body
    
    const org = getCurrentOrg()

    switch (action) {
      case 'from_template': {
        // Generate content from a template
        const { templateId, variables, photoUrls } = body
        
        const template = getTemplateById(templateId)
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }
        
        // If template has captionTemplate, use it directly
        // Otherwise, use AI to generate from promptTemplate
        let content: string
        
        if (template.captionTemplate) {
          content = fillTemplate(template, variables || {})
        } else if (process.env.OPENAI_API_KEY) {
          // Use AI to generate only if key is configured
          const prompt = fillTemplate(template, variables || {})
          const openai = await getOpenAI()
          
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a social media copywriter for a ${org.industry.replace('_', ' ')} business. 
                         Brand voice: ${org.brandVoice}. 
                         NEVER use emojis. 
                         Keep it authentic and direct.`
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.7,
          })
          
          content = completion.choices[0]?.message?.content || template.captionTemplate || ''
        } else {
          // Fallback to prompt template as content (user can edit)
          content = fillTemplate(template, variables || {})
        }
        
        // Remove any emojis that slipped through
        content = content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
        
        // Create draft post
        const { data, error } = await supabaseAdmin
          .from('cc_posts')
          .insert({
            content,
            platforms: template.platforms,
            status: template.settings.autoApproveEligible ? 'approved' : 'idea',
            photo_urls: photoUrls || [],
            photo_source: photoUrls?.length ? 'companycam' : null,
            ai_generated: !template.captionTemplate,
            posted_ids: {},
            tags: [template.type, template.industry || 'general'],
            notes: `Generated from template: ${template.name}`,
          })
          .select()
          .single()
        
        if (error) throw error
        
        return NextResponse.json({ 
          success: true, 
          post: data,
          template: template.name,
          autoApproved: template.settings.autoApproveEligible 
        })
      }
      
      case 'from_photos': {
        // Analyze photos and generate appropriate content
        const { photoUrls, projectName, timeHours } = body
        
        if (!photoUrls?.length) {
          return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
        }
        
        // Determine template based on photo count
        const template = photoUrls.length >= 2 
          ? getTemplateById('tpl-before-after')
          : SYSTEM_TEMPLATES.find(t => t.type === 'transformation')
        
        if (!template) {
          return NextResponse.json({ error: 'No suitable template' }, { status: 400 })
        }
        
        const content = fillTemplate(template, {
          hours: timeHours || 0,
          projectName: projectName || '',
        })
        
        const { data, error } = await supabaseAdmin
          .from('cc_posts')
          .insert({
            content,
            platforms: template.platforms,
            status: 'idea',
            photo_urls: photoUrls,
            photo_source: 'companycam',
            ai_generated: false,
            posted_ids: {},
            tags: ['before-after', 'transformation'],
            notes: projectName ? `Project: ${projectName}` : 'Auto-generated from photos',
          })
          .select()
          .single()
        
        if (error) throw error
        
        return NextResponse.json({ success: true, post: data })
      }
      
      case 'from_voice': {
        // Transcribe voice memo and generate content (placeholder)
        // Would use Whisper API in production
        return NextResponse.json({ error: 'Voice not yet implemented' }, { status: 501 })
      }
      
      case 'bulk_from_ideas': {
        // Generate multiple posts from a list of ideas
        const { ideas } = body
        
        if (!ideas?.length) {
          return NextResponse.json({ error: 'No ideas provided' }, { status: 400 })
        }
        
        const posts = []
        for (const idea of ideas) {
          const { data, error } = await supabaseAdmin
            .from('cc_posts')
            .insert({
              content: idea.content,
              platforms: idea.platforms || ['instagram', 'facebook'],
              status: 'idea',
              photo_urls: idea.photoUrls || [],
              photo_source: idea.photoUrls?.length ? 'companycam' : null,
              ai_generated: true,
              posted_ids: {},
              tags: idea.tags || [],
              notes: idea.notes || null,
            })
            .select()
            .single()
          
          if (!error && data) {
            posts.push(data)
          }
        }
        
        return NextResponse.json({ success: true, posts, count: posts.length })
      }
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ 
      error: 'Generation failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Return available templates
  const org = getCurrentOrg()
  const templates = SYSTEM_TEMPLATES.filter(t => 
    t.industry === null || t.industry === org.industry
  )
  
  return NextResponse.json({ 
    templates,
    org: {
      name: org.name,
      industry: org.industry,
      brandVoice: org.brandVoice,
    }
  })
}
