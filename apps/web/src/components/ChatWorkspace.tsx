import React, { useState } from 'react';
import { Send, FileText, Sparkles, CheckCircle2, ShieldAlert, Cpu, Trash2 } from 'lucide-react';
import { Project, Message, Evidence } from '../lib/types';

interface ChatWorkspaceProps {
  activeProject: Project | null;
  messages: Message[];
  onSubmitObjective: (prompt: string) => void;
  isProcessing: boolean;
  onSelectEvidence: (ev: Evidence) => void;
  evidenceList: Evidence[];
  onOpenCreateProject: () => void;
  onClearWorkspace?: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  activeProject,
  messages,
  onSubmitObjective,
  isProcessing,
  onSelectEvidence,
  evidenceList,
  onOpenCreateProject,
  onClearWorkspace,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onSubmitObjective(prompt.trim());
      setPrompt('');
    }
  };

  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-base font-bold text-[#F1F5F9] mt-3 mb-1 border-b border-[#2D3945] pb-1">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-semibold text-[#F1F5F9] mt-2.5 mb-1">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-xs font-bold text-emerald-400 mt-2 mb-1">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-[#A3ACB3] list-disc my-0.5">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ')) {
        return (
          <div key={idx} className="ml-2 text-xs text-[#A3ACB3] my-1 font-medium">
            {trimmed}
          </div>
        );
      }
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      return <p key={idx} className="text-xs text-[#A3ACB3] leading-relaxed my-1">{line}</p>;
    });
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#11161B] p-8 text-center text-white select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mb-4 shadow-xl">
          <Cpu className="w-8 h-8 text-[#6366F1]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2 text-[#F1F5F9]">SuprAI — Autonomous AI Work Organization</h2>
        <p className="text-xs text-[#A3ACB3] max-w-md mb-6 leading-relaxed">
          Upload arbitrary real documents (PDF, DOCX, PPTX, CSV, XLSX, JSON) and give your local AI organization a real objective.
        </p>
        <button
          onClick={onOpenCreateProject}
          className="px-5 py-2.5 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-indigo-600 transition text-xs shadow-lg flex items-center gap-2"
        >
          <span>+ Create First Project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#11161B] text-white overflow-hidden">
      {/* Project Header Bar */}
      <div className="px-6 py-3 border-b border-[#2D3945] bg-[#1B242C] flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#F1F5F9]">{activeProject.name}</div>
          <div className="text-[10px] text-[#A3ACB3]">{activeProject.description || 'Active Workspace'}</div>
        </div>
        <div className="flex items-center gap-3">
          {onClearWorkspace && (
            <button
              onClick={onClearWorkspace}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2D3945]/40 hover:bg-rose-500/20 text-xs text-[#A3ACB3] hover:text-rose-400 border border-[#2D3945] transition"
              title="Clear Workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Workspace</span>
            </button>
          )}

          {isProcessing ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs text-[#6366F1]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span className="font-mono text-[11px]">Orchestrating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages / Deliverable Deliveries Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#A3ACB3]">
            <p className="text-xs mb-1 font-medium text-[#F1F5F9]">No execution deliverable yet.</p>
            <p className="text-[11px] max-w-sm">
              Type any analytical objective below (e.g. &quot;Summarize attached file&quot; or &quot;Identify core risks, evidence, &amp; implementation plan&quot;).
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] font-mono text-[#5A6A78] mb-1 capitalize">{m.role === 'assistant' ? 'Manager Synthesis Deliverable' : 'User Objective'}</div>
              <div
                className={`max-w-3xl p-5 rounded-xl text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-[#6366F1] text-white border-[#6366F1]'
                    : m.content.includes('Execution Failed')
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-[#1B242C] text-[#F1F5F9] border-[#2D3945] shadow-lg'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap font-medium">{m.content}</div>
                ) : (
                  renderFormattedMarkdown(m.content)
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-[#2D3945] bg-[#1B242C]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={isProcessing ? 'AI Organization executing task in real time...' : 'Enter your objective for the AI organization...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-[#11161B] border border-[#2D3945] rounded-lg text-xs text-[#F1F5F9] placeholder-[#5A6A78] focus:outline-none focus:border-[#6366F1] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="px-5 py-2.5 bg-[#6366F1] hover:bg-indigo-600 disabled:bg-[#2D3945] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:cursor-not-allowed"
          >
            <span>{isProcessing ? 'RUNNING' : 'Submit Objective'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
