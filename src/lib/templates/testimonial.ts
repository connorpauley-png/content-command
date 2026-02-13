import { htmlWrap, baseBg, headerBar, footerBar, textureDashes } from './html-base';

interface TestimonialData {
  quote: string;
  name?: string;
  author?: string;
  location?: string;
  rating?: number;
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string; companyName?: string };
}

export function Testimonial(data: TestimonialData): string {
  const a = data.brandColors?.accent || '#e2b93b';
  const co = data.brandColors?.companyName || 'COLLEGE BROS';
  const authorName = data.name || data.author || '';
  const rating = data.rating || 5;
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? a : '#333333'};font-size:28px;margin-right:4px;">★</span>`
  ).join('');

  return htmlWrap(`
<div style="position:relative;width:1080px;height:1080px;${baseBg()}overflow:hidden;">
  ${textureDashes()}
  <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:50px 60px;">
    ${headerBar('TESTIMONIAL', co)}
    <!-- Decorative quotation mark -->
    <div style="position:absolute;top:120px;right:60px;font-family:'Playfair Display',serif;font-size:240px;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;">"</div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 0;">
      <p style="font-family:'Playfair Display',serif;font-weight:700;font-style:italic;font-size:48px;color:#ffffff;line-height:1.25;max-width:920px;">${data.quote}</p>
    </div>
    <div style="margin-bottom:16px;">
      <div style="margin-bottom:16px;">${stars}</div>
      <div style="width:50px;height:2px;background:${a};margin-bottom:16px;"></div>
      <span style="font-family:'Inter',sans-serif;font-weight:700;font-size:22px;color:#ffffff;display:block;">${authorName}</span>
      ${data.location ? `<span style="font-family:'Inter',sans-serif;font-weight:400;font-size:16px;color:#888888;margin-top:6px;display:block;">${data.location}</span>` : ''}
    </div>
    ${footerBar(co)}
  </div>
</div>`);
}
