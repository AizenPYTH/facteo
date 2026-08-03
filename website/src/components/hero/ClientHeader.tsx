'use client';

import React from 'react';

export default function ClientHeader({
  client,
}: {
  client: { name: string; id?: string };
}) {
  const invoiceNumber = 'FAC-2026-0142';

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#a855f7,#2563eb)] text-sm font-semibold tracking-tight text-white shadow-sm">
          I
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            Émetteur
          </p>
          <p className="mt-1 text-base font-semibold tracking-tight text-foreground">INVEQ</p>
          <p className="mt-0.5 text-xs text-muted">contact@inveq.fr</p>
        </div>
      </div>

      <div className="sm:text-right">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Facture</p>
        <p className="mt-1 font-mono text-sm font-semibold tracking-tight text-foreground">
          {invoiceNumber}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted">Client</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{client.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
