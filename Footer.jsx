export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
      <p>© {new Date().getFullYear()} ابن حلب للتطوير العقاري. جميع الحقوق محفوظة.</p>
      <p className="mt-1 text-xs">نلتزم بالشفافية الكاملة في تكاليف ومراحل البناء.</p>
    </footer>
  );
}
