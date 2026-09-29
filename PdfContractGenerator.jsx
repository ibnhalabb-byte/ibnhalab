import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { calcUnitCost, formatArea, formatCurrency, formatDate, formatNumber } from '../../lib/format';

export default function PdfContractGenerator({ subscriber }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const { getUnitContext, unitInvoices } = useProjects();

  const ctx = getUnitContext(subscriber.unit_id);
  if (!ctx) return <p className="text-sm text-rose-600">تعذّر العثور على الوحدة المرتبطة بهذا المشترك.</p>;

  const { unit, building, project } = ctx;
  const cost = calcUnitCost(unit);
  const ledger = unitInvoices(unit.id);
  let running = 0;

  const download = async () => {
    setBusy(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: `عقد-${subscriber.name}-شقة-${unit.unit_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(ref.current)
        .save();
    } catch (err) {
      console.error(err);
      alert('تعذّر إنشاء ملف PDF.');
    } finally {
      setBusy(false);
    }
  };

  const th = { border: '1px solid #cbd5e1', padding: '6px', background: '#f1f5f9', textAlign: 'right' };
  const td = { border: '1px solid #e2e8f0', padding: '6px' };

  return (
    <div className="space-y-4">
      <button onClick={download} disabled={busy} className="btn-primary">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} تحميل العقد وسجل الدفعات (PDF)
      </button>

      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <div ref={ref} dir="rtl" style={{ background: '#fff', color: '#0f172a', padding: 28, fontFamily: 'Tajawal, sans-serif', fontSize: 13, lineHeight: 1.8, minWidth: 640 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: 10, marginBottom: 14 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>عقد اشتراك في وحدة سكنية</h1>
            <p style={{ margin: 0, color: '#475569' }}>ابن حلب للتطوير العقاري — {project.name}</p>
            <p style={{ margin: 0, color: '#475569' }}>تاريخ التحرير: {formatDate(new Date())}</p>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 700 }}>أولاً: الأطراف</h2>
          <p>الطرف الأول: شركة ابن حلب للتطوير العقاري (المطوّر).</p>
          <p>الطرف الثاني: السيد/ة <b>{subscriber.name}</b> — هاتف: <span dir="ltr">{subscriber.phone}</span> (المشترك).</p>

          <h2 style={{ fontSize: 15, fontWeight: 700 }}>ثانياً: الوحدة موضوع العقد</h2>
          <p>
            شقة رقم <b>{unit.unit_number}</b> في {building.name}، الطابق {formatNumber(unit.floor)}، بمساحة {formatArea(unit.area)}،
            واتجاه {unit.direction}، ضمن {project.name}.
          </p>

          <h2 style={{ fontSize: 15, fontWeight: 700 }}>ثالثاً: التكلفة</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['حصة الأرض الأساسية', cost.land],
                ['كلفة البناء', cost.construction],
                ['رسوم إدارية (١٠٪)', cost.admin],
                ['رسوم التشطيب (٥٪)', cost.finishing],
              ].map(([k, v]) => (
                <tr key={k}><td style={td}>{k}</td><td style={td}>{formatCurrency(v)}</td></tr>
              ))}
              <tr><td style={{ ...td, fontWeight: 800 }}>الإجمالي</td><td style={{ ...td, fontWeight: 800 }}>{formatCurrency(cost.total)}</td></tr>
            </tbody>
          </table>

          <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>رابعاً: سجل الدفعات (حصة الوحدة من مصاريف المراحل)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['التاريخ', 'المرحلة', 'حصة الوحدة', 'المجموع التراكمي'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {ledger.map((r) => {
                running += r.share;
                return (
                  <tr key={r.id}>
                    <td style={td}>{formatDate(r.invoice_date)}</td>
                    <td style={td}>{r.milestone}</td>
                    <td style={td}>{formatCurrency(r.share)}</td>
                    <td style={td}>{formatCurrency(running)}</td>
                  </tr>
                );
              })}
              {!ledger.length && <tr><td style={td} colSpan={4}>لا توجد مصاريف مسجّلة بعد.</td></tr>}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
            <div>توقيع الطرف الأول: ____________</div>
            <div>توقيع الطرف الثاني: ____________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
