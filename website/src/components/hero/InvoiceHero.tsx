'use client';

import React from 'react';
import { motion } from 'framer-motion';

import PaperContainer from '@/components/hero/PaperContainer';
import ClientHeader from '@/components/hero/ClientHeader';
import LineItemsList from '@/components/hero/LineItemsList';
import Calculations from '@/components/hero/Calculations';
import PdfBadge from '@/components/hero/PdfBadge';
import SignatureAnimator from '@/components/hero/SignatureAnimator';
import PaidStamp from '@/components/hero/PaidStamp';
import { useInvoiceSimulation } from '@/hooks/useInvoiceSimulation';

export default function InvoiceHero() {
  const sim = useInvoiceSimulation();

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Facturation réinventée</p>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.05]">
            Factures belles, simples et instantanées
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Une expérience de facturation qui met en valeur votre travail — claire, rapide et professionnelle.
          </p>
        </div>

        <div className="mt-14 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PaperContainer className="w-[780px] max-w-full">
              <div className="relative p-8">
                <PdfBadge visible={sim.showPdf} />
                <ClientHeader client={sim.client} />

                <div className="mt-6">
                  <LineItemsList items={sim.items} revealedCount={sim.revealedCount} />
                </div>

                <div className="mt-6 flex justify-end">
                  <Calculations subtotal={sim.subtotal} tvaRate={sim.tvaRate} showTva={sim.showTva} />
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="text-sm text-muted">Paiement instantané • Signature intégrée</div>
                  <div className="flex items-center gap-4">
                    <SignatureAnimator signed={sim.signed} />
                    <PaidStamp paid={sim.paid} />
                  </div>
                </div>
              </div>
            </PaperContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
