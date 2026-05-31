import Sidebar from './Sidebar';
import { useState } from 'react';
import { healthCheck } from '../../api/client';

const DeveloperPing = () => {
  const [status, setStatus] = useState('idle');

  const handlePing = async () => {
    setStatus('loading');
    try {
      await healthCheck();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed top-2 right-2 z-50">
      <button 
        onClick={handlePing}
        className="text-[10px] bg-surface text-text-muted hover:text-text px-2 py-1 rounded flex items-center gap-1 border border-border transition-colors shadow-sm"
        title="Ping Backend"
      >
        <span>Ping</span>
        {status === 'loading' && <span className="inline-block h-2 w-2 border border-current border-t-transparent rounded-full animate-spin"></span>}
        {status === 'success' && <span className="text-success font-bold">✓</span>}
        {status === 'error' && <span className="text-error font-bold">✗</span>}
      </button>
    </div>
  );
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-bg relative">
      <Sidebar />
      <DeveloperPing />
      {/* Main Content — offset by sidebar width, uses CSS to handle collapse */}
      <main className="ml-[68px] lg:ml-[240px] min-h-screen transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
