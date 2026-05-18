import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, colorClass }: KpiCardProps) {
  return (
    <div className={`bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex items-center justify-between transition-all duration-300 hover:scale-105 ${colorClass}`}>
      <div>
        <p className="text-slate-300 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl bg-white/10`}>
        <Icon size={28} className="text-white" />
      </div>
    </div>
  );
}
