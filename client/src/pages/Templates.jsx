import TemplateGallery from '../components/templates/TemplateGallery';
import { LayoutTemplate } from 'lucide-react';

export default function Templates() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          Prompt Templates
        </h1>
        <p className="text-sm text-text-muted mt-1 ml-[52px]">
          Pre-built templates for common use cases
        </p>
      </div>

      <TemplateGallery />
    </div>
  );
}
