'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PaidStamp({ paid = false }: { paid?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
      animate={paid ? { scale: 1, rotate: -6, opacity: 1 } : { scale: 0.4, rotate: -10, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-md border border-red-600 bg-red-50 px-3 py-1 text-red-700 text-sm font-semibold shadow-sm"
    >
      PAYÉE
    </motion.div>
  );
}
