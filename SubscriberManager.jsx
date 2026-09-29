import { useState } from 'react';
import { Check, FileText, Link2, MessageCircle, Upload, UserPlus } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { uploadFile } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import Modal from '../common/Modal';
import PdfContractGenerator from '../client/PdfContractGenerator';

const onboardingLink = (token) => `${window.location.origin}/?onboard=${token}`;

const whatsappLink = (sub) => {
  const text = `مرحباً ${sub.name}، أهلاً بك في مشاريع ابن حلب. تفاصيل وحدتك وعقدك عبر الرابط التالي:\n${onboardingLink(sub.onboarding_token)}`;
  return `https://wa.me/${sub.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
};

export default function SubscriberManager() {
  const { db, addSubscriber, attachContract, getUnitContext } = useProjects();
  const [form, setForm] = useState({ name: '', phone: '', unit_id: '' });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [contractFor, setContractFor] = useState(null);

  const available = db.units.filter((u) => u.status === 'available' && getUnitContext(u.id)?.project.status === 'active');
  const unitLabel = (id) => {
    const c = getUnitContext(id);
    return c ? `${c.project.name} — ${c.building.name} — شقة ${c.unit.unit_number}، طابق ${c.unit.floor}` : '—';
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 8 || !form.unit_id) {
      setError('أدخل الاسم ورقم هاتف صحيح مع رمز الدولة (مثل 963...) واختر الوحدة.');
      return;
    }
    addSubscriber({ ...form, name: form.name.trim() });
    setForm({ name: '', phone: '', unit_id: '' });
    setError('');
  };

  const copy = async (sub) => {
    try {
      await navigator.clipboard.writeText(onboardingLink(sub.onboarding_token));
      setCopied(sub.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt('انسخ الرابط:', onboardingLink(sub.onboarding_token));
    }
  };

  const uploadContract = async (sub, file) => {
    if (!file) return;
    try {
      attachContract(sub.id, await uploadFile(file, 'contracts'));
    } catch (err) {
      console.error(err);
      alert('تعذّر رفع العقد.');
    }
  };

  const contractSub = db.subscribers.find((s) => s.id === contractFor);

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-4">
        <h3 className="flex items-center gap-2 font-bold"><UserPlus size={18} /> إضافة مشترك وتخصيص وحدة</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">الاسم</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">رقم الواتساب (مع رمز الدولة)</label>
            <input className="input" dir="ltr" placeholder="963944000000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">الوحدة المتاحة</label>
            <select className="input" value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
              <option value="">— اختر —</option>
              {available.map((u) => <option key={u.id} value={u.id}>{unitLabel(u.id)}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn-primary" type="submit">حفظ وحجز الوحدة</button>
      </form>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 font-bold">المشتركون</h3>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-slate-500">
              {['المشترك', 'الوحدة', 'التاريخ', 'رابط الانضمام', 'العقد'].map((h) => <th key={h} className="p-2 text-start font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {db.subscribers.map((s) => (
              <tr key={s.id} className="border-b align-top last:border-0">
                <td className="p-2"><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500" dir="ltr">{s.phone}</p></td>
                <td className="p-2">{unitLabel(s.unit_id)}</td>
                <td className="p-2">{formatDate(s.created_at)}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => copy(s)}>
                      {copied === s.id ? <Check size={14} /> : <Link2 size={14} />} {copied === s.id ? 'تم النسخ' : 'نسخ'}
                    </button>
                    <a className="btn-primary !px-2 !py-1" href={whatsappLink(s)} target="_blank" rel="noreferrer">
                      <MessageCircle size={14} /> واتساب
                    </a>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => setContractFor(s.id)}><FileText size={14} /> إنشاء PDF</button>
                    <label className="btn-ghost cursor-pointer !px-2 !py-1">
                      <Upload size={14} /> رفع عقد
                      <input type="file" accept="application/pdf" hidden onChange={(e) => uploadContract(s, e.target.files[0])} />
                    </label>
                    {s.contract_url && <a className="text-emerald-700 underline" href={s.contract_url} target="_blank" rel="noreferrer">عرض العقد</a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!db.subscribers.length && <p className="py-4 text-sm text-slate-400">لا يوجد مشتركون بعد.</p>}
      </div>

      {contractSub && (
        <Modal title={`عقد ${contractSub.name}`} wide onClose={() => setContractFor(null)}>
          <PdfContractGenerator subscriber={contractSub} />
        </Modal>
      )}
    </div>
  );
}
