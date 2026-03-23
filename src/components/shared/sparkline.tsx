"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type SparklinePoint = { time: string; value: number };

export type SparklineProps = {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

const DEFAULT_UP = "#00D68F";
const DEFAULT_DOWN = "#FF5C5C";

export function Sparkline({
  data,
  width = 80,
  height = 30,
  color,
  className,
}: SparklineProps) {
  const { points, stroke, viewBox } = useMemo(() => {
    if (!data.length) {
      return {
        points: "",
        stroke: DEFAULT_UP,
        viewBox: `0 0 ${width} ${height}`,
      };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padX = 1;
    const padY = 2;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const pts = data.map((d, i) => {
      const x =
        data.length === 1
          ? padX + innerW / 2
          : padX + (i / (data.length - 1)) * innerW;
      const y = padY + innerH - ((d.value - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    const first = data[0]!.value;
    const last = data[data.length - 1]!.value;
    const auto = last >= first ? (color ?? DEFAULT_UP) : (color ?? DEFAULT_DOWN);

    return {
      points: pts.join(" "),
      stroke: color ?? auto,
      viewBox: `0 0 ${width} ${height}`,
    };
  }, [data, width, height, color]);

  if (!data.length) {
    return (
      <svg
        width={width}
        height={height}
        className={cn("shrink-0 text-muted-foreground/30", className)}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={cn("shrink-0 overflow-visible", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
