import Sidebar from './Sidebar';
import { useState, useEffect, useCallback } from 'react';
import { healthCheck } from '../../api/client';
import { Menu, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// ── Server Status Indicator ─────────────────────────────
// Automatically wakes the backend on page load and keeps it alive.
// Shows a subtle dot: 🟢 awake / 🟡 waking / 🔴 unreachable

const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // Re-ping every 4 min to prevent sleep

function ServerStatus({ compact = false }) {
  // 'idle' = haven't checked yet, 'waking' = pinging, 'online' = ok, 'offline' = failed
  const [status, setStatus] = useState('idle');

  const ping = useCallback(async () => {
    setStatus('waking');
    try {
      await healthCheck();
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    // Auto-ping on first load to wake the server
    ping();

    // Keep-alive: re-ping periodically so the server doesn't sleep during active sessions
    const interval = setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ping]);

  const dotColor = {
    idle: 'bg-zinc-500',
    waking: 'bg-amber-400',
    online: 'bg-emerald-400',
    offline: 'bg-rose-500',
  }[status];

  const ringColor = {
    idle: 'bg-zinc-500',
    waking: 'bg-amber-400',
    online: 'bg-emerald-400',
    offline: 'bg-rose-500',
  }[status];

  const label = {
    idle: 'Connecting',
    waking: 'Waking server...',
    online: 'Server online',
    offline: 'Server offline',
  }[status];

  return (
    <button
      onClick={ping}
      title={`${label} — click to refresh connection`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/70 hover:bg-surface border border-border/80 hover:border-border transition-all duration-200 backdrop-blur-md shadow-xs cursor-pointer select-none group ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {(status === 'online' || status === 'waking') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ringColor} opacity-50 duration-1000`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span className="font-medium text-text-muted group-hover:text-text-secondary tracking-tight transition-colors">
        {label}
      </span>
    </button>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-bg-secondary/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-xs">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-text tracking-tight">PromptForge</span>
          </div>
        </div>

        {/* Server status indicator in mobile top bar */}
        <ServerStatus compact />
      </header>

      {/* Desktop Top-Right Minimal Status Indicator */}
      <div className="hidden lg:flex fixed top-5 right-6 xl:right-8 z-30 pointer-events-auto animate-fade-in">
        <ServerStatus />
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content — offset by sidebar width on desktop, full width on mobile */}
      <main
        className={`min-h-screen transition-all duration-300 ml-0 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

