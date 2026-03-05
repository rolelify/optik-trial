'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Play, CheckCircle2, AlertTriangle, XCircle, Clock, Zap, ShieldAlert } from 'lucide-react';
import { RunRecord } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [diffText, setDiffText] = useState('');
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(data => setRuns(data))
      .catch(console.error);
    
    const interval = setInterval(() => {
      fetch('/api/runs')
        .then(r => r.json())
        .then(data => setRuns(data))
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    setLoading(true);

    const targetUrl = overrideUrl || url;
    let finalUrl = targetUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, diffText }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/runs/${data.runId}`);
      } else {
        alert(data.error || 'Failed to start audit');
        setLoading(false);
      }
    } catch (e) {
      alert('Error starting audit');
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight">MoatScore <span className="text-brand-500">CI</span></h1>
        <p className="text-xl text-muted-foreground">
          Analyze your SaaS defensibility on every commit. Gemini 3 Vision audits your UI for trust signals, monetization power, and workflow moats.
        </p>
      </section>

      <section className="max-w-xl mx-auto w-full">
        <div className="glass rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-brand-500 to-emerald-500" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deployment URL <span className="text-brand-500">*</span></label>
              <input 
                type="text" 
                required 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://preview-url.vercel.app" 
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-brand-500 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex justify-between">
                <span>PR Diff (Optional)</span>
                <span className="text-xs">Stateless delta analysis helper</span>
              </label>
              <textarea 
                value={diffText}
                onChange={e => setDiffText(e.target.value)}
                placeholder="Paste git diff here..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-brand-500 transition-colors h-32 font-mono text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                type="button"
                onClick={() => {
                  setUrl('http://localhost:3000/demo?variant=weak');
                  handleSubmit(undefined, 'http://localhost:3000/demo?variant=weak');
                }}
                disabled={loading}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <ShieldAlert className="w-4 h-4" /> Run weak demo
              </button>
              <button 
                type="button"
                onClick={() => {
                  setUrl('http://localhost:3000/demo?variant=strong');
                  handleSubmit(undefined, 'http://localhost:3000/demo?variant=strong');
                }}
                disabled={loading}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Zap className="w-4 h-4" /> Run strong demo
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Bot className="w-5 h-5 animate-spin" /> Analyzing Strategy...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" /> Run MoatScore Audit
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {runs.length > 0 && (
        <section className="max-w-4xl mx-auto w-full space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Recent Reports
          </h2>
          <div className="flex flex-col gap-3">
            {runs.slice(0, 10).map(run => (
              <Link key={run.id} href={`/runs/${run.id}`} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  {getStatusIcon(run.status)}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                       {run.result ? `Score: ${run.result.overall_score}` : 'Pending...'}
                      <span className="text-xs text-muted-foreground font-normal">
                        {new URL(run.url).hostname} • {new Date(run.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-sm mt-1">
                      {run.url}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {run.id.split('-')[0]} ↗
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
