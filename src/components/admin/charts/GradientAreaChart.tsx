import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '../../Button';

interface GradientAreaChartProps {
  data: Array<{ date: string; revenue: number }>;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border p-3 rounded-xl shadow-xl">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-primary text-sm font-bold">
          {payload[0].value.toLocaleString()} Credits
        </p>
      </div>
    );
  }
  return null;
};

const GradientAreaChart: React.FC<GradientAreaChartProps> = ({ data, className }) => {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FE4331" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FE4331" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(254, 67, 49, 0.2)', strokeWidth: 2 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#FE4331"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            activeDot={{ r: 6, fill: '#FE4331', stroke: '#050505', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradientAreaChart;
