"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  score: number;
}

export function TrustScoreRing({ score }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayed / 100) * circumference;

  const color =
    score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <motion.span
        className="text-2xl font-bold tabular-nums"
        style={{ color }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {displayed}%
      </motion.span>
    </div>
  );
}
