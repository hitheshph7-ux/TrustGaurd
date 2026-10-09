import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = "Analyzing security signatures..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/80 rounded-2xl border border-slate-200">
      <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      <p className="mt-3 text-xs font-semibold text-slate-600 animate-pulse">{text}</p>
    </div>
  );
}
