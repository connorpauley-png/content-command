import { htmlWrap, baseBg, headerBar, footerBar } from './html-base';

interface NumbersGridData {
  stats?: { value: string; label: string }[];
  numbers?: { value: string; label: string }[];
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function NumbersGrid(data: NumbersGridData): string {
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const stats = data.stats || data.numbers || [];

  const cell = (s: { value: string; label: string }) => `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:40px 44px;">
      <span style="font-family:'Inter',sans-serif;font-weight:900;font-size:120px;color:#ffffff;line-height:1;letter-spacing:-4px;">${s.value}</span>
      <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:16px;color:#999999;text-transform:uppercase;letter-spacing:3px;margin-top:16px;">${s.label}</span>
    </div>`;

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('OUR IMPACT', co)}
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;margin-top:20px;">
      <div style="border-right:1px solid rgba(255,255,255,0.12);border-bottom:1px solid rgba(255,255,255,0.12);">${cell(stats[0] || { value: '—', label: '' })}</div>
      <div style="border-bottom:1px solid rgba(255,255,255,0.12);">${cell(stats[1] || { value: '—', label: '' })}</div>
      <div style="border-right:1px solid rgba(255,255,255,0.12);">${cell(stats[2] || { value: '—', label: '' })}</div>
      <div>${cell(stats[3] || { value: '—', label: '' })}</div>
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
