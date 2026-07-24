'use client';

import React from 'react';

export default function ClientHeader({ client }: { client: { name: string; id?: string } }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">Facture pour</p>
        <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted">Date</p>
        <p className="text-sm text-foreground">{new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  );
}
