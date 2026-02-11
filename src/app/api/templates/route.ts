import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SYSTEM_TEMPLATES } from '@/lib/templates'

// GET /api/templates — returns templates from DB or fallback to static ones
export async function GET() {
  try {
    // Try DB first (cc_templates table)
    const { data: dbTemplates, error } = await supabaseAdmin
      .from('cc_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (!error && dbTemplates && dbTemplates.length > 0) {
      return NextResponse.json({
        templates: dbTemplates,
        source: 'database',
      })
    }

    // Fallback to static templates from lib
    return NextResponse.json({
      templates: SYSTEM_TEMPLATES || [],
      source: 'static',
    })
  } catch {
    // If cc_templates table doesn't exist yet, return static
    return NextResponse.json({
      templates: SYSTEM_TEMPLATES || [],
      source: 'static',
    })
  }
}
