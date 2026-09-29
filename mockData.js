export const DIRECTIONS = ['شمالي', 'جنوبي', 'شرقي', 'غربي'];

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Generates units like 101, 102, 201 ... for a building. */
export function buildUnits(building_id, floors, perFloor, spec, reserved = []) {
  const units = [];
  for (let f = 1; f <= floors; f++) {
    for (let i = 1; i <= perFloor; i++) {
      const unit_number = String(f * 100 + i);
      units.push({
        id: uid(),
        building_id,
        unit_number,
        floor: f,
        area: spec.area,
        direction: DIRECTIONS[(i - 1) % DIRECTIONS.length],
        land_cost: spec.land_cost,
        construction_cost: spec.construction_cost,
        status: reserved.includes(unit_number) ? 'reserved' : 'available',
      });
    }
  }
  return units;
}

const P1 = 'p-zahra';
const BA = 'b-a';
const BB = 'b-b';
const unitsA = buildUnits(BA, 4, 3, { area: 120, land_cost: 18000, construction_cost: 42000 }, ['101', '202']);
const unitsB = buildUnits(BB, 3, 2, { area: 95, land_cost: 14000, construction_cost: 33000 }, ['201']);
const unitId = (list, n) => list.find((u) => u.unit_number === n).id;

export const mockData = {
  projects: [
    {
      id: P1,
      name: 'مشروع زهرة حلب',
      description: 'مشروع سكني من بنائين في حلب بنظام الاشتراك والتتبع الشفاف لمراحل البناء.',
      status: 'active',
      created_at: '2026-01-15T09:00:00Z',
    },
  ],
  buildings: [
    { id: BA, project_id: P1, name: 'البناء أ', floors: 4 },
    { id: BB, project_id: P1, name: 'البناء ب', floors: 3 },
  ],
  units: [...unitsA, ...unitsB],
  subscribers: [
    { id: 's-1', name: 'أحمد الحلبي', phone: '963944000001', unit_id: unitId(unitsA, '101'), onboarding_token: 'demo-101', contract_url: null, created_at: '2026-02-01T10:00:00Z' },
    { id: 's-2', name: 'ليلى العمر', phone: '963944000002', unit_id: unitId(unitsA, '202'), onboarding_token: 'demo-202', contract_url: null, created_at: '2026-02-05T10:00:00Z' },
    { id: 's-3', name: 'خالد النجار', phone: '963944000003', unit_id: unitId(unitsB, '201'), onboarding_token: 'demo-b201', contract_url: null, created_at: '2026-02-09T10:00:00Z' },
  ],
  invoices: [
    { id: 'i-1', project_id: P1, building_id: null, milestone: 'الحفر', amount: 24000, image_url: null, invoice_date: '2026-03-10' },
    { id: 'i-2', project_id: P1, building_id: BA, milestone: 'الهيكل الإنشائي', amount: 60000, image_url: null, invoice_date: '2026-05-02' },
  ],
  photos: [],
};
