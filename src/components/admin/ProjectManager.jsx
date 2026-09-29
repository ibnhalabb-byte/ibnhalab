import { useState } from 'react';
import { Archive, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { uploadFile } from '../../lib/supabaseClient';
import { PHOTO_KINDS, formatNumber } from '../../lib/format';
import Dropzone from '../common/Dropzone';
import PhotoGrid from '../common/PhotoGrid';

const emptyBuilding = () => ({ name: '', floors: 4, unitsPerFloor: 2, area: 100, land_cost: 15000, construction_cost: 35000 });

function NewProjectForm() {
  const { addProject } = useProjects();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [buildings, setBuildings] = useState([emptyBuilding()]);
  const [error, setError] = useState('');

  const patch = (i, key, value) => setBuildings((list) => list.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || buildings.some((b) => !b.name.trim())) {
      setError('أدخل اسم المشروع واسم كل بناء.');
      return;
    }
    addProject({ name: name.trim(), description: description.trim(), buildings });
    setName(''); setDescription(''); setBuildings([emptyBuilding()]); setError('');
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h3 className="font-bold">إضافة مشروع جديد</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">اسم المشروع</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مشروع زهرة حلب" />
        </div>
        <div>
          <label className="label">وصف مختصر</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {buildings.map((b, i) => (
        <div key={i} className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">بناء {formatNumber(i + 1)}</p>
            {buildings.length > 1 && (
              <button type="button" className="text-rose-600" onClick={() => setBuildings((l) => l.filter((_, idx) => idx !== i))} aria-label="حذف البناء">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="label">اسم البناء</label>
              <input className="input" value={b.name} onChange={(e) => patch(i, 'name', e.target.value)} placeholder="مثال: البناء أ" />
            </div>
            {[
              ['floors', 'عدد الطوابق'],
              ['unitsPerFloor', 'الشقق في كل طابق'],
              ['area', 'مساحة الشقة (م²)'],
              ['land_cost', 'حصة الأرض للشقة ($)'],
              ['construction_cost', 'كلفة البناء للشقة ($)'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type="number" min="1" className="input" value={b[key]} onChange={(e) => patch(i, key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={() => setBuildings((l) => [...l, emptyBuilding()])}>
          <Plus size={16} /> إضافة بناء
        </button>
        <button type="submit" className="btn-primary">حفظ المشروع وتوليد الشقق</button>
      </div>
    </form>
  );
}

function MediaManager() {
  const { db, activeProjectId, activeBuildingId, setActiveBuildingId, addPhotos, removePhoto } = useProjects();
  const buildings = db.buildings.filter((b) => b.project_id === activeProjectId);
  const project = db.projects.find((p) => p.id === activeProjectId);

  if (!project) return null;

  const upload = (kind) => async (files) => {
    const items = await Promise.all(
      files.map(async (f) => ({
        project_id: activeProjectId,
        building_id: activeBuildingId,
        kind,
        url: await uploadFile(f, `gallery/${kind}`),
        caption: f.name,
      }))
    );
    addPhotos(items);
  };

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold"><ImagePlus size={18} /> المخططات والصور: {project.name}</h3>
        <select className="input !w-auto" value={activeBuildingId ?? ''} onChange={(e) => setActiveBuildingId(e.target.value)}>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      {!activeBuildingId ? (
        <p className="text-sm text-slate-400">اختر بناءً لإدارة وسائطه.</p>
      ) : (
        Object.entries(PHOTO_KINDS).map(([kind, title]) => (
          <div key={kind} className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700">{title}</h4>
            <Dropzone label={`رفع ${title}`} onFiles={upload(kind)} />
            <PhotoGrid
              photos={db.photos.filter((p) => p.building_id === activeBuildingId && p.kind === kind)}
              onRemove={removePhoto}
            />
          </div>
        ))
      )}
    </div>
  );
}

export default function ProjectManager() {
  const { db, activeProjectId, selectProject, archiveProject } = useProjects();

  const handleArchive = (p) => {
    if (window.confirm(`هل تريد نقل "${p.name}" إلى أرشيف المشاريع المكتملة؟`)) archiveProject(p.id);
  };

  return (
    <div className="space-y-6">
      <NewProjectForm />

      <div className="card">
        <h3 className="mb-4 font-bold">المشاريع</h3>
        <div className="space-y-3">
          {db.projects.map((p) => {
            const blds = db.buildings.filter((b) => b.project_id === p.id);
            const units = db.units.filter((u) => blds.some((b) => b.id === u.building_id));
            const archived = p.status === 'archived';
            return (
              <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ring-1 ${p.id === activeProjectId ? 'ring-emerald-400' : 'ring-slate-200'}`}>
                <div>
                  <p className="font-bold">
                    {p.name}
                    <span className={`mx-2 rounded-full px-2 py-0.5 text-xs ${archived ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                      {archived ? 'مؤرشف' : 'نشط'}
                    </span>
                  </p>
                  <p className="text-sm text-slate-500">{formatNumber(blds.length)} أبنية • {formatNumber(units.length)} وحدة</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => selectProject(p.id)}>إدارة الوسائط</button>
                  {!archived && (
                    <button className="btn-danger" onClick={() => handleArchive(p)}>
                      <Archive size={16} /> نقل إلى الأرشيف
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!db.projects.length && <p className="text-sm text-slate-400">لا توجد مشاريع بعد.</p>}
        </div>
      </div>

      <MediaManager />
    </div>
  );
}
