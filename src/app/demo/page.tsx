import { ShieldCheck, Zap, Lock, Globe, Layers } from 'lucide-react';

export default function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  return <DemoContent searchParamsPromise={searchParams} />;
}

async function DemoContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ variant?: string }>;
}) {
  const params = await searchParamsPromise;
  const isStrong = params?.variant === 'strong';

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-brand-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              {isStrong ? <ShieldCheck className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            {isStrong ? 'SecureFlow Pro' : 'Simple SaaS Template'}
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <span className="hover:text-white transition-colors cursor-pointer">Features</span>
            <span className="hover:text-white transition-colors cursor-pointer">Pricing</span>
            {isStrong && <span className="hover:text-white transition-colors cursor-pointer">Security</span>}
            <button className={`${isStrong ? 'bg-brand-600' : 'bg-white/10'} text-white px-5 py-2.5 rounded-full font-bold hover:opacity-90 transition-all`}>
               {isStrong ? 'Get Early Access' : 'Sign Up'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            {isStrong && (
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full text-brand-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3 h-3" /> New: Enterprise Multi-Tenant Engine
              </div>
            )}
            <h1 className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter">
              {isStrong ? 'The operating system for trust.' : 'Build your next big idea faster.'}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              {isStrong 
                ? 'Automate compliance, security posture, and data sovereignty across 50+ regions with a single line of code.' 
                : 'A clean, simple template to get your SaaS up and running in minutes without the complexity.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-black px-8 py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isStrong ? 'Start Enterprise Trial' : 'Get Started'}
              </button>
              {isStrong && (
                <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all text-left">
                  <div className="text-sm opacity-50 font-medium">Starting at</div>
                  <div>$49 / seat / month</div>
                </button>
              )}
            </div>

            {isStrong && (
              <div className="flex items-center gap-2 text-brand-400 font-bold mb-4">
                <Globe className="w-5 h-5" /> Invite your team in seconds
              </div>
            )}

            {isStrong && (
              <div className="pt-8 border-t border-white/5 space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trusted by builders at</p>
                <div className="flex flex-wrap gap-8 opacity-40 grayscale contrast-125">
                  <div className="font-black text-lg">DATADOG</div>
                  <div className="font-black text-lg">VERCEL</div>
                  <div className="font-black text-lg">STRIPE</div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
             <div className="aspect-square bg-linear-to-br from-brand-600/20 to-emerald-600/20 rounded-[40px] border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-12 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 flex flex-col justify-center gap-6">
                   <div className="space-y-2">
                      <div className="w-12 h-1.5 bg-brand-500 rounded-full" />
                      <div className="w-32 h-1.5 bg-white/10 rounded-full" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                      <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                   </div>
                   <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                </div>
                
                {isStrong && (
                  <div className="absolute bottom-8 right-8 bg-black border border-brand-500/50 p-4 rounded-2xl shadow-2xl animate-bounce shadow-brand-500/20">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-400">
                           <Lock className="w-5 h-5" />
                        </div>
                        <div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Status</div>
                           <div className="text-sm font-bold text-emerald-400 mt-1">SOC2 COMPLIANT</div>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {isStrong && (
          <div className="mt-32 grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: 'Edge Sovereignty', desc: 'Deploy to 50+ regions with local data residency.' },
              { icon: Lock, title: 'Zero Trust Auth', desc: 'Hardware-grade security for every single request.' },
              { icon: Zap, title: 'Real-time Audit', desc: 'Continuous compliance monitoring out of the box.' }
            ].map((f, i) => (
              <div key={i} className="glass p-8 rounded-3xl space-y-4 border-white/5 hover:border-brand-500/30 transition-colors">
                <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
