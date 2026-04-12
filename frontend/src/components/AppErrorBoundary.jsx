import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Errore imprevisto' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo);

    // Auto-reload on chunk load failure (common after a new deployment)
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last-chunk-error-reload');
      const now = Date.now();

      // Only auto-reload if we haven't reloaded in the last 10 seconds to avoid loops
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('last-chunk-error-reload', now.toString());
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-3xl leading-none">!</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Si è verificato un errore</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md break-words">
            {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
          >
            Ricarica
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

