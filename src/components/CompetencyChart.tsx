import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { COMPETENCIES, COMPETENCY_ORDER } from '../data/competencies';
import type { CompetencyId } from '../types';

export function CompetencyRadar({
  primary,
  comparison,
  primaryLabel = 'Your score',
  comparisonLabel = 'Comparison',
  height = 300,
  competencies,
}: {
  primary: Partial<Record<CompetencyId, number>>;
  comparison?: Partial<Record<CompetencyId, number>>;
  primaryLabel?: string;
  comparisonLabel?: string;
  height?: number;
  competencies?: CompetencyId[];
}) {
  const ids = (competencies ?? COMPETENCY_ORDER).filter((c) => primary[c] !== undefined || comparison?.[c] !== undefined);
  const data = ids.map((c) => ({ competency: COMPETENCIES[c].short, primary: primary[c] ?? 0, comparison: comparison?.[c] ?? 0 }));
  if (ids.length < 3) return null;
  const summary = ids.map((c) => `${COMPETENCIES[c].label} ${primary[c] ?? 'not assessed'}`).join(', ');
  return (
    <figure role="img" aria-label={`Competency radar chart. ${primaryLabel}: ${summary}.`}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="66%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="#E8E1D6" />
            <PolarAngleAxis dataKey="competency" tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {comparison && <Radar name={comparisonLabel} dataKey="comparison" stroke="#B9A88F" fill="#B9A88F" fillOpacity={0.15} strokeDasharray="4 3" />}
            <Radar name={primaryLabel} dataKey="primary" stroke="#2A6E69" fill="#358881" fillOpacity={0.3} strokeWidth={2} />
            <Tooltip formatter={(v: number) => `${v}/100`} contentStyle={{ borderRadius: 12, border: '1px solid #E8E1D6', fontSize: 12 }} />
            {comparison && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
