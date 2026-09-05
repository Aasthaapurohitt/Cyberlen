import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RiskTrendChart({ scans }) {
  const data = [...scans]
    .reverse()
    .map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      riskScore: s.riskScore ?? 0,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-border bg-surface text-sm text-text-muted">
        No scans yet — trend will appear once the extension reports data.
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface p-5">
      <p className="mb-4 text-xs text-text-muted">Risk score over time</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#262C38" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#8892A4"
            tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#262C38" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#8892A4"
            tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#262C38" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1B202B",
              border: "1px solid #262C38",
              fontSize: 12,
              fontFamily: "IBM Plex Mono",
            }}
            labelStyle={{ color: "#E7EAF0" }}
          />
          <Line
            type="monotone"
            dataKey="riskScore"
            stroke="#5B7FFF"
            strokeWidth={2}
            dot={{ r: 3, fill: "#5B7FFF" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
