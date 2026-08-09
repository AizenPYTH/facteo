import { readFile, readdir } from 'fs/promises';
import path from 'path';

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';

import type { BlogCategory, BlogPost, BlogPostMeta } from '@/types/blog';

const CONTENT_DIR = path.join(process.cwd(), 'content/blog');
const WORDS_PER_MINUTE = 200;

type Frontmatter = {
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  date: string;
  draft?: boolean;
};

function readingTimeFor(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

async function loadSlugs(): Promise<string[]> {
  const files = await readdir(CONTENT_DIR);
  return files.filter((file) => file.endsWith('.md')).map((file) => file.replace(/\.md$/, ''));
}

async function loadRaw(slug: string): Promise<{ data: Frontmatter; content: string } | null> {
  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${slug}.md`), 'utf-8');
    const { data, content } = matter(raw);
    return { data: data as Frontmatter, content };
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const slugs = await loadSlugs();

  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const raw = await loadRaw(slug);
      if (!raw || raw.data.draft) return null;

      const meta: BlogPostMeta = {
        slug,
        title: raw.data.title,
        excerpt: raw.data.excerpt,
        category: raw.data.category,
        author: raw.data.author,
        date: raw.data.date,
        readingTime: readingTimeFor(raw.content),
      };
      return meta;
    }),
  );

  return posts
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const raw = await loadRaw(slug);
  if (!raw || raw.data.draft) return null;

  const html = await renderMarkdown(raw.content);

  return {
    slug,
    title: raw.data.title,
    excerpt: raw.data.excerpt,
    category: raw.data.category,
    author: raw.data.author,
    date: raw.data.date,
    readingTime: readingTimeFor(raw.content),
    html,
  };
}

export async function getAllCategories(): Promise<BlogCategory[]> {
  const posts = await getAllPosts();
  return Array.from(new Set(posts.map((post) => post.category)));
}

export async function getRelatedPosts(post: BlogPostMeta, limit = 3): Promise<BlogPostMeta[]> {
  const posts = (await getAllPosts()).filter((candidate) => candidate.slug !== post.slug);

  const sameCategory = posts.filter((candidate) => candidate.category === post.category);
  const rest = posts.filter((candidate) => candidate.category !== post.category);

  return [...sameCategory, ...rest].slice(0, limit);
}
