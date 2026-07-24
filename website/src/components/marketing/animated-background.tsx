'use client';

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#F4F2FF_0%,#F7F8FC_55%,#F7F8FC_100%)]" />
      <motion.div
        animate={{ opacity: [0.4, 0.65, 0.4], y: [0, 18, 0] }}
        className="absolute -left-1/4 top-[-10%] h-[55%] w-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_68%)]"
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{ opacity: [0.28, 0.48, 0.28], x: [0, 12, 0] }}
        className="absolute -right-1/5 top-[8%] h-[40%] w-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.14),transparent_70%)]"
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        animate={{ opacity: [0.18, 0.32, 0.18], y: [0, -10, 0] }}
        className="absolute bottom-[-5%] left-[20%] h-[35%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(11,14,20,0.05),transparent_70%)]"
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}
