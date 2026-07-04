"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tx = {
  _id: string;
  type: string;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  createdAt: string;
};

interface ChartPoint {
  date: string;          // "DD MMM"
  income: number;        // cumulative credits that day
  expense: number;       // cumulative debits that day
  balance: number;       // running net balance
  incomeDay: number;     // credits on that day only
  expenseDay: number;    // debits on that day only
  incomePercent: number;
  expensePercent: number;
  balancePercent: number;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as ChartPoint;

  return (
    <div className="bg-[#131A33]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl text-xs">
      <p className="font-semibold text-ink mb-2">{label}</p>
      {[
        { key: "incomePercent", label: "Income", color: "#22c55e", raw: data?.incomeDay },
        { key: "expensePercent", label: "Expense", color: "#ef4444", raw: data?.expenseDay },
        { key: "balancePercent", label: "Net Balance", color: "#eab308", raw: data?.balance },
      ].map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-6 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
            <span className="text-ink-muted">{row.label}</span>
          </div>
          <div className="text-right">
            <span style={{ color: row.color }} className="font-bold">
              {(data as any)?.[row.key]?.toFixed(1)}%
            </span>
            <span className="text-ink-muted ml-1">
              ({row.raw != null ? (row.raw >= 0 ? "+" : "") + row.raw.toLocaleString() : "0"})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-5 pt-1 text-xs">
      {[
        { color: "#22c55e", label: "Income" },
        { color: "#ef4444", label: "Expense" },
        { color: "#eab308", label: "Balance" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="w-4 h-[2px] rounded-full" style={{ background: item.color }} />
          <span className="text-ink-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Helper: bucket transactions by day ──────────────────────────────────────
function buildChartData(transactions: Tx[]): ChartPoint[] {
  if (!transactions.length) {
    // No data → return a single neutral point so lines render centred
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    return [{ date: today, income: 0, expense: 0, balance: 0, incomeDay: 0, expenseDay: 0, incomePercent: 50, expensePercent: 50, balancePercent: 50 }];
  }

  // Sort oldest → newest
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Group by date string
  const byDay = new Map<string, { incomeDay: number; expenseDay: number }>();
  for (const tx of sorted) {
    const dateStr = new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const prev = byDay.get(dateStr) ?? { incomeDay: 0, expenseDay: 0 };
    if (tx.direction === "credit") {
      prev.incomeDay += tx.amount;
    } else {
      prev.expenseDay += tx.amount;
    }
    byDay.set(dateStr, prev);
  }

  // Build cumulative series
  let cumIncome = 0;
  let cumExpense = 0;
  const raw: Omit<ChartPoint, "incomePercent" | "expensePercent" | "balancePercent">[] = [];

  for (const [date, { incomeDay, expenseDay }] of Array.from(byDay.entries())) {
    cumIncome += incomeDay;
    cumExpense += expenseDay;
    const balance = cumIncome - cumExpense;
    raw.push({ date, income: cumIncome, expense: cumExpense, balance, incomeDay, expenseDay });
  }

  // Normalize to percentage of max absolute value for each series (0-100 scale)
  const maxIncome = Math.max(...raw.map((d) => d.income), 1);
  const maxExpense = Math.max(...raw.map((d) => d.expense), 1);
  const maxAbsBalance = Math.max(...raw.map((d) => Math.abs(d.balance)), 1);

  return raw.map((d) => ({
    ...d,
    incomePercent: (d.income / maxIncome) * 100,
    expensePercent: (d.expense / maxExpense) * 100,
    // Balance: map from [-max, max] → [0, 100] so it centres at 50
    balancePercent: 50 + (d.balance / maxAbsBalance) * 50,
  }));
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function TransactionChart({ transactions }: { transactions: Tx[] }) {
  const data = useMemo(() => buildChartData(transactions), [transactions]);
  const hasData = transactions.length > 0;

  return (
    <div className="glass-card p-5 mt-6 relative overflow-hidden">
      {/* accent strip */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-80" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold">Activity Overview</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {hasData
              ? "Your income, expense & net balance trend"
              : "No transactions yet — chart will populate as activity happens"}
          </p>
        </div>
        {!hasData && (
          <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-ink-muted">
            Demo view
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

          <XAxis
            dataKey="date"
            tick={{ fill: "#8888aa", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#8888aa", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />

          {/* Centre reference at 50% (zero for balance) */}
          <ReferenceLine
            y={50}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }} />

          {/* Green = income */}
          <Line
            type="monotone"
            dataKey="incomePercent"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
          />

          {/* Red = expense */}
          <Line
            type="monotone"
            dataKey="expensePercent"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
          />

          {/* Yellow = net balance */}
          <Line
            type="monotone"
            dataKey="balancePercent"
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 4, fill: "#eab308", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <CustomLegend />
    </div>
  );
}
