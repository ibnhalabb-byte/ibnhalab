import { useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';

/** Drag & drop / click upload area. `onFiles(files)` may be async. */
export default function Dropzone({ label, hint, accept = 'image/*', multiple = true, onFiles }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      await onFiles(multiple ? files : [files[0]]);
    } catch (err) {
      console.error(err);
      setError('تعذّر رفع الملف، حاول مرة أخرى.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          over ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400'
        }`}
      >
        {busy ? <Loader2 className="animate-spin text-emerald-600" /> : <UploadCloud className="text-slate-400" />}
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-slate-500">{hint || 'اسحب الملفات وأفلتها هنا أو اضغط للاختيار'}</p>
        <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => handle(e.target.files)} />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
