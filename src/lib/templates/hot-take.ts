import { htmlWrap, headerBar, footerBar, textureDashes } from './html-base';

interface HotTakeData {
  take?: string;
  statement?: string;
  author?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function HotTake(data: HotTakeData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const takeText = data.take || data.statement || '';

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;background:radial-gradient(ellipse at 50% 100%, #1a0505 0%, #0F1A14 50%, #111C15 100%);overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('HOT TAKE', co, { pill: true, pillBg: '#8B0000' })}
    <div style="flex:1;display:flex;align-items:center;padding:40px 0;">
      <div style="display:flex;gap:32px;">
        <div style="width:4px;background:${a};border-radius:2px;flex-shrink:0;align-self:stretch;"></div>
        <p style="font-family:'Playfair Display',serif;font-weight:900;font-size:58px;color:#ffffff;line-height:1.12;max-width:900px;">${takeText}</p>
      </div>
    </div>
    ${data.author ? `<div style="margin-bottom:16px;"><span style="font-family:'Inter',sans-serif;font-weight:500;font-size:20px;color:#999999;">— ${data.author}</span></div>` : ''}
    ${footerBar(co)}
  </div>
</div>`);
}
