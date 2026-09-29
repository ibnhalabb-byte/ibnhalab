import { Building2, LayoutDashboard, Map } from 'lucide-react';

const items = [
  { id: 'client', label: 'خريطة المشروع', icon: Map },
  { id: 'admin', label: 'لوحة الإدارة', icon: LayoutDashboard },
];

export default function Navbar({ view, onNavigate }) {
  const go = (id) => {
    // Leave the onboarding page (?onboard=...) when using the main navigation.
    if (window.location.search) window.location.assign(window.location.pathname);
    else onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
            <Building2 size={22} />
          </span>
          <div>
            <p className="font-extrabold leading-tight">ابن حلب</p>
            <p className="text-xs text-slate-500">إدارة وتتبع المشاريع العقارية</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
