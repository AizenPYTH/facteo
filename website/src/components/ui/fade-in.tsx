'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'none';
};

export function FadeIn({ children, className, delay = 0, direction = 'up' }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const offset = direction === 'up' ? 24 : direction === 'down' ? -24 : 0;

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className={className}
      initial={{ opacity: 0, y: offset }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}>
      {children}
    </motion.div>
  );
}
