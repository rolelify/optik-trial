import { ShoppingCart } from 'lucide-react';

// Server component - broken state rendered on server before Playwright captures it
export default function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ broken?: string }>;
}) {
  // In Next.js 15, searchParams is a Promise
  return <DemoContent searchParamsPromise={searchParams} />;
}

async function DemoContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ broken?: string }>;
}) {
  const params = await searchParamsPromise;
  const isBroken = params?.broken === 'true';

  return (
    <div className="min-h-[200vh] bg-slate-50 text-slate-900 relative">
      {/*
        BROKEN STATE: Massive fixed header with z-index 9999 that aggressively
        covers the top of the viewport. The CTA is positioned near the top so it
        sits directly under this header when broken=true.
      */}
      {isBroken ? (
        <header
          className="fixed top-0 left-0 right-0 z-[9999] bg-black/90 text-white p-4 flex flex-col justify-end"
          style={{ height: '240px' }}
        >
          <div className="font-bold text-2xl">Acme Corp</div>
          <div className="text-sm mt-2 text-red-400 font-semibold">
            🚨 Flash sale ends in 5:00 — Free shipping on all orders!
          </div>
          <nav className="flex gap-6 mt-4 text-sm">
            <span>Home</span>
            <span>Shop</span>
            <span>Cart (0)</span>
          </nav>
        </header>
      ) : (
        <header className="relative z-10 bg-white border-b shadow-sm p-4 flex justify-between items-center h-16">
          <div className="font-bold text-xl">Acme Corp</div>
          <nav className="flex gap-4 text-sm">
            <span>Home</span>
            <span className="text-slate-500">Shop</span>
          </nav>
        </header>
      )}

      {/* Main content - pulled up under the header when broken */}
      <main
        className="max-w-sm mx-auto p-4 flex flex-col items-center"
        style={{ marginTop: isBroken ? '-200px' : '32px' }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center">
          The ultimate widget.
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-xl w-full border border-slate-100 flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">Acme Widget Pro</h2>
            <span className="font-mono font-bold text-lg">$99</span>
          </div>
          <p className="text-sm text-slate-400">Free shipping worldwide. 30-day returns.</p>

          <button
            data-optikops="primary-cta"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        </div>
      </main>
    </div>
  );
}
