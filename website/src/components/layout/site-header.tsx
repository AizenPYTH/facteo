'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandWordmark } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { APP_LOGIN_URL, APP_REGISTER_URL } from '@/lib/constants';
import { NAV_LINKS } from '@/lib/content';
import { DURATION, EASE, spring } from '@/lib/motion';

/**
 * En-tête du site vitrine.
 *
 * Transparent en haut de page, puis fond translucide et filet de séparation dès
 * que l'on défile : la barre ne pèse sur le hero que lorsqu'elle est utile.
 *
 * L'onglet courant est signalé par un fond qui glisse d'un lien à l'autre
 * (`layoutId`), pas par une couleur seule — le repère reste lisible sans
 * dépendre de la perception des couleurs.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menu plein écran ouvert : on bloque le défilement du document derrière.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? 'border-b border-border/70 bg-white/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link aria-label="INVEQ — accueil" className="focus-ring rounded-lg" href="/">
          <BrandWordmark />
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring relative inline-flex rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                      active ? 'text-primary' : 'text-muted hover:text-foreground'
                    }`}
                    href={link.href}>
                    {active ? (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-indigo-50"
                        layoutId="nav-active"
                        transition={reduce ? { duration: 0 } : spring}
                      />
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button href={APP_LOGIN_URL} variant="ghost">
            Se connecter
          </Button>
          <Button href={APP_REGISTER_URL}>Commencer</Button>
        </div>

        <button
          aria-controls="menu-mobile"
          aria-expanded={open}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="focus-ring -mr-2 rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((value) => !value)}
          type="button">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-white/95 backdrop-blur-xl md:hidden"
            exit={{ opacity: 0 }}
            id="menu-mobile"
            initial={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE }}>
            {/* Un clic n'importe où dans le panneau referme le menu : sans quoi
                il resterait ouvert par-dessus la page d'arrivée. Délégation
                plutôt qu'un effet sur `pathname`, qui déclenchait un rendu en
                cascade. */}
            <motion.nav
              aria-label="Navigation principale"
              className="flex flex-col gap-1 px-5 pb-10 pt-6"
              initial="hidden"
              animate="show"
              onClick={() => setOpen(false)}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}>
              {NAV_LINKS.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE } },
                  }}>
                  <Link
                    className="focus-ring block rounded-xl px-3 py-3.5 text-[17px] font-medium text-foreground transition-colors hover:bg-slate-50"
                    href={link.href}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                className="mt-6 flex flex-col gap-2.5 border-t border-border pt-6"
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE } },
                }}>
                <Button fullWidth href={APP_REGISTER_URL} size="lg">
                  Commencer gratuitement
                </Button>
                <Button fullWidth href={APP_LOGIN_URL} size="lg" variant="secondary">
                  Se connecter
                </Button>
              </motion.div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
