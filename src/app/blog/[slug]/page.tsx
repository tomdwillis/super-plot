import { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost, getAllSlugs } from "@/lib/blog-posts";
import BlogCTA from "@/components/BlogCTA";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `https://superplot.io/blog/${post.slug}`;

  return {
    title: `${post.title} | Super Plot`,
    description: post.metaDescription,
    keywords: [post.targetKeyword, ...post.secondaryKeywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      url,
      siteName: "Super Plot",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: ["Super Plot"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `https://superplot.io/blog/${post.slug}`;

  // Related posts (other posts, excluding current)
  const related = blogPosts.filter((p) => p.slug !== post.slug);

  // Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url,
    publisher: {
      "@type": "Organization",
      name: "Super Plot",
      url: "https://superplot.io",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="px-6 py-16">
        <article className="max-w-3xl mx-auto">
          <nav className="mb-8 text-sm text-gray-400">
            <a href="/blog" className="hover:text-gray-600">
              Blog
            </a>{" "}
            / <span className="text-gray-600">{post.title}</span>
          </nav>

          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-500">{post.excerpt}</p>
            <time
              dateTime={post.publishedAt}
              className="block mt-4 text-sm text-gray-400"
            >
              Published{" "}
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </header>

          <div
            className="prose prose-gray prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2
              prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-gray-100"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <BlogCTA />

          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Related articles
              </h2>
              <div className="space-y-6">
                {related.map((r) => (
                  <a
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="block group"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{r.excerpt}</p>
                  </a>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
