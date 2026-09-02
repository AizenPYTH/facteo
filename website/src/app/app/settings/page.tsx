'use client';

import Link from 'next/link';

import { SETTINGS_NAV_GROUPS } from '@/components/app/settings-nav';
import { Panel } from '@/components/app/ui';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[720px] space-y-6 p-5 sm:p-6">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-app-text">
          Choisissez une section
        </h2>
        <p className="mt-1 text-[13px] text-app-muted">
          Le menu de gauche reste disponible à tout moment. Les liens Aide et Légal sont en pied de
          colonne.
        </p>
      </div>

      {SETTINGS_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-app-faint">
            {group.title}
          </h3>
          <div className="space-y-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.href}>
                  <Panel className="transition-colors duration-150 hover:border-app-accent-border">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-app-field bg-app-accent-tint text-app-accent">
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                      <p className="text-[13.5px] font-semibold text-app-text">{item.label}</p>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
