import { htmlWrap, baseBg, headerBar, footerBar, textureWireframe } from './html-base';

interface ChecklistData {
  title: string;
  items: string[];
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function Checklist(data: ChecklistData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const items = data.items || [];

  const rows = items.map((item, i) => `
    <div style="display:flex;align-items:center;gap:24px;padding:${Math.max(24, Math.floor(480 / items.length))}px 0;${i < items.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.08);' : ''}">
      <div style="width:36px;height:36px;border-radius:50%;border:2px solid ${a};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-family:'Inter',sans-serif;font-weight:700;font-size:16px;color:${a};">✓</span>
      </div>
      <span style="font-family:'Inter',sans-serif;font-weight:500;font-size:28px;color:#ffffff;line-height:1.3;">${item}</span>
    </div>`).join('');

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureWireframe()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('CHECKLIST', co)}
    <div style="margin-top:40px;">
      <h1 style="font-family:'Playfair Display',serif;font-weight:900;font-size:56px;color:#ffffff;line-height:1.1;">${data.title}</h1>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      ${rows}
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
