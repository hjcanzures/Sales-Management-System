
import React from "react";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Bar, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export const BarChart = ({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => String(value),
  className,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%" className={cn(className)}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          tickFormatter={valueFormatter}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    {payload.map((entry, index) => (
                      <div key={`item-${index}`} className="flex flex-col">
                        <span className="text-[0.70rem] text-muted-foreground">
                          {entry.name}
                        </span>
                        <span className="font-bold text-foreground">
                          {valueFormatter(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            name={category}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export const LineChart = ({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => String(value),
  className,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%" className={cn(className)}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          tickFormatter={valueFormatter}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    {payload.map((entry, index) => (
                      <div key={`item-${index}`} className="flex flex-col">
                        <span className="text-[0.70rem] text-muted-foreground">
                          {entry.name}
                        </span>
                        <span className="font-bold text-foreground">
                          {valueFormatter(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        {categories.map((category, index) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 1 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name={category}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export const PieChart = ({
  data,
  index,
  categories,
  colors = ["#2563eb", "#4ade80", "#facc15", "#f87171", "#c084fc"],
  valueFormatter = (value: number) => String(value),
  className,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%" className={cn(className)}>
      <RechartsPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          data={data}
          dataKey={categories[0]}
          nameKey={index}
          cx="50%"
          cy="50%"
          outerRadius="90%"
          innerRadius="60%"
          paddingAngle={1}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground">
                        {payload[0].name}
                      </span>
                      <span className="font-bold text-foreground">
                        {valueFormatter(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs font-medium">{value}</span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
