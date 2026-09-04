"use client";

interface DailyPoint {
  day: number;
  total: number;
  cumulative: number;
}

export function SpendChart({
  daily,
  plannedTotal,
  daysInMonth,
  todayDay,
  currency = "CLP",
}: {
  daily: DailyPoint[];
  plannedTotal: number;
  daysInMonth: number;
  todayDay: number;
  currency?: string;
}) {
  if (daily.length === 0) return null;

  const W = 880,
    H = 280;
  const padL = 56,
    padR = 24,
    padT = 16,
    padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxY = Math.max(plannedTotal, daily[daily.length - 1]?.cumulative ?? 0) * 1.05;
  const x = (d: number) => padL + (d / daysInMonth) * innerW;
  const y = (v: number) => padT + innerH - (v / maxY) * innerH;

  const planX1 = x(0),
    planY1 = y(0);
  const planX2 = x(daysInMonth),
    planY2 = y(plannedTotal);

  let path = `M ${x(0)} ${y(0)}`;
  daily.forEach((d) => {
    path += ` L ${x(d.day)} ${y(d.cumulative)}`;
  });

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: maxY * t,
    yPos: y(maxY * t),
  }));

  const xticks = [1, 5, 10, 15, 20, 25, 30].filter(
    (d) => d <= daysInMonth
  );

  const lastDay = daily[daily.length - 1];

  const prefix = currency === "USD" ? "US$" : "$";
  const fmtAxis = (val: number) => {
    if (val >= 1_000_000) return `${prefix}${(val / 1e6).toFixed(1)}M`;
    if (val >= 1_000) return `${prefix}${(val / 1e3).toFixed(0)}K`;
    return `${prefix}${val.toFixed(0)}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {/* Grid lines */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={padL}
          x2={W - padR}
          y1={t.yPos}
          y2={t.yPos}
          stroke="#E7E6E2"
          strokeWidth="1"
        />
      ))}
      {/* Y labels */}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={padL - 8}
          y={t.yPos + 3}
          fontSize="10"
          fontFamily="var(--cm-mono)"
          fill="#8B8B95"
          textAnchor="end"
          letterSpacing="0.04em"
        >
          {fmtAxis(t.val)}
        </text>
      ))}
      {/* X labels */}
      {xticks.map((d) => (
        <text
          key={d}
          x={x(d)}
          y={H - 12}
          fontSize="10"
          fontFamily="var(--cm-mono)"
          fill="#8B8B95"
          textAnchor="middle"
          letterSpacing="0.06em"
        >
          {d}
        </text>
      ))}
      {/* Today vertical */}
      {todayDay > 0 && (
        <>
          <line
            x1={x(todayDay)}
            x2={x(todayDay)}
            y1={padT}
            y2={H - padB}
            stroke="#7866FA"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          <text
            x={x(todayDay) + 6}
            y={padT + 12}
            fontSize="9"
            fontFamily="var(--cm-mono)"
            fill="#7866FA"
            letterSpacing="0.14em"
          >
            HOY
          </text>
        </>
      )}
      {/* Plan line (dashed) */}
      <line
        x1={planX1}
        y1={planY1}
        x2={planX2}
        y2={planY2}
        stroke="#8B8B95"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {/* Total cumulative line */}
      <path d={path} fill="none" stroke="#0B0B0F" strokeWidth="2" />
      {/* Dot at last point */}
      {lastDay && (
        <>
          <circle
            cx={x(lastDay.day)}
            cy={y(lastDay.cumulative)}
            r="8"
            fill="#0B0B0F"
            opacity="0.12"
          />
          <circle
            cx={x(lastDay.day)}
            cy={y(lastDay.cumulative)}
            r="4"
            fill="#0B0B0F"
          />
          <text
            x={x(lastDay.day) - 8}
            y={y(lastDay.cumulative) - 12}
            fontSize="11"
            fontFamily="var(--cm-mono)"
            fill="#0B0B0F"
            textAnchor="end"
            fontWeight="500"
          >
            {fmtAxis(lastDay.cumulative)}
          </text>
        </>
      )}
    </svg>
  );
}
