import Link from 'next/link';

import { BlogCover } from '@/components/blog/blog-cover';
import { Button } from '@/components/ui/button';
import { formatBlogDate } from '@/lib/format-blog-date';
import type { BlogPostMeta } from '@/types/blog';

export function BlogFeatured({ post }: { post: BlogPostMeta }) {
  return (
    <div className="card-hover grid overflow-hidden rounded-3xl border border-border/80 bg-surface md:grid-cols-2">
      <Link className="relative min-h-[240px] md:min-h-[340px]" href={`/blog/${post.slug}`}>
        <BlogCover category={post.category} className="h-full w-full" slug={post.slug} />
      </Link>
      <div className="flex flex-col justify-center p-8 lg:p-10">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          À la une
        </span>
        <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{post.category}</span>
        <Link href={`/blog/${post.slug}`}>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground transition-colors hover:text-primary sm:text-3xl">
            {post.title}
          </h2>
        </Link>
        <p className="mt-3 text-base leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <span>{formatBlogDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span>{post.readingTime} min de lecture</span>
        </div>
        <div className="mt-6">
          <Button href={`/blog/${post.slug}`}>Lire l&rsquo;article →</Button>
        </div>
      </div>
    </div>
  );
}
