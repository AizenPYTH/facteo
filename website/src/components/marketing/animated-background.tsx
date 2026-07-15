'use client';

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 15, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        className="absolute -right-16 top-32 h-96 w-96 rounded-full bg-sky-300/15 blur-3xl"
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]"
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
