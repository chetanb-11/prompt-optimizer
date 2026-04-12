import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, History, LayoutTemplate, GitBranch,
  FlaskConical, BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: Zap, label: 'Optimizer' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/chain', icon: GitBranch, label: 'Chain Builder' },
  { to: '/testing', icon: FlaskConical, label: 'A/B Testing' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-border bg-bg-secondary transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-text tracking-tight">PromptForge</h1>
            <p className="text-[10px] text-text-muted font-medium tracking-wider uppercase">AI Optimizer</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary-light'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text-secondary'
                }`}
              />
              {!collapsed && <span className="animate-fade-in truncate">{label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-scale-in" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-hover transition-colors text-xs"
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
    </aside>
  );
}
