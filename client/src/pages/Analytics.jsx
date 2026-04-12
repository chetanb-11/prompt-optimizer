import Dashboard from '../components/analytics/Dashboard';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          Analytics Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1 ml-[52px]">
          Track your prompt optimization activity and scores
        </p>
      </div>

      <Dashboard />
    </div>
  );
}
