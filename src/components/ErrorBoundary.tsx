import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#111111] border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {errorDetails 
                ? `A database error occurred during a ${errorDetails.operationType} operation. Our team has been notified.`
                : "An unexpected error occurred. Please try refreshing the page or going back home."}
            </p>

            {errorDetails && (
              <div className="mb-8 p-4 bg-black/50 rounded-2xl border border-white/5 text-left">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Error Details</p>
                <p className="text-sm font-mono text-red-400 break-all">{errorDetails.error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
