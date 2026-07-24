'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PaidStamp({ paid = false }: { paid?: boolean }) {
  return (
    <motion.div
      animate={
        paid
          ? { scale: 1, rotate: -8, opacity: 1 }
          : { scale: 0.55, rotate: -14, opacity: 0 }
      }
      className="select-none rounded-md border-[1.5px] border-emerald-600/80 bg-emerald-50/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800 shadow-[0_6px_16px_-8px_rgba(5,150,105,0.45)]"
      initial={{ scale: 0.55, rotate: -14, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}>
      Payée
    </motion.div>
  );
}
