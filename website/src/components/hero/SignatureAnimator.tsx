'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SignatureAnimator({ signed = false }: { signed?: boolean }) {
  return (
    <div className="w-36">
      <motion.svg width="140" height="48" viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M6 30 C30 10, 60 40, 90 20 C120 0, 130 40, 134 30"
          stroke="#0F172A"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: signed ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}
