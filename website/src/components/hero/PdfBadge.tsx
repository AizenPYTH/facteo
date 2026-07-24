'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PdfBadge({ visible = false }: { visible?: boolean }) {
  return (
    <motion.div
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -6,
        scale: visible ? 1 : 0.94,
      }}
      className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:right-6"
      initial={{ opacity: 0, y: -6, scale: 0.94 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <svg aria-hidden fill="none" height="14" viewBox="0 0 24 24" width="14">
        <path
          d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
        <path
          d="M13 2v6h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
      </svg>
      <span>PDF prêt</span>
    </motion.div>
  );
}
