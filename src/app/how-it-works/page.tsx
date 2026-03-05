import { ArrowRight, Bot, Camera, FileCode } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight">How <span className="text-brand-500">OptikOps</span> Works</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          OptikOps uses Gemini 3 Vision to visually audit your preview deployments, ensuring critical UI elements are always functional.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 relative">
        {/* Connection line for desktop */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-brand-500/20 via-purple-500/20 to-brand-500/20 -z-10 -translate-y-1/2" />

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
            <span className="font-bold">1</span>
          </div>
          <h3 className="font-bold text-lg">Preview URL</h3>
          <p className="text-sm text-muted-foreground">You drop in a preview URL from Vercel or any other CI deployment.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Playwright Capture</h3>
          <p className="text-sm text-muted-foreground">We take full-viewport screenshots on mobile & desktop, and extract `[data-optikops]` element intent metrics.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Gemini 3 Spatial</h3>
          <p className="text-sm text-muted-foreground">The screenshot and metadata are passed to Gemini 3 Vision to semantically detect clips, occlusions, and readability.</p>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
          <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
            <FileCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">PR Comment</h3>
          <p className="text-sm text-muted-foreground">A detailed markdown report is generated containing the visual evidence and suggested code patch.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold">Intent Tracking</h2>
        <p className="text-muted-foreground">
          Instead of brittle pixel-diffs, OptikOps tracks <strong className="text-white">intent</strong>. Just tag your Primary CTA or any critical element with the `data-optikops` attribute:
        </p>

        <div className="bg-black/80 p-6 rounded-xl border border-white/10 font-mono text-sm overflow-x-auto text-green-400">
          <span className="text-blue-400">&lt;button</span> 
          <span className="text-purple-400"> data-optikops</span>=
          <span className="text-yellow-300">&quot;primary-cta&quot;</span>
          <span className="text-blue-400">&gt;</span>
          <br />
          &nbsp;&nbsp;Checkout Now
          <br />
          <span className="text-blue-400">&lt;/button&gt;</span>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Try it now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
