'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function InlineFieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 flex items-start gap-1.5 whitespace-pre-line text-xs font-medium text-red-600"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: -4 }}
          role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={14} />
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

export function ComposerErrorBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
      initial={{ opacity: 0, y: -8 }}
      role="alert">
      <ul className="space-y-1.5">
        {messages.map((msg) => (
          <li className="flex items-center gap-2 text-sm font-medium text-red-700" key={msg}>
            <AlertCircle className="shrink-0" size={16} />
            {msg}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
