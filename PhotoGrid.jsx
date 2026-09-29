import { Trash2 } from 'lucide-react';

export default function PhotoGrid({ photos, onRemove, empty = 'لا توجد صور بعد.' }) {
  if (!photos.length) return <p className="py-3 text-sm text-slate-400">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <figure key={p.id} className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
          <a href={p.url} target="_blank" rel="noreferrer">
            <img src={p.url} alt={p.caption || 'صورة'} className="h-32 w-full object-cover" />
          </a>
          {onRemove && (
            <button
              onClick={() => onRemove(p.id)}
              className="absolute end-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-600 opacity-0 shadow group-hover:opacity-100"
              aria-label="حذف الصورة"
            >
              <Trash2 size={14} />
            </button>
          )}
        </figure>
      ))}
    </div>
  );
}
