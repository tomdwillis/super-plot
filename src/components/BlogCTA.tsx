export default function BlogCTA() {
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-8 my-12 text-center">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Get a free property report on any US parcel
      </h3>
      <p className="text-gray-600 mb-6 max-w-lg mx-auto">
        Super Plot pulls zoning, comps, flood zone, environmental flags, and
        more &mdash; so you can make informed land decisions in minutes.
      </p>
      <a
        href="/order"
        className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Run a Free Report &rarr;
      </a>
      <p className="text-sm text-gray-400 mt-3">No account required.</p>
    </div>
  );
}
