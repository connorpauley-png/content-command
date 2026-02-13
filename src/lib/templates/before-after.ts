import { htmlWrap, baseBg, headerBar, footerBar } from './html-base';

interface BeforeAfterData {
  beforeLabel?: string;
  afterLabel?: string;
  beforeTitle?: string;
  afterTitle?: string;
  beforeDesc?: string;
  afterDesc?: string;
  description?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function BeforeAfter(data: BeforeAfterData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const beforeText = data.beforeLabel || data.beforeTitle || 'BEFORE';
  const afterText = data.afterLabel || data.afterTitle || 'AFTER';
  const desc = data.description || data.beforeDesc || '';

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('TRANSFORMATION', co)}
    <div style="flex:1;display:flex;position:relative;margin-top:30px;overflow:hidden;">
      <!-- Left: Before -->
      <div style="width:50%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:rgba(200,60,60,0.06);border-radius:8px 0 0 8px;position:relative;">
        <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:#CC4444;text-transform:uppercase;letter-spacing:5px;margin-bottom:20px;">✕</span>
        <span style="font-family:'Playfair Display',serif;font-weight:900;font-size:72px;color:rgba(255,255,255,0.9);text-transform:uppercase;">${beforeText}</span>
      </div>
      <!-- Diagonal divider -->
      <div style="position:absolute;left:50%;top:0;bottom:0;width:3px;background:linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(255,255,255,0.3), rgba(255,255,255,0.0));transform:skewX(-3deg);z-index:3;"></div>
      <!-- VS badge -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;background:#0F1A14;border:2px solid ${a};display:flex;align-items:center;justify-content:center;z-index:4;">
        <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:16px;color:${a};">VS</span>
      </div>
      <!-- Right: After -->
      <div style="width:50%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:rgba(13,53,24,0.3);border-radius:0 8px 8px 0;">
        <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;color:${a};text-transform:uppercase;letter-spacing:5px;margin-bottom:20px;">✓</span>
        <span style="font-family:'Playfair Display',serif;font-weight:900;font-size:72px;color:rgba(255,255,255,0.9);text-transform:uppercase;">${afterText}</span>
      </div>
    </div>
    ${desc ? `<div style="margin-top:24px;margin-bottom:8px;"><p style="font-family:'Inter',sans-serif;font-weight:400;font-size:20px;color:#999999;line-height:1.5;">${desc}</p></div>` : ''}
    ${footerBar(co)}
  </div>
</div>`);
}
