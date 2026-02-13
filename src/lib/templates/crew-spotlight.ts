import { htmlWrap, baseBg, headerBar, footerBar, textureDashes } from './html-base';

interface CrewSpotlightData {
  name: string;
  role?: string;
  quote?: string;
  achievement?: string;
  funFact?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function CrewSpotlight(data: CrewSpotlightData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('TEAM SPOTLIGHT', co)}
    <!-- Silhouette placeholder -->
    <div style="margin-top:50px;display:flex;align-items:center;gap:30px;">
      <div style="width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:40px;color:rgba(255,255,255,0.15);">👤</span>
      </div>
      <div>
        <h1 style="font-family:'Playfair Display',serif;font-weight:900;font-size:64px;color:#ffffff;line-height:1.05;">${data.name}</h1>
        ${data.role ? `<span style="font-family:'Inter',sans-serif;font-weight:700;font-size:18px;color:${a};text-transform:uppercase;letter-spacing:4px;margin-top:8px;display:block;">${data.role}</span>` : ''}
      </div>
    </div>
    <div style="width:100%;height:1px;background:rgba(255,255,255,0.12);margin-top:40px;"></div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px;">
      ${data.quote ? `<div>
        <p style="font-family:'Playfair Display',serif;font-weight:400;font-style:italic;font-size:36px;color:rgba(255,255,255,0.85);line-height:1.35;max-width:900px;">"${data.quote}"</p>
      </div>` : ''}
      ${data.achievement ? `<div>
        <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;display:block;">ACHIEVEMENT</span>
        <p style="font-family:'Inter',sans-serif;font-weight:400;font-size:22px;color:#ffffff;line-height:1.5;">${data.achievement}</p>
      </div>` : ''}
      ${data.funFact ? `<div>
        <span style="font-family:'Inter',sans-serif;font-weight:600;font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;display:block;">FUN FACT</span>
        <p style="font-family:'Inter',sans-serif;font-weight:400;font-size:22px;color:#ffffff;line-height:1.5;">${data.funFact}</p>
      </div>` : ''}
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
