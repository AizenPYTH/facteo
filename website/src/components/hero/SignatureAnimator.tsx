'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function SignatureAnimator({ signed = false }: { signed?: boolean }) {
  return (
    <div className="w-[148px]">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Signature</p>
      <motion.svg
        aria-hidden
        className="overflow-visible"
        fill="none"
        height="44"
        viewBox="0 0 140 48"
        width="140"
        xmlns="http://www.w3.org/2000/svg">
        <motion.path
          animate={{ pathLength: signed ? 1 : 0, opacity: signed ? 1 : 0.25 }}
          d="M6 30 C30 10, 60 40, 90 20 C120 0, 130 40, 134 30"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.25 }}
          stroke="#0B1220"
          strokeLinecap="round"
          strokeWidth={1.6}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </div>
  );
}
