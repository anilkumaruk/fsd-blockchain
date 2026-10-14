import { Info } from 'lucide-react';

export default function PrototypeBanner() {
  return (
    <div className="border-t border-border bg-teal-soft">
      <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2 text-xs text-teal">
        <Info size={14} className="shrink-0" />
        <span>
          Full stack (MERN) version of a B.Tech CSE academic project — credential records are
          stored in MongoDB via an Express API. Blockchain transactions are still simulated.
        </span>
      </div>
    </div>
  );
}
