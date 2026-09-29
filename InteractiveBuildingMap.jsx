import { useProjects } from '../../context/ProjectContext';
import { PHOTO_KINDS, formatArea, formatNumber } from '../../lib/format';
import Modal from '../common/Modal';
import PhotoGrid from '../common/PhotoGrid';
import CostCalculator from './CostCalculator';

export default function InteractiveBuildingMap() {
  const { db, loading, activeProjectId, activeBuildingId, selectProject, setActiveBuildingId, selectedUnitId, selectUnit, closeUnit } = useProjects();

  const projects = db.projects.filter((p) => p.status === 'active');
  const project = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const buildings = db.buildings.filter((b) => b.project_id === project?.id);
  const building = buildings.find((b) => b.id === activeBuildingId) ?? buildings[0];
  const units = db.units.filter((u) => u.building_id === building?.id);
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a); // top floor first
  const selected = db.units.find((u) => u.id === selectedUnitId);

  if (loading) return <p className="py-20 text-center text-slate-500">جارٍ التحميل…</p>;
  if (!project) return <p className="py-20 text-center text-slate-500">لا توجد مشاريع نشطة حالياً.</p>;

  const available = units.filter((u) => u.status === 'available').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{project.name}</h1>
          <p className="text-sm text-slate-500">{project.description}</p>
        </div>
        <select className="input !w-auto" value={project.id} onChange={(e) => selectProject(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {buildings.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveBuildingId(b.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${b.id === building?.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">{building?.name} — خريطة الشقق</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-emerald-500" /> متاحة ({formatNumber(available)})</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded bg-rose-500" /> محجوزة ({formatNumber(units.length - available)})</span>
          </div>
        </div>
        <div className="space-y-3">
          {floors.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm font-semibold text-slate-500">الطابق {formatNumber(f)}</span>
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {units.filter((u) => u.floor === f).sort((a, b) => Number(a.unit_number) - Number(b.unit_number)).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUnit(u.id)}
                    className={`rounded-xl px-3 py-4 text-sm font-bold text-white shadow-sm transition hover:scale-[1.03] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 ${
                      u.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  >
                    شقة {u.unit_number}
                    <span className="mt-0.5 block text-xs font-normal opacity-90">{formatArea(u.area)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {building && (
        <div className="card space-y-5">
          <h2 className="font-bold">المخططات وسير العمل — {building.name}</h2>
          {Object.entries(PHOTO_KINDS).map(([kind, title]) => (
            <div key={kind}>
              <h3 className="mb-2 text-sm font-bold text-slate-700">{title}</h3>
              <PhotoGrid photos={db.photos.filter((p) => p.building_id === building.id && p.kind === kind)} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`شقة ${selected.unit_number} — ${building?.name}`} onClose={closeUnit}>
          <div className="space-y-4">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${selected.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {selected.status === 'available' ? 'متاحة' : 'محجوزة'}
            </span>
            <dl className="grid grid-cols-3 gap-3 text-center text-sm">
              {[['المساحة', formatArea(selected.area)], ['الطابق', formatNumber(selected.floor)], ['الاتجاه', selected.direction]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <CostCalculator unit={selected} />
          </div>
        </Modal>
      )}
    </div>
  );
}
