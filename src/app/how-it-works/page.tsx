import { ArrowRight, Bot, Camera, ShieldCheck, Target, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight">How <span className="text-brand-500">MoatScore CI</span> Works</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          MoatScore CI uses Gemini 3 Vision to audit your SaaS defensibility on every commit, ensuring your product remains uncopyable.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 relative">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-brand-500/20 via-emerald-500/20 to-brand-500/20 -z-10 -translate-y-1/2" />

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
            <span className="font-bold">1</span>
          </div>
          <h3 className="font-bold text-lg">Preview URL</h3>
          <p className="text-sm text-muted-foreground">You drop in a preview URL from Vercel or any CI deployment.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Playwright Audit</h3>
          <p className="text-sm text-muted-foreground">We capture mobile and desktop screenshots and extract structural DOM metadata.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Gemini Analysis</h3>
          <p className="text-sm text-muted-foreground">Gemini 3 Vision evaluates 8 defensibility vectors including trust, wedge, and switching costs.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Moat Report</h3>
          <p className="text-sm text-muted-foreground">A detailed report with a radar chart and experimental hypotheses is generated.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-500" /> Stateless Analysis
          </h2>
          <p className="text-muted-foreground">
            Unlike traditional visual regression that compares pixels, MoatScore CI performs <strong className="text-white">stateless strategic analysis</strong>. It audits what is actually there, not just what changed.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /> Detects missing trust signals (SOC2, logos)</li>
            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /> Evaluates wedge clarity and pricing power</li>
            <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /> Highlights risks of product &quot;commoditization&quot;</li>
          </ul>
        </div>

        <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-8 space-y-6 flex flex-col justify-center items-center text-center">
          <ShieldCheck className="w-16 h-16 text-brand-500" />
          <h2 className="text-2xl font-bold">Not a Wrapper.</h2>
          <p className="text-muted-foreground">
            This isn&apos;t Percy or a Playwright wrapper. It&apos;s a strategic layer that prevents you from shipping &quot;defenseless&quot; features.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Analyze your Moat <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
