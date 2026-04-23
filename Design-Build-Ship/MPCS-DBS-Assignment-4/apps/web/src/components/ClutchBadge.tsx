export default function ClutchBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const v = Math.round(value);
  const intensity =
    v >= 80 ? 'bg-rose-600 text-white' :
    v >= 60 ? 'bg-orange-500 text-white' :
    v >= 40 ? 'bg-amber-400 text-slate-900' :
    v >= 20 ? 'bg-emerald-500 text-white' :
              'bg-slate-200 text-slate-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${intensity}`}>
      CI {v}
    </span>
  );
}
