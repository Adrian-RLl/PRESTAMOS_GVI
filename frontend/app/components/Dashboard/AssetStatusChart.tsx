'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AssetStatusChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function AssetStatusChart({ data }: AssetStatusChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[300px] w-full animate-pulse bg-slate-100 rounded-xl"></div>;
  }

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Distribución de Activos</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
              itemStyle={{ color: '#1e293b' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
