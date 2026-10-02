export default function AdminLoading() {
  return (
    <div className="container-x py-10 max-w-6xl">
      <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}