export default function SolveLoading() {
  return (
    <div className="container-x py-10 max-w-4xl">
      <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
      <div className="mt-3 h-4 w-96 rounded bg-slate-100 animate-pulse" />
      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="mt-3 h-32 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="mt-4 flex justify-end">
          <div className="h-10 w-36 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}