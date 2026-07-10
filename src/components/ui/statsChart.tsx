import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"


const chartMargin = { top: 20, right: 20, bottom: 5, left: 20 }

// Generic reward-epoch line chart shared by the FSP and validator statistics
// sections. Each `data` row is `{ x: <epoch>, [seriesName]: value }` with one
// entry in `keys` per series to draw. This module pulls in recharts (+d3),
// which is heavy — keep importers behind a lazy() boundary.
const StatsChart = ({ data, keys, formatY, height = 200 }: {
  data: Record<string, number>[],
  keys: string[],
  formatY: (v: number) => string,
  height?: number
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={chartMargin}>
      <XAxis dataKey="x" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} />
      <YAxis hide domain={['auto', 'auto']} />
      <Tooltip
        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
        itemStyle={{ color: 'white' }}
        formatter={(v: number) => formatY(v)}
      />
      {keys.map((key, i) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={i === 0 ? 'white' : 'rgba(255,255,255,0.5)'}
          strokeWidth={2}
          dot={{ fill: 'black', stroke: i === 0 ? 'white' : 'rgba(255,255,255,0.5)', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name={key}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
)

export default StatsChart
