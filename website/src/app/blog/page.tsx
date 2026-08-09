import type { Metadata } from 'next';

import { BlogCategoryFilter } from '@/components/blog/blog-category-filter';
import { BlogFeatured } from '@/components/blog/blog-featured';
import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import { getAllCategories, getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Le blog INVEQ — conseils facturation, gestion client et bonnes pratiques pour artisans et indépendants.',
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()]);

  if (posts.length === 0) {
    return (
      <>
        <PageHero
          subtitle="Conseils, guides et actualités pour les professionnels. Bientôt disponible."
          title="Blog INVEQ"
        />
        <section className="px-6 py-20 text-center lg:px-8">
          <FadeIn>
            <p className="mx-auto max-w-md text-muted">
              Nous préparons des articles sur la facturation, la gestion client et les bonnes pratiques
              pour artisans et indépendants.
            </p>
          </FadeIn>
        </section>
      </>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        subtitle="Conseils, guides et bonnes pratiques pour facturer sereinement, gérer vos clients et développer votre activité."
        title="Blog INVEQ"
      />
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <BlogFeatured post={featured} />
          </FadeIn>

          {rest.length > 0 ? (
            <div className="mt-16">
              <BlogCategoryFilter categories={categories} posts={rest} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
