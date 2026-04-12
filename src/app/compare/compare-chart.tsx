"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCardName } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export interface CompareChartCard {
  cardCode: string;
  nameEn?: string | null;
  nameJp?: string | null;
  nameKo?: string | null;
  nameTh?: string | null;
  nameZh?: string | null;
}

export function CompareChart({
  chartData,
  cards,
  colors,
}: {
  chartData: Record<string, unknown>[];
  cards: CompareChartCard[];
  colors: string[];
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="p-4">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {cards.map((card, i) => (
            <Line
              key={card.cardCode}
              type="monotone"
              dataKey={card.cardCode}
              stroke={colors[i % colors.length]}
              dot={false}
              strokeWidth={2}
              name={`${card.cardCode} ${getCardName(lang, card)}`}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
