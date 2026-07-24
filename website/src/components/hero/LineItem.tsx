'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function LineItem({
  label,
  value,
  delay = 0,
  visible = true,
}: {
  label: string;
  value: number | string;
  delay?: number;
  visible?: boolean;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          className="flex items-center justify-between gap-4 border-b border-[rgba(15,23,42,0.05)] px-3.5 py-3.5 last:border-b-0 sm:px-4"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="text-sm text-foreground/90">{label}</div>
          <div className="shrink-0 font-mono text-sm font-medium tabular-nums text-foreground">
            {typeof value === 'number' ? `${value.toFixed(2)} €` : value}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
