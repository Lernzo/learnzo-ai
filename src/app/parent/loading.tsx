export default function ParentLoading() {
  return (
    <div className="container-x py-12 max-w-4xl">
      <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}