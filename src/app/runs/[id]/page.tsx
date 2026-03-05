/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Copy, ChevronDown, ChevronUp, RefreshCw, Camera, ExternalLink, Zap, Target, ShieldCheck } from 'lucide-react';
import { RunRecord } from '@/lib/types';
import { formatPrComment } from '@/lib/report/formatPrComment';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function RunResults({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchRun = async () => {
      const res = await fetch(`/api/runs/${resolvedParams.id}`);
      if (res.ok && active) {
        const data = await res.json();
        setRun(data);
      }
    };

    if (!run) {
      fetchRun();
    } else if (run.status === 'running') {
      const timer = setTimeout(() => {
        if (active) fetchRun();
      }, 2000);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    return () => {
      active = false;
    };
  }, [resolvedParams.id, run]);

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading Audit...</p>
      </div>
    );
  }

  if (run.status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full animate-ping" />
          <Bot className="w-10 h-10 text-brand-500 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">MoatScore Analysis...</h2>
          <p className="text-muted-foreground text-sm">
            Playwright is auditing {run.url}<br/>
            Gemini 3 Vision is evaluating defensibility.
          </p>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-4">
          <div className="bg-brand-500 h-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
        </div>
      </div>
    );
  }

  const result = run.result;
  if (!result) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-xl flex flex-col gap-3 max-w-2xl mx-auto">
        <h3 className="font-bold text-lg">Analysis Failed</h3>
        <p>{run.error || 'Unknown error occurred during analysis.'}</p>
      </div>
    );
  }

  const radarData = Object.entries(result.vectors).map(([key, value]) => ({
    subject: key.replace(/_/g, ' '),
    A: value,
    fullMark: 100,
  }));

  const handleCopy = () => {
    const md = formatPrComment(run);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Header Summary */}
      <div className="glass rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="space-y-4 z-10 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <ShieldCheck className="text-brand-500 w-8 h-8" />
            <h1 className="text-3xl font-bold">MoatScore Report</h1>
          </div>
          <div className="text-sm font-mono text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
            <ExternalLink className="w-4 h-4" />
            <a href={run.url} className="text-brand-400 hover:underline truncate max-w-xs md:max-w-md">{run.url}</a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 z-10">
          <div className={`text-7xl font-black ${getScoreColor(result.overall_score)}`}>
            {result.overall_score}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall Defensibility</div>
        </div>
        
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 blur-[120px] rounded-full opacity-10 pointer-events-none 
          ${result.overall_score >= 80 ? 'bg-emerald-500' : result.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Radar Chart */}
        <div className="lg:col-span-5 glass p-6 rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="font-bold mb-4 flex items-center gap-2 self-start">
            <Target className="w-4 h-4 text-brand-500" /> Defensibility Vectors
          </h3>
          <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Moat"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Moat Signals */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-emerald-400">
              <Zap className="w-4 h-4" /> Strengthened Signals
            </h3>
            <div className="space-y-3">
              {result.moat_delta.strengthened.length > 0 ? result.moat_delta.strengthened.map((item, i) => (
                <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-sm">
                  <div className="font-bold flex justify-between">
                    <span>{item.vector.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] opacity-50 font-mono">{item.evidence}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{item.reason}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic">No unique positive signals detected.</p>
              )}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-4 h-4" /> Weakened Signals (Risks)
            </h3>
            <div className="space-y-3">
              {result.moat_delta.weakened.length > 0 ? result.moat_delta.weakened.map((item, i) => (
                <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg text-sm">
                  <div className="font-bold flex justify-between">
                    <span>{item.vector.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] opacity-50 font-mono">{item.evidence}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{item.reason}</p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic">No critical weaknesses detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Issues & Wins */}
        <div className="glass p-6 rounded-2xl space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold border-b border-white/10 pb-2 flex justify-between items-center">
              Top Issues <span>⚠️</span>
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 px-2">
              {result.top_issues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="font-bold border-b border-white/10 pb-2 flex justify-between items-center">
              Quick Wins <span>🚀</span>
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 px-2">
              {result.quick_wins.map((win, i) => <li key={i}>{win}</li>)}
            </ul>
          </div>
        </div>

        {/* Experiments */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <h3 className="font-bold border-b border-white/10 pb-2">Recommended Experiments</h3>
          <div className="space-y-4">
            {result.recommended_experiments.map((exp, i) => (
              <div key={i} className="bg-black/40 border border-white/10 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-white">{exp.hypothesis}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${exp.effort === 'S' ? 'bg-green-500/20 text-green-400' : exp.effort === 'M' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {exp.effort} Effort
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{exp.change}</p>
                <div className="text-[10px] text-brand-400 font-bold uppercase tracking-tight pt-1">
                  Impact: {exp.expected_impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Evidence */}
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Camera className="w-5 h-5" /> Visual Evidence
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Mobile Viewport</h4>
            <div className="bg-black rounded-lg overflow-hidden border border-white/10">
              <img 
                src={run.mobileScreenshot ? `data:image/png;base64,${run.mobileScreenshot}` : `/runs/${run.id}/mobile/full.png`} 
                alt="Mobile UI" 
                className="w-full h-auto" 
              />
            </div>
          </div>
          <div className="glass p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Desktop Viewport</h4>
            <div className="bg-black rounded-lg overflow-hidden border border-white/10">
              <img 
                src={run.desktopScreenshot ? `data:image/png;base64,${run.desktopScreenshot}` : `/runs/${run.id}/desktop/full.png`} 
                alt="Desktop UI" 
                className="w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* PR Comment & Debug */}
      <div className="grid md:grid-cols-2 gap-8 pt-8">
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">PR Comment Markdown</h3>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-muted-foreground bg-black/40 p-4 rounded-lg h-48 overflow-y-auto whitespace-pre-wrap select-all">
            {formatPrComment(run)}
          </pre>
        </div>

        <div className="glass rounded-2xl overflow-hidden self-start">
          <button 
            onClick={() => setShowJson(!showJson)}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-brand-400"
          >
            Raw Gemini JSON
            {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showJson && (
            <pre className="p-4 bg-black/90 text-xs text-brand-300 overflow-x-auto h-48">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple fallback icon
function ShieldAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
