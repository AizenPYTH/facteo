'use client';

import { Check, Circle, Eye } from 'lucide-react';

import { cn } from '@/lib/utils';

type StepState = 'done' | 'current' | 'upcoming' | 'skipped';

type TimelineStep = {
  id: string;
  label: string;
  hint?: string;
  state: StepState;
};

function invoiceSteps(status: string): TimelineStep[] {
  const created: StepState = 'done';
  let sent: StepState = 'upcoming';
  let viewed: StepState = 'upcoming';
  let paid: StepState = 'upcoming';

  if (status === 'canceled') {
    return [
      { id: 'created', label: 'Créée', state: 'done' },
      { id: 'sent', label: 'Envoyée', state: 'skipped', hint: 'Annulée' },
      { id: 'viewed', label: 'Vue', state: 'skipped', hint: 'Bientôt' },
      { id: 'paid', label: 'Payée', state: 'skipped' },
    ];
  }

  if (status === 'draft') {
    sent = 'current';
  } else if (status === 'sent' || status === 'overdue') {
    sent = 'done';
    viewed = 'current';
  } else if (status === 'partially_paid') {
    sent = 'done';
    viewed = 'done';
    paid = 'current';
  } else if (status === 'paid') {
    sent = 'done';
    viewed = 'done';
    paid = 'done';
  }

  return [
    { id: 'created', label: 'Créée', state: created },
    {
      id: 'sent',
      label: 'Envoyée',
      state: sent,
      hint: sent === 'current' ? 'À envoyer' : undefined,
    },
    {
      id: 'viewed',
      label: 'Vue',
      state: viewed,
      hint: viewed === 'upcoming' || viewed === 'current' ? 'Bientôt' : undefined,
    },
    {
      id: 'paid',
      label: 'Payée',
      state: paid,
      hint: paid === 'current' ? 'En cours' : undefined,
    },
  ];
}

function quoteSteps(status: string): TimelineStep[] {
  if (status === 'rejected' || status === 'expired') {
    return [
      { id: 'created', label: 'Créé', state: 'done' },
      { id: 'sent', label: 'Envoyé', state: status === 'expired' ? 'done' : 'skipped' },
      {
        id: 'accepted',
        label: status === 'rejected' ? 'Refusé' : 'Expiré',
        state: 'skipped',
      },
      { id: 'converted', label: 'Converti', state: 'skipped' },
    ];
  }

  const created: StepState = 'done';
  let sent: StepState = 'upcoming';
  let accepted: StepState = 'upcoming';
  let converted: StepState = 'upcoming';

  if (status === 'draft') {
    sent = 'current';
  } else if (status === 'sent') {
    sent = 'done';
    accepted = 'current';
  } else if (status === 'accepted') {
    sent = 'done';
    accepted = 'done';
    converted = 'current';
  } else if (status === 'converted') {
    sent = 'done';
    accepted = 'done';
    converted = 'done';
  }

  return [
    { id: 'created', label: 'Créé', state: created },
    { id: 'sent', label: 'Envoyé', state: sent },
    { id: 'accepted', label: 'Accepté', state: accepted },
    { id: 'converted', label: 'Converti', state: converted },
  ];
}

export function DocumentStatusTimeline({
  kind,
  status,
  className,
}: {
  kind: 'invoice' | 'quote';
  status: string;
  className?: string;
}) {
  const steps = kind === 'invoice' ? invoiceSteps(status) : quoteSteps(status);

  return (
    <div className={cn('rounded-xl border border-slate-100 bg-slate-50/60 p-4', className)}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Chronologie
      </p>
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li className="relative flex gap-3 pb-4 last:pb-0" key={step.id}>
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[9px] top-5 h-[calc(100%-12px)] w-px',
                    step.state === 'done' ? 'bg-primary/40' : 'bg-slate-200',
                  )}
                />
              ) : null}
              <span
                className={cn(
                  'relative z-[1] mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-2 ring-white',
                  step.state === 'done' && 'bg-primary text-white',
                  step.state === 'current' && 'bg-blue-50 text-primary ring-primary/20',
                  step.state === 'upcoming' && 'bg-slate-100 text-slate-300',
                  step.state === 'skipped' && 'bg-slate-100 text-slate-300',
                )}>
                {step.state === 'done' ? (
                  <Check size={10} strokeWidth={3} />
                ) : step.id === 'viewed' ? (
                  <Eye size={9} />
                ) : (
                  <Circle size={8} fill="currentColor" strokeWidth={0} />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.state === 'done' || step.state === 'current'
                      ? 'text-slate-900'
                      : 'text-slate-400',
                  )}>
                  {step.label}
                </p>
                {step.hint ? (
                  <p className="mt-0.5 text-[11px] text-slate-400">{step.hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
