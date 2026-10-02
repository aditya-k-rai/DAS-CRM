'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  showClearCache?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[DAS CRM ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleClearCacheAndReload = () => {
    try {
      // Clear all DAS CRM caches that might contain corrupt data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('das_crm_') ||
          key.startsWith('@das_crm_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Clear session storage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('das_crm_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}

    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Something went wrong';
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/90 backdrop-blur-sm p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                A component encountered an error while rendering. This is usually caused by stale cached data.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left">
              <p className="text-[11px] font-mono text-rose-300 break-all leading-relaxed">
                {errorMessage.length > 200 ? errorMessage.slice(0, 200) + '...' : errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw size={14} /> Reload Page
              </button>

              <div className="flex gap-2">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Home size={14} /> Go to Dashboard
                </button>

                {(this.props.showClearCache !== false) && (
                  <button
                    onClick={this.handleClearCacheAndReload}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 size={14} /> Clear Cache & Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
