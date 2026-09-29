import { useMemo, useState } from 'react';
import { Eye, Receipt } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { uploadFile } from '../../lib/supabaseClient';
import { MILESTONES, formatCurrency, formatDate, formatNumber } from '../../lib/format';
import Dropzone from '../common/Dropzone';
import Modal from '../common/Modal';

const today = () => new Date().toISOString().slice(0, 10);

export default function InvoiceManager() {
  const { db, activeProjectId, addInvoice, invoiceShare } = useProjects();
  const activeProjects = db.projects.filter((p) => p.status === 'active');
  const [form, setForm] = useState({ project_id: activeProjectId ?? '', building_id: '', milestone: MILESTONES[0], amount: '', invoice_date: today(), image_url: null });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const buildings = db.buildings.filter((b) => b.project_id === form.project_id);

  const scopeCount = useMemo(() => {
    const ids = form.building_id
      ? [form.building_id]
      : db.buildings.filter((b) => b.project_id === form.project_id).map((b) => b.id);
    return db.units.filter((u) => ids.includes(u.building_id)).length;
  }, [db.units, db.buildings, form.project_id, form.building_id]);
  const previewShare = scopeCount && Number(form.amount) ? Number(form.amount) / scopeCount : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!form.project_id || !(Number(form.amount) > 0)) {
      setError('اختر المشروع وأدخل مبلغاً صحيحاً.');
      return;
    }
    addInvoice({ ...form, building_id: form.building_id || null });
    setForm((f) => ({ ...f, amount: '', image_url: null }));
    setError('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-4">
        <h3 className="flex items-center gap-2 font-bold"><Receipt size={18} /> تسجيل مصروف مرحلة</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">المشروع</label>
            <select className="input" value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value, building_id: '' }))}>
              <option value="">— اختر —</option>
              {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">البناء</label>
            <select className="input" value={form.building_id} onChange={(e) => set('building_id', e.target.value)}>
              <option value="">كل أبنية المشروع</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">المرحلة</label>
            <select className="input" value={form.milestone} onChange={(e) => set('milestone', e.target.value)}>
              {MILESTONES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">المبلغ ($)</label>
            <input type="number" min="0" className="input" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="label">التاريخ</label>
            <input type="date" className="input" value={form.invoice_date} onChange={(e) => set('invoice_date', e.target.value)} />
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-sm">
            <p className="text-slate-600">التقسيم التلقائي على {formatNumber(scopeCount)} وحدة</p>
            <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(previewShare)} <span className="text-xs font-normal">لكل وحدة</span></p>
          </div>
        </div>

        <Dropzone label="رفع صورة الفاتورة" multiple={false} onFiles={async ([f]) => set('image_url', await uploadFile(f, 'invoices'))} />
        {form.image_url && <img src={form.image_url} alt="معاينة الفاتورة" className="h-32 rounded-lg object-cover ring-1 ring-slate-200" />}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary" type="submit">حفظ الفاتورة</button>
      </form>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 font-bold">سجل الفواتير</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-slate-500">
              {['التاريخ', 'المشروع / البناء', 'المرحلة', 'المبلغ', 'حصة الوحدة', 'الفاتورة'].map((h) => <th key={h} className="p-2 text-start font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {db.invoices.map((inv) => {
              const { count, share } = invoiceShare(inv);
              const p = db.projects.find((x) => x.id === inv.project_id);
              const b = db.buildings.find((x) => x.id === inv.building_id);
              return (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="p-2">{formatDate(inv.invoice_date)}</td>
                  <td className="p-2">{p?.name} — {b?.name ?? 'كل الأبنية'}</td>
                  <td className="p-2">{inv.milestone}</td>
                  <td className="p-2 font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="p-2">{formatCurrency(share)} <span className="text-xs text-slate-400">({formatNumber(count)} وحدة)</span></td>
                  <td className="p-2">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => setPreview(inv)}><Eye size={14} /> عرض</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!db.invoices.length && <p className="py-4 text-sm text-slate-400">لا توجد فواتير مسجلة.</p>}
      </div>

      {preview && (
        <Modal title={`فاتورة ${preview.milestone}`} onClose={() => setPreview(null)}>
          {preview.image_url ? <img src={preview.image_url} alt="الفاتورة" className="w-full rounded-lg" /> : <p className="text-sm text-slate-500">لم يتم رفع صورة لهذه الفاتورة.</p>}
        </Modal>
      )}
    </div>
  );
}
