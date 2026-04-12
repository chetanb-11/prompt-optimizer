import ChainBuilder from '../components/chain/ChainBuilder';
import { GitBranch } from 'lucide-react';

export default function ChainBuilderPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          Prompt Chain Builder
        </h1>
        <p className="text-sm text-text-muted mt-1 ml-[52px]">
          Build multi-step optimization pipelines
        </p>
      </div>

      <ChainBuilder />
    </div>
  );
}
