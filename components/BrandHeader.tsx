import Link from "next/link";
import { Trophy } from "lucide-react";

export function BrandHeader() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 group shrink-0">
      <div className="w-10 h-10 rounded-sm bg-brand-sky flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
        <Trophy size={22} className="text-pitch-bg" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-black italic uppercase tracking-tighter text-white whitespace-nowrap">
          World Cup 26
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 whitespace-nowrap">
          Prediction Game
        </span>
      </div>
    </Link>
  );
}
