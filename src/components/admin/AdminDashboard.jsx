import { useState } from 'react';
import { Building2, CheckCircle2, FolderKanban, LayoutDashboard, Lock, Receipt, Users, Wallet } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { formatCurrency, formatNumber } from '../../lib/format';
import ProjectManager from './ProjectManager';
import InvoiceManager from './InvoiceManager';
import SubscriberManager from './SubscriberManager';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'projects', label: 'المشاريع والمخططات', icon: FolderKanban },
  { id: 'invoices', label: 'الفواتير والمراحل', icon: Receipt },
  { id: 'subscribers', label: 'المشتركون', icon: Users },
];

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="card flex items-center gap-4">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}><Icon size={22} /></span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function Overview() {
  const { db } = useProjects();
  const active = db.projects.filter((p) => p.status === 'active');
  const available = db.units.filter((u) => u.status === 'available').length;
  const reserved = db.units.filter((u) => u.status === 'reserved').length;
  const spent = db.invoices.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Building2} label="مشاريع نشطة" value={formatNumber(active.length)} tone="bg-sky-50 text-sky-600" />
        <Stat icon={CheckCircle2} label="وحدات متاحة" value={formatNumber(available)} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={Lock} label="وحدات محجوزة" value={formatNumber(reserved)} tone="bg-rose-50 text-rose-600" />
        <Stat icon={Wallet} label="إجمالي المصاريف" value={formatCurrency(spent)} tone="bg-amber-50 text-amber-600" />
      </div>
      <div className="card">
        <h3 className="mb-4 font-bold">نسبة الحجز حسب المشروع</h3>
        <div className="space-y-4">
          {active.map((p) => {
            const ids = db.buildings.filter((b) => b.project_id === p.id).map((b) => b.id);
            const units = db.units.filter((u) => ids.includes(u.building_id));
            const pct = units.length ? Math.round((units.filter((u) => u.status === 'reserved').length / units.length) * 100) : 0;
            return (
              <div key={p.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-slate-500">{formatNumber(pct)}٪ محجوز من {formatNumber(units.length)} وحدة</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!active.length && <p className="text-sm text-slate-400">لا توجد مشاريع نشطة.</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const views = { overview: <Overview />, projects: <ProjectManager />, invoices: <InvoiceManager />, subscribers: <SubscriberManager /> };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="card h-fit p-3">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                tab === id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">{views[tab]}</section>
    </div>
  );
}
