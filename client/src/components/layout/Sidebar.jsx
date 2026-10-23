import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, History, LayoutTemplate, GitBranch,
  FlaskConical, BarChart3, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Zap, label: 'Optimizer' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/chain', icon: GitBranch, label: 'Chain Builder' },
  { to: '/testing', icon: FlaskConical, label: 'A/B Testing' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({
  statusIndicator,
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

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const showLabel = !collapsed || mobileOpen;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary-light font-semibold'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover'
              }`}
              title={collapsed && !mobileOpen ? label : undefined}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary'
                }`}
              />
              {showLabel && <span className="animate-fade-in truncate">{label}</span>}
              {isActive && showLabel && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-scale-in" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — Server Status + Collapse Toggle */}
      <div className="border-t border-border flex-shrink-0">
        {/* Server Status Indicator */}
        {statusIndicator && (
          <div className={`overflow-hidden ${collapsed && !mobileOpen ? 'flex justify-center py-2' : ''}`}>
            {statusIndicator}
          </div>
        )}

        {/* Collapse Toggle — desktop only */}
        {setCollapsed && (
          <div className="p-2 hidden lg:block">
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
      </div>
    </aside>
  );
}

