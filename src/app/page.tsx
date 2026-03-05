'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Play, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { RunRecord } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [diffText, setDiffText] = useState('');
  const [intentMode, setIntentMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(data => setRuns(data))
      .catch(console.error);
    
    // Auto-refresh the list every 5s
    const interval = setInterval(() => {
      fetch('/api/runs')
        .then(r => r.json())
        .then(data => setRuns(data))
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepend http if necessary
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, diffText, intentMode }),
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
        <h1 className="text-5xl font-extrabold tracking-tight">CI for <span className="text-brand-500">Pixels</span></h1>
        <p className="text-xl text-muted-foreground">
          Drop in a preview URL. We'll use Gemini 3 Vision to ensure your Primary CTA isn't blocked by a broken layout or overlay.
        </p>
      </section>

      <section className="max-w-xl mx-auto w-full">
        <div className="glass rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-brand-500 to-purple-500" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview URL <span className="text-brand-500">*</span></label>
              <input 
                type="text" 
                required 
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://optik-demo.vercel.app/demo?broken=false" 
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-brand-500 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex justify-between">
                <span>PR Diff (Optional)</span>
                <span className="text-xs">Helps Gemini isolate the root cause</span>
              </label>
              <textarea 
                value={diffText}
                onChange={e => setDiffText(e.target.value)}
                placeholder="\`\`\`diff&#10;+ <div className=&#34;z-[99] fixed inset-0&#34;>...</div>&#10;\`\`\`"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-brand-500 transition-colors h-32 font-mono text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  checked={intentMode} 
                  onChange={e => setIntentMode(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-brand-500 focus:ring-brand-500 focus:ring-offset-background"
                />
                <span>Intent Mode (Extract `[data-optikops]`)</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Bot className="w-5 h-5 animate-spin" /> Analyzing Elements...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" /> Run OptikOps
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {runs.length > 0 && (
        <section className="max-w-4xl mx-auto w-full space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Recent Audits
          </h2>
          <div className="flex flex-col gap-3">
            {runs.slice(0, 10).map(run => (
              <Link key={run.id} href={`/runs/${run.id}`} className="glass rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  {getStatusIcon(run.status)}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {new URL(run.url).hostname}
                      <span className="text-xs text-muted-foreground font-normal capitalize">
                        {run.status === 'running' ? 'Running...' : new Date(run.timestamp).toLocaleTimeString()}
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
