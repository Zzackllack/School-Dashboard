function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 bg-black px-2 py-0.5 font-mono text-[10px] font-black text-white">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
      LIVE
    </span>
  );
}

export function ModuleHeader({
  title,
  sub,
  live,
}: {
  title: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b-2 border-black px-3 py-2">
      <div>
        <h2 className="font-black text-xs uppercase tracking-[0.08em]">
          {title}
        </h2>
        {sub && (
          <div className="font-mono text-[10px] uppercase tracking-wide text-black/40">
            {sub}
          </div>
        )}
      </div>
      {live && <LiveDot />}
    </div>
  );
}
