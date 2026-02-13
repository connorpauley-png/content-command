import { htmlWrap, baseBg, headerBar, footerBar, textureDashes } from './html-base';

interface QuoteCardData {
  quote: string;
  author?: string;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function QuoteCard(data: QuoteCardData): string {
  const co = data.brandColors?.companyName || 'COLLEGE BROS';

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('DAILY MOTIVATION', co)}
    <!-- Decorative quotation mark -->
    <div style="position:absolute;top:100px;left:40px;font-family:'Playfair Display',serif;font-size:280px;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;z-index:1;">"</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 0;position:relative;z-index:2;">
      <p style="font-family:'Playfair Display',serif;font-weight:900;font-size:72px;color:#ffffff;line-height:1.1;max-width:960px;">${data.quote}</p>
    </div>
    ${data.author ? `<div style="margin-bottom:16px;"><div style="width:50px;height:2px;background:#e2b93b;margin-bottom:16px;"></div><span style="font-family:'Inter',sans-serif;font-weight:500;font-size:20px;color:#999999;">— ${data.author}</span></div>` : ''}
    ${footerBar(co)}
  </div>
</div>`);
}
