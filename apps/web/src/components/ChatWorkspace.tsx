import React, { useState } from 'react';
import { Send, FileText, Sparkles, CheckCircle2, Cpu, Trash2 } from 'lucide-react';
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
        return <h1 key={idx} className="text-base font-bold text-[#FFFFFF] mt-4 mb-2 border-b border-[#555555] pb-1">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-semibold text-[#FFFFFF] mt-3 mb-1.5">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-xs font-bold text-[#7FAF91] mt-2.5 mb-1">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-[#999999] list-disc my-1">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ')) {
        return (
          <div key={idx} className="ml-2 text-xs text-[#999999] my-1 font-medium">
            {trimmed}
          </div>
        );
      }
      if (!trimmed) return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-[#999999] leading-relaxed my-1.5">{line}</p>;
    });
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#111111] p-8 text-center text-[#FFFFFF] select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#333333] border border-[#555555] flex items-center justify-center mb-4 shadow-xl">
          <Cpu className="w-8 h-8 text-[#999999]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2 text-[#FFFFFF]">SuprAI — Autonomous AI Work Organization</h2>
        <p className="text-xs text-[#777777] max-w-md mb-6 leading-relaxed">
          Upload real documents (PDF, DOCX, PPTX, CSV, XLSX, JSON) and submit your objective to the local AI organization.
        </p>
        <button
          onClick={onOpenCreateProject}
          className="px-5 py-2.5 rounded bg-[#999999] text-[#111111] font-bold hover:bg-[#FFFFFF] transition text-xs cursor-pointer"
        >
          + Create First Project
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#111111] text-[#FFFFFF] overflow-hidden">
      {/* Project Header Bar */}
      <div className="px-6 py-2.5 border-b border-[#555555] bg-[#333333] flex items-center justify-between shrink-0">
        <div>
          <div className="text-xs font-bold text-[#FFFFFF]">{activeProject.name}</div>
          <div className="text-[10px] text-[#777777]">{activeProject.description || 'Active Workspace'}</div>
        </div>
        <div className="flex items-center gap-3">
          {onClearWorkspace && (
            <button
              onClick={onClearWorkspace}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#111111] hover:bg-[rgba(143,102,102,0.1)] text-xs text-[#777777] hover:text-[#A47A7A] border border-[#555555] transition cursor-pointer"
              title="Clear Workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Workspace</span>
            </button>
          )}

          {isProcessing ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#111111] border border-[#555555] text-xs text-[#999999]">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#999999]" />
              <span className="font-mono text-[11px]">Executing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#7FAF91] text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7FAF91]" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages / Deliverable Deliveries Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#777777]">
            <p className="text-xs mb-1 font-semibold text-[#FFFFFF]">Workspace Ready</p>
            <p className="text-[11px] max-w-sm text-[#777777]">
              Type your analytical prompt below (e.g. &quot;Summarize attached file&quot; or &quot;Identify key technical insights, risks, &amp; implementation plan&quot;).
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] font-mono text-[#777777] mb-1 capitalize">
                {m.role === 'assistant' ? 'Manager AI Final Report' : 'User Objective'}
              </div>
              <div
                className={`max-w-3xl p-5 rounded text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-[#333333] text-[#FFFFFF] border-[#555555]'
                    : m.content.includes('Execution Failed')
                    ? 'bg-[rgba(143,102,102,0.08)] text-[#A47A7A] border-[#8F6666]'
                    : 'bg-[#333333] text-[#FFFFFF] border-[#555555]'
                }`}
              >
                {m.role === 'user' ? (
                  <div className="whitespace-pre-wrap font-medium text-[#FFFFFF]">{m.content}</div>
                ) : (
                  renderFormattedMarkdown(m.content)
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-[#555555] bg-[#333333] shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={isProcessing ? 'AI Organization executing task...' : 'Enter your objective for the AI organization...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#555555] rounded text-xs text-[#FFFFFF] placeholder-[#777777] focus:outline-none focus:border-[#999999] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="px-5 py-2.5 bg-[#999999] hover:bg-[#FFFFFF] disabled:bg-[#555555] text-[#111111] rounded text-xs font-bold flex items-center gap-2 transition disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isProcessing ? 'RUNNING' : 'Submit Objective'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
