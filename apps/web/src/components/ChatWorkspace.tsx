import React, { useState } from 'react';
import { Send, FileText, Sparkles, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { Project, Message, Evidence } from '../lib/types';

interface ChatWorkspaceProps {
  activeProject: Project | null;
  messages: Message[];
  onSubmitObjective: (prompt: string) => void;
  isProcessing: boolean;
  onSelectEvidence: (ev: Evidence) => void;
  evidenceList: Evidence[];
  onOpenCreateProject: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  activeProject,
  messages,
  onSubmitObjective,
  isProcessing,
  onSelectEvidence,
  evidenceList,
  onOpenCreateProject,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onSubmitObjective(prompt.trim());
      setPrompt('');
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F17] p-8 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mb-4 shadow-xl">
          <Cpu className="w-8 h-8 text-[#6366F1]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">SuprAI — Autonomous AI Work Organization</h2>
        <p className="text-xs text-[#94A3B8] max-w-md mb-6 leading-relaxed">
          Upload arbitrary real documents (PDF, DOCX, PPTX, CSV, XLSX, JSON) and give your AI organization a real objective.
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
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0B0F17] text-white overflow-hidden">
      {/* Project Header Bar */}
      <div className="px-6 py-3 border-b border-[#263347] bg-[#141A26]/50 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white">{activeProject.name}</div>
          <div className="text-[10px] text-[#94A3B8]">{activeProject.description || 'Active Workspace'}</div>
        </div>
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#94A3B8]">
            <p className="text-xs mb-1 font-medium text-slate-300">No execution history yet.</p>
            <p className="text-[11px] max-w-sm">
              Type any objective below (e.g. &quot;Summarize attached file&quot; or &quot;Identify operational risks &amp; implementation plan&quot;).
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] font-mono text-[#94A3B8] mb-1 capitalize">{m.role}</div>
              <div
                className={`max-w-2xl p-4 rounded-xl text-xs leading-relaxed border whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#6366F1] text-white border-[#6366F1]'
                    : m.content.includes('Execution Failed')
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-[#141A26] text-slate-200 border-[#263347] shadow-lg'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-[#263347] bg-[#141A26]/80">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={isProcessing ? 'AI Organization working...' : 'Enter your objective for the AI organization...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-[#0B0F17] border border-[#263347] rounded-lg text-xs text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="px-5 py-2.5 bg-[#6366F1] hover:bg-indigo-600 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:cursor-not-allowed"
          >
            <span>{isProcessing ? 'RUNNING' : 'Submit Objective'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
