import React from 'react';

/**
 * Tactical Error Boundary Component
 * Catches unhandled runtime / lifecycle exceptions in children components
 * and displays an army-themed recovery banner rather than crashing to a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="p-6 rounded-2xl bg-[#1E2410] border border-[#5A6834] text-center space-y-4 my-4 max-w-lg mx-auto shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#2A3316] border border-[#7D8F42] flex items-center justify-center text-[#A4B566]">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>

          <div className="space-y-1">
            <h3 className="font-headline-sm text-base font-bold text-[#F0F3E8]">
              {this.props.title || 'Component Error Detected'}
            </h3>
            <p className="text-xs text-[#CCD6B8] max-w-sm mx-auto leading-relaxed">
              {this.state.error?.message ||
                'An unexpected error occurred while loading this module.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="h-9 px-4 rounded-xl bg-[#8B9B4C] hover:bg-[#9EAF6D] text-[#1F240F] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-9 px-4 rounded-xl bg-[#2D3618] hover:bg-[#3B4720] text-[#CCD6B8] border border-[#525E31] font-mono text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
