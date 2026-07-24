'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LineItem({ label, value, delay = 0 }: { label: string; value: number | string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.45 }}
      className="flex items-center justify-between border-b border-border py-3"
    >
      <div className="text-sm text-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{typeof value === 'number' ? `${value.toFixed(2)} €` : value}</div>
    </motion.div>
  );
}
