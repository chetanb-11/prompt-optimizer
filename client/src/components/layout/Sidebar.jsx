import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, History, LayoutTemplate, GitBranch,
  FlaskConical, BarChart3, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Prompts',
    items: [
      { to: '/', icon: Zap, label: 'Optimize' },
      { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
      { to: '/history', icon: History, label: 'History' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/chain', icon: GitBranch, label: 'Chain Builder' },
      { to: '/testing', icon: FlaskConical, label: 'A/B Testing' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
];

export default function Sidebar({
  collapsed = false,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) {
  const location = useLocation();

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 flex flex-col border-r border-border bg-bg-secondary transition-all duration-300 ${
        mobileOpen ? 'translate-x-0 shadow-2xl w-[260px]' : '-translate-x-full'
      } lg:translate-x-0 ${collapsed ? 'lg:w-[68px]' : 'lg:w-[240px]'}`}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-xs">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold text-text tracking-tight">PromptForge</h1>
              <p className="text-[10px] text-text-muted font-medium tracking-wider uppercase">AI Optimizer</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map(({ label: group, items }) => (
          <div key={group} role="group" aria-label={group} className="space-y-1">
            {(!collapsed || mobileOpen) && (
              <p aria-hidden="true" className="px-3 text-xs font-medium text-text-muted">{group}</p>
            )}
            {items.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              const showLabel = !collapsed || mobileOpen;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={handleNavClick}
                  aria-label={showLabel ? undefined : label}
                  title={showLabel ? undefined : label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary-light'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                  {showLabel && <span className="truncate">{label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer — Collapse Toggle (desktop only) */}
      {setCollapsed && (
        <div className="border-t border-border flex-shrink-0 p-2 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-xs cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}

