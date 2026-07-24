'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PaperContainer({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-[1.35rem] border border-[rgba(15,23,42,0.07)] bg-[#FBF8F3] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_18px_50px_-12px_rgba(15,23,42,0.18)] ${className}`}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
      {/* Paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.55\'/%3E%3C/svg%3E")',
        }}
      />
      {/* Top edge highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
