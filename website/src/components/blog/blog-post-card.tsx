import Link from 'next/link';

import { BlogCover } from '@/components/blog/blog-cover';
import { formatBlogDate } from '@/lib/format-blog-date';
import type { BlogPostMeta } from '@/types/blog';

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface"
      href={`/blog/${post.slug}`}>
      <div className="aspect-video w-full">
        <BlogCover category={post.category} className="h-full w-full" slug={post.slug} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{post.category}</span>
        <h3 className="mt-2.5 text-lg font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <span>{formatBlogDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span>{post.readingTime} min de lecture</span>
        </div>
      </div>
    </Link>
  );
}
