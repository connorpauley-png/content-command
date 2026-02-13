// V6 — Editorial design system
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">`;

export function htmlWrap(body: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
${FONTS}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Inter', sans-serif; }
</style>
</head><body>${body}</body></html>`;
}

export function baseBg(opts?: { redTint?: boolean }): string {
  const glowColor = opts?.redTint ? '#1a0505' : '#0D3518';
  return `background: radial-gradient(ellipse at 50% 100%, ${glowColor} 0%, #0F1A14 50%, #111C15 100%);`;
}

export function headerBar(leftLabel: string, rightContent: string, opts?: { pill?: boolean; pillBg?: string }): string {
  const leftEl = opts?.pill
    ? `<span style="font-family:'Inter',sans-serif;font-weight:600;font-size:12px;color:#ffffff;text-transform:uppercase;letter-spacing:2px;background:${opts.pillBg || '#8B0000'};padding:6px 14px;border-radius:20px;">${leftLabel}</span>`
    : `<span style="font-family:'Inter',sans-serif;font-weight:600;font-size:14px;color:#888888;text-transform:uppercase;letter-spacing:3px;">${leftLabel}</span>`;
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 20px 0;">
    ${leftEl}
    <span style="font-family:'Inter',sans-serif;font-weight:500;font-size:16px;color:rgba(255,255,255,0.7);">${rightContent}</span>
  </div>
  <div style="width:100%;height:1px;background:rgba(255,255,255,0.2);"></div>`;
}

export function footerBar(companyName?: string, website?: string): string {
  const co = companyName || 'COLLEGE BROS';
  const site = website || 'collegebrosllc.com';
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
    <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:13px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;">${co}</span>
    <span style="font-family:'Inter',sans-serif;font-weight:400;font-size:13px;color:rgba(255,255,255,0.25);">${site}</span>
  </div>`;
}

// Diagonal rain dash texture
export function textureDashes(): string {
  const dashes: string[] = [];
  for (let i = 0; i < 80; i++) {
    const x = Math.round((Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5) * 1080);
    const y = Math.round((Math.cos(i * 5.1 + 1.3) * 0.5 + 0.5) * 1080);
    const rot = 135 + Math.round(Math.sin(i * 3.7) * 15);
    dashes.push(`<div style="position:absolute;left:${x}px;top:${y}px;width:2px;height:${15 + Math.round(Math.abs(Math.sin(i * 2.3)) * 6)}px;background:white;opacity:0.06;transform:rotate(${rot}deg);border-radius:1px;"></div>`);
  }
  return `<div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">${dashes.join('')}</div>`;
}

// Geometric wireframe texture
export function textureWireframe(): string {
  const shapes: string[] = [];
  for (let i = 0; i < 12; i++) {
    const x = 500 + Math.round(Math.sin(i * 2.5) * 350);
    const y = 50 + Math.round(Math.abs(Math.cos(i * 1.8)) * 400);
    const size = 60 + Math.round(Math.abs(Math.sin(i * 3.1)) * 80);
    shapes.push(`<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border:1px solid rgba(150,150,150,0.08);transform:rotate(45deg);"></div>`);
  }
  return `<div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">${shapes.join('')}</div>`;
}
