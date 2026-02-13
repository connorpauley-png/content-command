import { htmlWrap, baseBg, headerBar, footerBar, textureDashes } from './html-base';

interface FlyerData {
  headline: string;
  subheadline?: string;
  details?: string | string[];
  cta?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function Flyer(data: FlyerData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';

  // Handle details as string or array
  let detailItems: string[] = [];
  if (Array.isArray(data.details)) {
    detailItems = data.details;
  } else if (typeof data.details === 'string' && data.details) {
    detailItems = data.details.split(',').map(s => s.trim()).filter(Boolean);
    if (detailItems.length === 1) detailItems = [data.details as string];
  }

  const rows = detailItems.map((item, i) => `
    <div style="display:flex;align-items:center;gap:20px;padding:18px 0;${i < detailItems.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.08);' : ''}">
      <span style="font-family:'Inter',sans-serif;font-weight:700;font-size:16px;color:${a};flex-shrink:0;">→</span>
      <span style="font-family:'Inter',sans-serif;font-weight:500;font-size:24px;color:#ffffff;">${item}</span>
    </div>`).join('');

  // If details is a single string (not split into array), show as paragraph
  const detailBlock = detailItems.length > 0 ? rows :
    (data.details ? `<p style="font-family:'Inter',sans-serif;font-weight:400;font-size:22px;color:#cccccc;line-height:1.6;padding:20px 0;">${data.details}</p>` : '');

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('SPECIAL OFFER', co)}
    <div style="margin-top:50px;">
      <h1 style="font-family:'Playfair Display',serif;font-weight:900;font-size:72px;color:#ffffff;line-height:1.05;">${data.headline}</h1>
      ${data.subheadline ? `<p style="font-family:'Inter',sans-serif;font-weight:400;font-size:24px;color:#bbbbbb;margin-top:24px;line-height:1.4;">${data.subheadline}</p>` : ''}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      ${detailBlock}
    </div>
    ${data.cta ? `
    <div style="margin-bottom:16px;">
      <div style="display:inline-block;background:${a};padding:20px 40px;">
        <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:24px;color:#0F1A14;letter-spacing:1px;">${data.cta}</span>
      </div>
    </div>` : ''}
    ${footerBar(co)}
  </div>
</div>`);
}
