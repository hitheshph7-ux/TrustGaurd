import React from 'react';
import { getRiskBadgeConfig } from '../utils/formatters';
import { AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

export default function RiskBadge({ level, score }) {
  const config = getRiskBadgeConfig(level);
  const lvl = (level || '').toLowerCase();

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border font-bold text-xs tracking-wide ${config.bg}`}>
      {lvl === 'high' && <AlertOctagon className="w-3.5 h-3.5" />}
      {lvl === 'medium' && <AlertTriangle className="w-3.5 h-3.5" />}
      {lvl === 'low' && <CheckCircle className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-80 font-mono text-[11px]">({score}/100)</span>
      )}
    </div>
  );
}
