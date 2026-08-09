'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { BlogPostCard } from '@/components/blog/blog-post-card';
import { cn } from '@/lib/utils';
import type { BlogCategory, BlogPostMeta } from '@/types/blog';

const ALL = 'Tous' as const;

export function BlogCategoryFilter({
  posts,
  categories,
}: {
  posts: BlogPostMeta[];
  categories: BlogCategory[];
}) {
  const [active, setActive] = useState<BlogCategory | typeof ALL>(ALL);
  const options: (BlogCategory | typeof ALL)[] = [ALL, ...categories];
  const filtered = active === ALL ? posts : posts.filter((post) => post.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option === active;
          return (
            <button
              className={cn(
                'relative rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'border-primary text-white' : 'border-border text-muted hover:border-primary/40 hover:text-foreground',
              )}
              key={option}
              onClick={() => setActive(option)}
              type="button">
              {isActive ? (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary"
                  layoutId="blog-filter-pill"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              ) : null}
              <span className="relative">{option}</span>
            </button>
          );
        })}
      </div>

      <motion.div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map((post) => (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              initial={{ opacity: 0, scale: 0.96 }}
              key={post.slug}
              layout
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              <BlogPostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">Aucun article dans cette catégorie pour le moment.</p>
      ) : null}
    </div>
  );
}
