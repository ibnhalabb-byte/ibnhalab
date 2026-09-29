export const CURRENCY = 'USD'; // غيّرها إلى 'SYP' لعرض الليرة السورية
export const FEES = { admin: 0.1, finishing: 0.05 };
export const MILESTONES = ['الحفر', 'الهيكل الإنشائي', 'التشطيب', 'أخرى'];
export const PHOTO_KINDS = {
  blueprint_2d: 'المخططات المعمارية (2D)',
  render_3d: 'التصاميم ثلاثية الأبعاد (3D)',
  progress: 'صور سير العمل',
};

const currencyFmt = new Intl.NumberFormat('ar-SY', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat('ar-SY');

export const formatCurrency = (n = 0) => currencyFmt.format(Number(n) || 0);
export const formatNumber = (n = 0) => numberFmt.format(Number(n) || 0);
export const formatArea = (n = 0) => `${formatNumber(n)} م²`;
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-SY') : '—');

/** Both fees are calculated on (land + construction). */
export function calcUnitCost(unit) {
  const land = Number(unit?.land_cost) || 0;
  const construction = Number(unit?.construction_cost) || 0;
  const base = land + construction;
  const admin = base * FEES.admin;
  const finishing = base * FEES.finishing;
  return { land, construction, base, admin, finishing, total: base + admin + finishing };
}
