'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { NAV_LINKS } from '@/lib/content';
import { APP_LOGIN_URL, APP_REGISTER_URL, SITE_NAME } from '@/lib/constants';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            F
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href={APP_LOGIN_URL} variant="ghost">
            Se connecter
          </Button>
          <Button href={APP_REGISTER_URL}>
            Commencer gratuitement
          </Button>
        </div>

        <button
          aria-label="Menu"
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          type="button">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-border bg-surface px-6 py-4 md:hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}>
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  className="py-2 text-sm font-medium text-foreground"
                  href={link.href}
                  key={link.href}
                  onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Button href={APP_LOGIN_URL} variant="secondary">
                  Se connecter
                </Button>
                <Button href={APP_REGISTER_URL}>
                  Commencer gratuitement
                </Button>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
