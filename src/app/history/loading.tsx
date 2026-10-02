export default function HistoryLoading() {
  return (
    <div className="container-x py-12 max-w-3xl">
      <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="mt-3 h-5 w-4/5 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}