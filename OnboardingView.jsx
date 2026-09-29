import { useProjects } from '../../context/ProjectContext';
import { formatArea, formatNumber } from '../../lib/format';
import CostCalculator from './CostCalculator';
import PdfContractGenerator from './PdfContractGenerator';

/** Landing page opened from the WhatsApp onboarding link (?onboard=TOKEN). */
export default function OnboardingView({ token }) {
  const { db, loading, getUnitContext } = useProjects();
  const sub = db.subscribers.find((s) => s.onboarding_token === token);
  const ctx = sub && getUnitContext(sub.unit_id);

  if (loading) return <p className="py-20 text-center text-slate-500">جارٍ التحميل…</p>;
  if (!sub || !ctx) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-bold">الرابط غير صالح أو منتهي.</p>
        <p className="text-sm text-slate-500">تواصل مع فريق ابن حلب للحصول على رابط جديد.</p>
      </div>
    );
  }

  const { unit, building, project } = ctx;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold">أهلاً {sub.name}</h1>
        <p className="mt-1 text-slate-600">
          وحدتك: شقة {unit.unit_number} — {building.name} — {project.name}، الطابق {formatNumber(unit.floor)}، {formatArea(unit.area)}.
        </p>
      </div>
      <CostCalculator unit={unit} />
      <div className="card"><PdfContractGenerator subscriber={sub} /></div>
    </div>
  );
}
