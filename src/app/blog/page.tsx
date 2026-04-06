import { Metadata } from "next";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — Super Plot | Vacant Land Intelligence",
  description:
    "Guides and insights on vacant land valuation, due diligence, and property intelligence. Learn how to value, compare, and evaluate raw land.",
  openGraph: {
    title: "Blog — Super Plot",
    description:
      "Guides and insights on vacant land valuation, due diligence, and property intelligence.",
    type: "website",
    url: "https://superplot.io/blog",
    siteName: "Super Plot",
  },
};

export default function BlogIndex() {
  return (
    <main className="px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Blog</h1>
        <p className="text-lg text-gray-500 mb-12">
          Guides for vacant land investors, buyers, and brokers &mdash; valuation,
          due diligence, and market analysis.
        </p>
        <div className="space-y-10">
          {blogPosts.map((post) => (
            <article key={post.slug} className="group">
              <a href={`/blog/${post.slug}`} className="block">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-500 mb-3 leading-relaxed">
                  {post.excerpt}
                </p>
                <span className="text-brand-600 text-sm font-semibold">
                  Read more &rarr;
                </span>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16 bg-brand-50 border border-brand-200 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Ready to research a parcel?
          </h3>
          <p className="text-gray-600 mb-6">
            Get a free property intelligence report on any vacant land parcel in
            the US.
          </p>
          <a
            href="/order"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Order a Report &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
