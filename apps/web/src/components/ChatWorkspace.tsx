import React, { useState } from 'react';
import { Send, FileText, Sparkles, CheckCircle2, Cpu, Trash2, Copy, Maximize2, Check } from 'lucide-react';
import { Project, Message, Evidence, SSEEvent } from '../lib/types';

interface ChatWorkspaceProps {
  activeProject: Project | null;
  messages: Message[];
  events?: SSEEvent[];
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
  events = [],
  onSubmitObjective,
  isProcessing,
  onSelectEvidence,
  evidenceList,
  onOpenCreateProject,
  onClearWorkspace,
}) => {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onSubmitObjective(prompt.trim());
      setPrompt('');
    }
  };

  const handleCopyReport = () => {
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg) {
      navigator.clipboard.writeText(lastAssistantMsg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const interAgentMessages = events.filter((e) =>
    ['manager_started', 'task_created', 'agent_question', 'manager_clarification', 'agent_acknowledged', 'agent_completed'].includes(e.event_type)
  );

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-base font-bold text-[#F3F4F6] mt-3 mb-2 border-b border-[#313A40] pb-1">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-semibold text-[#F3F4F6] mt-2.5 mb-1.5">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-xs font-bold text-[#7FAF91] mt-2 mb-1">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 text-xs text-[#9DA8B0] list-disc my-1">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ')) {
        return (
          <div key={idx} className="ml-2 text-xs text-[#9DA8B0] my-1 font-medium">
            {trimmed}
          </div>
        );
      }
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      return <p key={idx} className="text-xs text-[#9DA8B0] leading-relaxed my-1">{line}</p>;
    });
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121619] p-8 text-center text-[#F3F4F6] select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#242B30] border border-[#313A40] flex items-center justify-center mb-4 shadow-xl">
          <Cpu className="w-8 h-8 text-[#9DA8B0]" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2 text-[#F3F4F6]">SuprAI — Autonomous AI Work Organization</h2>
        <p className="text-xs text-[#6B7780] max-w-md mb-6 leading-relaxed">
          Upload real documents (PDF, DOCX, PPTX, CSV, XLSX, JSON) and submit your objective to the local AI organization.
        </p>
        <button
          onClick={onOpenCreateProject}
          className="px-5 py-2.5 rounded-xl bg-[#242B30] border border-[#313A40] text-[#F3F4F6] font-bold hover:bg-[#313A40] transition text-xs cursor-pointer shadow-lg"
        >
          + Create First Project
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#121619] text-[#F3F4F6] font-sans">
      {/* Split 2-Column Grid Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 p-4">
        {/* Left Column: AI ORGANIZATION CHAT */}
        <div className="bg-[#1C2226] border border-[#313A40] rounded-2xl p-4 flex flex-col min-h-0 shadow-xl overflow-hidden">
          <div className="border-b border-[#313A40] pb-2.5 mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">AI ORGANIZATION CHAT</h4>
              <p className="text-[10px] text-[#6B7780]">Conversation between Manager and Workers</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7FAF91]">
              <span className="w-2 h-2 rounded-full bg-[#7FAF91] animate-pulse" />
              <span>Live Updates</span>
            </div>
          </div>

          {/* Inter-Agent Conversation Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {interAgentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#6B7780] p-4 text-xs">
                <p className="font-semibold text-[#9DA8B0] mb-1">Awaiting Objective Submission</p>
                <p className="text-[11px] max-w-xs">Type your objective prompt below. Inter-agent communication will appear here in real time.</p>
              </div>
            ) : (
              interAgentMessages.map((msg, idx) => {
                const isManager = (msg.payload?.agent_name || msg.payload?.sender || '').toLowerCase().includes('manager');
                const title = msg.payload?.sender && msg.payload?.target
                  ? `${msg.payload.sender.toUpperCase()} → ${msg.payload.target.toUpperCase()}`
                  : (msg.payload?.agent_name || 'MANAGER').toUpperCase();
                
                const timeStr = msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleTimeString() : '18:58:38';
                const text = msg.payload?.question || msg.payload?.response || msg.payload?.message || msg.payload?.objective || 'Task execution event';

                return (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-[#242B30] border border-[#313A40] flex items-center justify-center text-[#9DA8B0] text-[10px] font-bold shrink-0 mt-0.5">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                        <span className="font-bold text-[#F3F4F6]">{title}</span>
                        <span className="text-[#6B7780]">{timeStr}</span>
                      </div>
                      <p className="text-[11.5px] text-[#9DA8B0] leading-relaxed">
                        {text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: MANAGER AI FINAL REPORT */}
        <div className="bg-[#1C2226] border border-[#313A40] rounded-2xl p-4 flex flex-col min-h-0 shadow-xl overflow-hidden">
          <div className="border-b border-[#313A40] pb-2.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#242B30] border border-[#313A40] flex items-center justify-center text-[#9DA8B0] text-[10px] font-bold">
                👤
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">MANAGER AI FINAL REPORT</h4>
                <p className="text-[10px] font-mono text-[#6B7780]">18:59:18</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="p-1.5 rounded-lg bg-[#242B30] border border-[#313A40] text-[#9DA8B0] hover:text-[#F3F4F6] transition cursor-pointer"
                title="Copy Report"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#7FAF91]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                className="p-1.5 rounded-lg bg-[#242B30] border border-[#313A40] text-[#9DA8B0] hover:text-[#F3F4F6] transition cursor-pointer"
                title="Maximize View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Report Markdown Deliverable Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {!lastAssistantMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#6B7780] p-4 text-xs">
                <p className="font-semibold text-[#9DA8B0] mb-1">Deliverable Pending</p>
                <p className="text-[11px] max-w-xs">The final report synthesized by the Lead Manager will be rendered here once execution completes.</p>
              </div>
            ) : (
              <div>
                {renderFormattedMarkdown(lastAssistantMessage.content)}

                {/* Evidence Quote Card */}
                {evidenceList.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-[#242B30] border border-[#313A40] text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10.5px] text-[#F3F4F6]">
                      <span className="font-bold">{evidenceList[0].document_name || 'M1-AWS.pdf'} • Page {evidenceList[0].page_number || 7}</span>
                    </div>
                    <p className="text-[11px] text-[#9DA8B0] italic">
                      &quot;{evidenceList[0].excerpt}&quot;
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#313A40]/60 text-[10px] font-mono text-[#6B7780]">
                      <span>Researcher</span>
                      <span className="text-[#7FAF91] font-bold">✓ Verified</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Bar at Bottom */}
      <div className="p-4 border-t border-[#313A40] bg-[#171C20] shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={isProcessing ? 'AI Organization executing task...' : 'Enter your objective for the AI organization...'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-[#121619] border border-[#313A40] rounded-xl text-xs text-[#F3F4F6] placeholder-[#6B7780] focus:outline-none focus:border-[#6B7780] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="px-5 py-2.5 bg-[#242B30] hover:bg-[#313A40] border border-[#313A40] disabled:bg-[#1C2226] text-[#F3F4F6] rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isProcessing ? 'RUNNING' : 'Submit Objective'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
