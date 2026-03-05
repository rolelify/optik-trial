/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, XCircle, AlertTriangle, Copy, ChevronDown, ChevronUp, RefreshCw, Camera } from 'lucide-react';
import { RunRecord } from '@/lib/types';
import { formatPrComment } from '@/lib/formatter';

export default function RunResults({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop'>('mobile');
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
          <h2 className="text-2xl font-bold">Running OptikOps...</h2>
          <p className="text-muted-foreground text-sm">
            Playwright is capturing {run.url}<br/>
            Gemini 3 Vision is analyzing intent.
          </p>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-4">
          <div className="bg-brand-500 h-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
        </div>
      </div>
    );
  }

  const badgeColor = run.status === 'pass' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                     run.status === 'fail' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                     'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';

  const BadgeIcon = run.status === 'pass' ? CheckCircle2 : 
                    run.status === 'fail' ? XCircle : 
                    AlertTriangle;

  const currentResult = activeTab === 'mobile' ? run.mobileResult : run.desktopResult;
  const isWarn = run.status === 'warn';

  const handleCopy = () => {
    const md = formatPrComment(run);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Top Card */}
      <div className="glass rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-4 z-10">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="text-brand-500" />
            Gemini 3 Spatial Verdict
          </h1>
          <div className="text-sm font-mono text-muted-foreground truncate max-w-md">
            URL: <a href={run.url} className="text-brand-400 hover:underline">{run.url}</a>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 z-10">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${badgeColor} font-bold text-xl uppercase tracking-widest`}>
            <BadgeIcon className="w-6 h-6" />
            {run.status}
          </div>
          {run.status === 'fail' && (
            <div className="text-red-400 font-bold text-sm bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20 animate-pulse">
              Critical action blocked: primary-cta is not clickable on Mobile.
            </div>
          )}
        </div>
        
        {/* Decorative background glow based on status */}
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 blur-[100px] rounded-full opacity-20 pointer-events-none 
          ${run.status === 'pass' ? 'bg-green-500' : run.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`} />
      </div>

      {/* Error Alert */}
      {run.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0 text-red-500" />
            <h3 className="font-bold text-lg">Backend Error Detected</h3>
          </div>
          <pre className="text-xs bg-black/40 p-4 rounded-lg overflow-x-auto border border-white/10 whitespace-pre-wrap">
            {run.error}
          </pre>
          <p className="text-sm text-red-300/80">
            Check your `.env` file for a valid `GEMINI_API_KEY` (usually starts with AIzaSy) and ensure Playwright browsers are installed locally.
          </p>
        </div>
      )}

      {/* Warning/Dispute Alert */}
      {isWarn && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 p-4 rounded-xl flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>
            <strong>Disputed Signal:</strong> The deterministic clickability check disagreed with the AI prediction. Please review the visual evidence.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'mobile' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
        >
          📱 Mobile Viewport
        </button>
        <button 
          onClick={() => setActiveTab('desktop')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'desktop' ? 'bg-brand-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
        >
          💻 Desktop Viewport
        </button>
      </div>

      {currentResult && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Col: Evidence Data */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-xl space-y-4">
              <h3 className="font-bold border-b border-white/10 pb-2">Analysis Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Pass Status</span>
                  <span className={`font-bold ${currentResult.pass ? 'text-green-400' : 'text-red-400'}`}>
                    {currentResult.pass ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Failure Type</span>
                  <span className="font-mono bg-black/40 px-2 py-1 rounded border border-white/10">
                    {currentResult.failure_type || 'none'}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground block mb-1 text-sm">Issue Detected</span>
                <p className="text-sm bg-black/40 p-4 rounded-lg border border-white/10 leading-relaxed">
                  {currentResult.issue_detected || 'No issues detected.'}
                </p>
              </div>

              {currentResult.suggested_patch && (
                <div>
                  <span className="text-muted-foreground block mb-1 text-sm">Suggested Patch</span>
                  <pre className="text-xs bg-black/80 text-green-400 p-4 rounded-lg overflow-x-auto border border-white/10">
                    {currentResult.suggested_patch}
                  </pre>
                </div>
              )}
            </div>

            <div className="glass p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold">PR Comment Markdown</h3>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs text-muted-foreground bg-black/40 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap select-all">
                {formatPrComment(run)}
              </pre>
            </div>

            <div className="glass rounded-xl overflow-hidden">
              <button 
                onClick={() => setShowJson(!showJson)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Raw Gemini Logic
                {showJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showJson && (
                <div className="p-4 bg-black/90 border-t border-white/10">
                  <pre className="text-xs text-brand-300 overflow-x-auto">
                    {JSON.stringify(currentResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Visuals */}
          <div className="space-y-6">
             <div className="glass p-6 rounded-xl space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Targeted Area Crop
                </h3>
                <p className="text-xs text-muted-foreground">This crop is cited in the PR comment evidence log.</p>
                <div className="bg-background rounded-lg overflow-hidden border border-white/10 flex justify-center items-center min-h-[150px] p-4">
                  <img 
                    src={`/runs/${run.id}/${activeTab}/crop-primary-cta.png`} 
                    alt="CTA Crop Evidence" 
                    className="max-w-full rounded shadow-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
             </div>

             <div className="glass p-6 rounded-xl space-y-4">
                <h3 className="font-bold">Full Screen Render with BBox Insight</h3>
                <div className="relative bg-black rounded-lg overflow-hidden border border-white/10" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {/* We render the screenshot. Since its mobile or desktop, the natural width is 390/1440. 
                      Bounding boxes are relative to those coords. */}
                  <div className="relative mx-auto" style={{
                    width: activeTab === 'mobile' ? '390px' : '100%',
                    maxWidth: activeTab === 'mobile' ? '390px' : '1440px'
                  }}>
                    <img 
                      src={`/runs/${run.id}/${activeTab}/full.png`} 
                      alt="Full Context" 
                      className="w-full h-auto block"
                    />
                    
                    {/* Render bbox overlays from Gemini Response Evidence */}
                    {currentResult.evidence?.map((ev, i) => {
                      if (!ev.bbox || ev.bbox.length !== 4) return null;
                      const [x, y, w, h] = ev.bbox;
                      // To overlay precisely, we calculate %. 
                      // Wait, we can just use absolute pixels if the container is scaled with CSS transform, 
                      // or just % since width=390/1440.
                      const basewidth = activeTab === 'mobile' ? 390 : 1440;
                      return (
                         <div 
                          key={i}
                          className="absolute border-2 border-brand-500 bg-brand-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
                          style={{
                            left: `${(x / basewidth) * 100}%`,
                            top: y, // Using raw pixels for top since img scales proportionally or we use fixed width container
                            width: `${(w / basewidth) * 100}%`,
                            height: h,
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                            Gemini ROI: {ev.selector}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
      {!currentResult && !run.error && (
        <div className="glass p-12 text-center text-muted-foreground rounded-2xl">
          No data returned for this viewport.
        </div>
      )}
    </div>
  );
}
