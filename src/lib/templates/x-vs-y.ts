import { htmlWrap, baseBg, headerBar, footerBar } from './html-base';

interface XvsYData {
  xLabel?: string;
  yLabel?: string;
  xItems?: string[];
  yItems?: string[];
  xTitle?: string;
  yTitle?: string;
  xPoints?: string[];
  yPoints?: string[];
  leftTitle?: string;
  rightTitle?: string;
  leftPoints?: string[];
  rightPoints?: string[];
  points_x?: string[];
  points_y?: string[];
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function XvsY(data: XvsYData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';

  const xTitle = data.xLabel || data.xTitle || data.leftTitle || 'Option A';
  const yTitle = data.yLabel || data.yTitle || data.rightTitle || 'Option B';
  const xPts = data.xItems || data.xPoints || data.leftPoints || data.points_x || [];
  const yPts = data.yItems || data.yPoints || data.rightPoints || data.points_y || [];

  const renderX = (pts: string[]) => pts.map((pt, i) => `
    <div style="display:flex;align-items:center;gap:16px;padding:22px 0;${i < pts.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : ''}">
      <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:20px;color:#CC4444;flex-shrink:0;">✕</span>
      <span style="font-family:'Inter',sans-serif;font-weight:500;font-size:24px;color:rgba(255,255,255,0.7);line-height:1.3;">${pt}</span>
    </div>`).join('');

  const renderY = (pts: string[]) => pts.map((pt, i) => `
    <div style="display:flex;align-items:center;gap:16px;padding:22px 0;${i < pts.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : ''}">
      <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:20px;color:#44BB66;flex-shrink:0;">✓</span>
      <span style="font-family:'Inter',sans-serif;font-weight:500;font-size:24px;color:#ffffff;line-height:1.3;">${pt}</span>
    </div>`).join('');

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('COMPARISON', co)}
    <div style="flex:1;display:flex;margin-top:30px;position:relative;">
      <!-- Vertical divider -->
      <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.15);"></div>
      <!-- VS circle -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:50%;border:2px solid ${a};background:#0F1A14;display:flex;align-items:center;justify-content:center;z-index:3;">
        <span style="font-family:'Inter',sans-serif;font-weight:800;font-size:16px;color:${a};">VS</span>
      </div>
      <!-- Left -->
      <div style="width:50%;padding-right:36px;display:flex;flex-direction:column;">
        <h3 style="font-family:'Inter',sans-serif;font-weight:800;font-size:26px;color:#CC4444;margin-bottom:24px;text-transform:uppercase;letter-spacing:2px;">${xTitle}</h3>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">${renderX(xPts)}</div>
      </div>
      <!-- Right -->
      <div style="width:50%;padding-left:36px;display:flex;flex-direction:column;">
        <h3 style="font-family:'Inter',sans-serif;font-weight:800;font-size:26px;color:#44BB66;margin-bottom:24px;text-transform:uppercase;letter-spacing:2px;">${yTitle}</h3>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">${renderY(yPts)}</div>
      </div>
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
