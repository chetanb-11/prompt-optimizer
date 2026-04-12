import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePromptStore from '../../store/promptStore';
import { Code2, FileText, MonitorCog, Search, Briefcase, GraduationCap, PenTool, Database } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'Coding' },
  { id: 'writing', label: 'Writing' },
  { id: 'research', label: 'Research' },
  { id: 'system', label: 'System Design' },
  { id: 'business', label: 'Business' },
];

const TEMPLATES = [
  {
    id: 'code-review',
    category: 'coding',
    icon: Code2,
    title: 'Code Review Assistant',
    description: 'Review code for bugs, performance, and best practices',
    prompt: `Review my code and provide feedback on:
1. Potential bugs or errors
2. Performance improvements
3. Best practices and design patterns
4. Security vulnerabilities
5. Code readability and maintainability

Here's my code:
[paste your code here]`,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'api-design',
    category: 'coding',
    icon: Database,
    title: 'REST API Designer',
    description: 'Design RESTful API endpoints with schemas',
    prompt: `Design a RESTful API for [describe your application].

Include:
- Endpoint routes (GET, POST, PUT, DELETE)
- Request/response schemas (JSON)
- Authentication strategy
- Error handling patterns
- Pagination approach
- Rate limiting considerations`,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'resume',
    category: 'writing',
    icon: FileText,
    title: 'Resume Optimizer',
    description: 'Optimize resume bullet points for impact',
    prompt: `Rewrite my resume bullet points to be more impactful using the STAR method (Situation, Task, Action, Result).

Current bullet points:
[paste your bullet points here]

Target role: [job title]
Industry: [industry]

Each bullet should:
- Start with a strong action verb
- Include quantifiable results where possible
- Be concise (1-2 lines max)
- Highlight relevant skills for the target role`,
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'blog-writer',
    category: 'writing',
    icon: PenTool,
    title: 'Blog Post Writer',
    description: 'Generate structured blog post outlines',
    prompt: `Write a comprehensive blog post about [topic].

Requirements:
- Target audience: [who]
- Tone: [casual/professional/technical]
- Word count: approximately [number] words
- Include: introduction with hook, 3-5 main sections with subheadings, practical examples, conclusion with call-to-action
- SEO keywords to include: [keywords]
- Include relevant statistics or data points where appropriate`,
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'research-analysis',
    category: 'research',
    icon: Search,
    title: 'Research Analyzer',
    description: 'Analyze and summarize research papers',
    prompt: `Analyze the following research material and provide:

1. **Summary**: Key findings in 3-4 sentences
2. **Methodology**: How the research was conducted
3. **Key Data Points**: Important statistics and results
4. **Strengths**: What the research does well
5. **Limitations**: Gaps or weaknesses
6. **Implications**: Real-world applications
7. **Follow-up Questions**: 3-5 questions for further investigation

Material:
[paste research text here]`,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'system-architect',
    category: 'system',
    icon: MonitorCog,
    title: 'System Architecture',
    description: 'Design scalable system architectures',
    prompt: `Design a system architecture for [describe the system].

Requirements:
- Expected users: [number]
- Key features: [list features]
- Performance requirements: [latency, throughput]
- Budget constraints: [if any]

Please provide:
1. High-level architecture diagram (text-based)
2. Technology stack recommendations with justifications
3. Database design (SQL/NoSQL choice and schema outline)
4. API design overview
5. Caching strategy
6. Scalability plan (horizontal/vertical scaling)
7. Security considerations
8. Monitoring and observability approach`,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'business-analysis',
    category: 'business',
    icon: Briefcase,
    title: 'Business Case Builder',
    description: 'Build compelling business cases and proposals',
    prompt: `Create a business case document for [project/initiative].

Include the following sections:
1. Executive Summary
2. Problem Statement: What problem does this solve?
3. Proposed Solution: What are we building/doing?
4. Market Analysis: Size, trends, competition
5. Financial Analysis: Costs, revenue projections, ROI timeline
6. Risk Assessment: Top 5 risks with mitigation strategies
7. Implementation Timeline: Key milestones
8. Success Metrics: How we'll measure success
9. Recommendation: Go/no-go with supporting rationale

Context: [add relevant context]`,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'learning-plan',
    category: 'research',
    icon: GraduationCap,
    title: 'Learning Path Creator',
    description: 'Create structured learning plans for any topic',
    prompt: `Create a comprehensive learning path for [topic/skill].

My current level: [beginner/intermediate/advanced]
Available time: [hours per week]
Goal: [what I want to achieve]
Timeline: [desired completion time]

Include:
1. Prerequisites check
2. Phase-by-phase breakdown (beginner → intermediate → advanced)
3. Specific resources (books, courses, tutorials) for each phase
4. Practice projects/exercises at each stage
5. Assessment criteria to know when to move to next phase
6. Common pitfalls and how to avoid them`,
    color: 'from-teal-500 to-emerald-500',
  },
];

export default function TemplateGallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { loadPrompt } = usePromptStore();
  const navigate = useNavigate();

  const filtered = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUse = (template) => {
    loadPrompt(template.prompt);
    toast.success(`"${template.title}" template loaded`);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary/10 text-primary-light border border-primary/20'
                : 'bg-surface text-text-secondary border border-transparent hover:bg-surface-hover'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="glass-card p-5 group hover:glow-blue transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${t.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">{t.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{t.description}</p>
                </div>
              </div>

              <pre className="text-xs text-text-dim font-mono bg-surface rounded-lg p-3 mb-3 max-h-28 overflow-y-auto whitespace-pre-wrap border border-border leading-relaxed">
                {t.prompt.substring(0, 200)}...
              </pre>

              <button
                onClick={() => handleUse(t)}
                className="w-full py-2 rounded-xl text-xs font-medium bg-surface-hover text-text-secondary hover:bg-primary/10 hover:text-primary-light border border-border hover:border-primary/20 transition-all"
              >
                Use This Template
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
