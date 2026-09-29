import { FEES, calcUnitCost, formatCurrency, formatNumber } from '../../lib/format';

export default function CostCalculator({ unit }) {
  const c = calcUnitCost(unit);
  const rows = [
    ['حصة الأرض الأساسية', c.land],
    ['كلفة البناء', c.construction],
    [`رسوم إدارية (${formatNumber(FEES.admin * 100)}٪)`, c.admin],
    [`رسوم التشطيب (${formatNumber(FEES.finishing * 100)}٪)`, c.finishing],
  ];

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <h4 className="mb-3 font-bold">تفصيل التكلفة</h4>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-semibold">{formatCurrency(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
        <span className="font-bold">الإجمالي</span>
        <span className="text-lg font-extrabold text-emerald-700">{formatCurrency(c.total)}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">الرسوم الإدارية ورسوم التشطيب تُحتسب على (الأرض + البناء).</p>
    </div>
  );
}
