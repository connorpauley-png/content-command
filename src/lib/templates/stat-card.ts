import { htmlWrap, baseBg, headerBar, footerBar, textureDashes } from './html-base';

interface StatCardData {
  stat?: string;
  value?: string;
  label: string;
  context?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function StatCard(data: StatCardData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const statValue = data.stat || data.value || '—';

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('BY THE NUMBERS', co)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      <span style="font-family:'Inter',sans-serif;font-weight:900;font-size:260px;color:#ffffff;line-height:0.9;letter-spacing:-10px;">${statValue}</span>
      <div style="width:60px;height:3px;background:${a};margin:30px 0 24px 0;"></div>
      <span style="font-family:'Inter',sans-serif;font-weight:700;font-size:28px;color:${a};text-transform:uppercase;letter-spacing:5px;">${data.label}</span>
      ${data.context ? `<span style="font-family:'Inter',sans-serif;font-weight:400;font-size:20px;color:#777777;margin-top:20px;max-width:600px;line-height:1.5;">${data.context}</span>` : ''}
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
