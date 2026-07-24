'use client';

import React from 'react';

export default function PaperContainer({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-2xl bg-[#F7F3EE] shadow-[0_10px_30px_rgba(2,6,23,0.08)] border border-[rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}
