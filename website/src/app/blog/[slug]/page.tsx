import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { AnimatedBackground } from '@/components/marketing/animated-background';
import { BlogCover } from '@/components/blog/blog-cover';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BlogShare } from '@/components/blog/blog-share';
import { FadeIn } from '@/components/ui/fade-in';
import { SITE_URL } from '@/lib/constants';
import { formatBlogDate } from '@/lib/format-blog-date';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
  const url = `${SITE_URL}/blog/${post.slug}`;

  return (
    <article>
      <div className="border-b border-border px-5 py-5 text-sm text-muted sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-hidden">
          <Link className="shrink-0 transition-colors hover:text-primary" href="/">
            Accueil
          </Link>
          <span aria-hidden>/</span>
          <Link className="shrink-0 transition-colors hover:text-primary" href="/blog">
            Blog
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-foreground">{post.title}</span>
        </div>
      </div>

      <div className="gradient-hero relative overflow-hidden px-5 pb-4 pt-12 sm:px-6 lg:px-8">
        <AnimatedBackground />
        <FadeIn className="relative mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{post.category}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <span>{formatBlogDate(post.date)}</span>
            <span aria-hidden>·</span>
            <span>{post.readingTime} min de lecture</span>
          </div>
        </FadeIn>
      </div>

      <div className="px-5 py-10 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl" delay={0.05}>
          <div className="aspect-[21/9] overflow-hidden rounded-3xl">
            <BlogCover category={post.category} className="h-full w-full" slug={post.slug} />
          </div>
        </FadeIn>

        <FadeIn className="mx-auto mt-10 max-w-3xl" delay={0.1}>
          <div
            className="blog-prose prose prose-neutral max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:text-foreground/90 prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              href="/blog">
              <ArrowLeft size={16} /> Tous les articles
            </Link>
            <BlogShare title={post.title} url={url} />
          </div>
        </FadeIn>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-border px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <FadeIn>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Articles similaires</h2>
            </FadeIn>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost, index) => (
                <FadeIn delay={index * 0.05} key={relatedPost.slug}>
                  <BlogPostCard post={relatedPost} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
