'use client';

import { useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';

function DemoContent() {
  const searchParams = useSearchParams();
  const isBroken = searchParams.get('broken') === 'true';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      {/* 
        Header:
        If broken=true, the header will be positioned absolutely to occlude the CTA.
        Using fixed and some margin tweaking to intentionally build a broken state.
      */}
      <header className={`p-4 bg-white border-b flex justify-between items-center shadow-sm w-full top-0 left-0 transition-all ${
        isBroken ? 'fixed z-50 h-24' : 'relative z-10 h-16'
      }`}>
        <div className="font-bold text-xl tracking-tighter">Acme Corp</div>
        <nav className="flex gap-4">
          <span className="text-sm font-medium">Home</span>
          <span className="text-sm font-medium text-slate-500">Shop</span>
        </nav>
      </header>

      {/* Hero section */}
      <main className={`max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center text-center pb-32 transition-all ${
        isBroken ? 'pt-8' : 'pt-24'
      }`}>


        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          The ultimate widget for developers.
        </h1>
        
        {/* Added some dummy long content to ensure scrollability */}
        <div className="flex flex-col gap-12 my-12 text-slate-400">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col gap-4">
              <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mx-auto" />
              <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mx-auto" />
              <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Product Card */}
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 flex flex-col gap-6 relative">
          <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
            <span className="text-8xl">📦</span>
          </div>
          
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">Acme Widget Pro</h2>
            <span className="font-mono font-bold text-lg">$99</span>
          </div>
          
          <button 
            data-optikops="primary-cta"
            onClick={() => alert('Added to cart!')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform focus:ring-4 focus:ring-blue-500/50 outline-none flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
          <p className="text-xs text-slate-400 text-center">Free shipping worldwide. 30-day returns.</p>
        </div>

        {/* More dummy content below to ensure the button isn't at the absolute bottom */}
        <div className="h-[100vh] w-full" />
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DemoContent />
    </Suspense>
  );
}
