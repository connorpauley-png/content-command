import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const CONFIG_PATH = join(process.cwd(), 'config.json')

export async function GET() {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ setupComplete: false })
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json()
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to save config' },
      { status: 500 }
    )
  }
}
