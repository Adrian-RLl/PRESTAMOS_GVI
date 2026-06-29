import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  iconColor?: string;
  iconBg?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, colorClass, iconColor = "text-blue-600", iconBg = "bg-blue-100" }: KpiCardProps) {
  return (
    <div className={`bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:scale-105 ${colorClass || 'border-slate-200'}`}>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl ${iconBg}`}>
        <Icon size={28} className={iconColor} />
      </div>
    </div>
  );
}
