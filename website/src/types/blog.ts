export type BlogCategory = 'Facturation' | 'Gestion client' | 'Bonnes pratiques';

export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  date: string;
  readingTime: number;
};

export type BlogPost = BlogPostMeta & {
  html: string;
};
