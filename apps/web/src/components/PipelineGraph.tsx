import React, { useState } from 'react';
import { Cpu, ShieldCheck, FileText, ArrowRight, Check, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, Evidence, SSEEvent } from '../lib/types';

interface PipelineGraphProps {
  tasks: Task[];
  isProcessing: boolean;
  events: SSEEvent[];
  evidenceList: Evidence[];
  activeDocumentName?: string;
  onSelectEvidence?: (ev: Evidence) => void;
}

export const PipelineGraph: React.FC<PipelineGraphProps> = ({
  tasks,
  isProcessing,
  events,
  evidenceList,
  activeDocumentName,
  onSelectEvidence,
}) => {
  const [showInterAgentFeed, setShowInterAgentFeed] = useState(true);

  // Scoped active execution status
  const currentExecEvents = events.slice(-25);
  const activeFailedEvent = currentExecEvents.find((e) => e.event_type === 'execution_failed');
  const activeCompletedEvent = currentExecEvents.find((e) => e.event_type === 'execution_completed');

  let managerStatus = 'READY';
  if (activeFailedEvent) managerStatus = 'FAILED';
  else if (activeCompletedEvent && !isProcessing) managerStatus = 'COMPLETED';
  else if (isProcessing) {
    if (events.some((e) => e.event_type === 'manager_synthesizing')) managerStatus = 'SYNTHESIZING';
    else if (events.some((e) => e.event_type === 'manager_reviewing')) managerStatus = 'REVIEWING';
    else if (events.some((e) => e.event_type === 'task_created')) managerStatus = 'DECOMPOSING';
    else if (events.some((e) => e.event_type === 'manager_planning')) managerStatus = 'PLANNING';
    else managerStatus = 'RECEIVING TASK';
  }

  // Inter-agent communication messages
  const interAgentMessages = events.filter((e) =>
    ['agent_question', 'manager_clarification', 'agent_acknowledged'].includes(e.event_type)
  );

  // Organization Roles
  const roles = [
    { id: 'consultant', name: 'Consultant', title: 'Strategy' },
    { id: 'analyst', name: 'Analyst', title: 'Metrics' },
    { id: 'researcher', name: 'Researcher', title: 'Context' },
    { id: 'intern', name: 'Intern', title: 'Extraction' },
  ];

  const getRoleStatus = (roleId: string) => {
    const roleTask = tasks.find((t) => (t.worker || '').toLowerCase().includes(roleId) || (t.objective || '').toLowerCase().includes(roleId));
    if (activeFailedEvent && roleTask?.status !== 'COMPLETED') return 'FAILED';
    if (roleTask?.status === 'COMPLETED') return 'COMPLETED';
    if (roleTask?.status === 'RUNNING' || isProcessing) return 'WORKING';
    return 'READY';
  };

  return (
    <div className="w-full bg-[#111111] border-b border-[#555555] p-3 select-none text-[#FFFFFF] space-y-3 font-sans shrink-0">
      {/* Restrained Grayscale & Compact Privacy Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-[#333333] border border-[#555555] text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7FAF91]" />
          <span className="font-semibold text-[#FFFFFF] text-[11px]">LOCAL INFERENCE VERIFIED</span>
          <span className="text-[#555555]">|</span>
          <span className="text-[#999999] text-[11px]">Engine: <strong className="text-[#7FAF91] font-mono font-medium">Ollama (qwen2.5:0.5b)</strong></span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-[#777777] font-mono">
          <span className="text-[#7FAF91]">● External API: NONE ($0.00)</span>
          <span className="text-[#555555]">|</span>
          <span>Data leaves device: NO</span>
        </div>
      </div>

      {/* Compact Horizontal Pipeline Execution Graph */}
      <div className="p-3 rounded bg-[#333333] border border-[#555555]">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-2 border-b border-[#555555]/60 pb-1.5">
          <span className="flex items-center gap-1.5 text-[#999999] font-bold">
            <Cpu className="w-3.5 h-3.5 text-[#999999]" />
            AI Organization Execution Graph
          </span>
          <span>HTTP 202 + Redis SSE</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-thin text-xs">
          {/* Node 1: User Task */}
          <div className="flex flex-col items-center px-2 py-1 rounded border border-[#555555] bg-[#111111] shrink-0 text-center">
            <span className="text-[9.5px] font-mono text-[#777777]">STEP 1</span>
            <span className="text-[11px] font-bold text-[#FFFFFF]">User Task</span>
          </div>

          <ArrowRight className="w-3 h-3 text-[#555555] shrink-0" />

          {/* Node 2: Lead Manager */}
          <div className={`flex flex-col items-center px-2.5 py-1 rounded border text-center shrink-0 ${
            managerStatus === 'COMPLETED'
              ? 'border-[#5F8F72] bg-[rgba(95,143,114,0.08)] text-[#7FAF91]'
              : managerStatus === 'FAILED'
              ? 'border-[#8F6666] bg-[rgba(143,102,102,0.08)] text-[#A47A7A]'
              : isProcessing
              ? 'border-[#999999] bg-[#111111] text-[#FFFFFF]'
              : 'border-[#555555] bg-[#111111] text-[#777777]'
          }`}>
            <span className="text-[9.5px] font-mono opacity-80">LEAD MANAGER</span>
            <span className="text-[11px] font-bold">{managerStatus}</span>
          </div>

          <ArrowRight className="w-3 h-3 text-[#555555] shrink-0" />

          {/* Node 3: Parallel 4-Worker Grid */}
          <div className="flex items-center gap-1 bg-[#111111] p-1 rounded border border-[#555555] shrink-0">
            {roles.map((r) => {
              const st = getRoleStatus(r.id);
              return (
                <div
                  key={r.id}
                  className={`px-2 py-1 rounded border text-center text-[10px] flex flex-col items-center min-w-[70px] ${
                    st === 'COMPLETED'
                      ? 'border-[#5F8F72] text-[#7FAF91] bg-[rgba(95,143,114,0.08)]'
                      : st === 'FAILED'
                      ? 'border-[#8F6666] text-[#A47A7A] bg-[rgba(143,102,102,0.08)]'
                      : st === 'WORKING'
                      ? 'border-[#999999] text-[#FFFFFF] bg-[#333333]'
                      : 'border-[#555555] text-[#777777]'
                  }`}
                >
                  <span className="font-bold text-[10.5px]">{r.name}</span>
                  <span className="text-[8.5px] font-mono uppercase">{st}</span>
                </div>
              );
            })}
          </div>

          <ArrowRight className="w-3 h-3 text-[#555555] shrink-0" />

          {/* Node 4: Review & Synthesis */}
          <div className={`flex flex-col items-center px-2.5 py-1 rounded border text-center shrink-0 ${
            managerStatus === 'SYNTHESIZING' || managerStatus === 'REVIEWING'
              ? 'border-[#999999] text-[#FFFFFF] bg-[#111111]'
              : managerStatus === 'COMPLETED'
              ? 'border-[#5F8F72] text-[#7FAF91] bg-[rgba(95,143,114,0.08)]'
              : 'border-[#555555] text-[#777777] bg-[#111111]'
          }`}>
            <span className="text-[9.5px] font-mono opacity-80">SYNTHESIS</span>
            <span className="text-[11px] font-bold">{managerStatus === 'COMPLETED' ? 'DONE' : managerStatus === 'SYNTHESIZING' ? 'SYNTHESIZING' : 'WAITING'}</span>
          </div>

          <ArrowRight className="w-3 h-3 text-[#555555] shrink-0" />

          {/* Node 5: Final Report */}
          <div className={`flex flex-col items-center px-2.5 py-1 rounded border text-center shrink-0 ${
            managerStatus === 'COMPLETED'
              ? 'border-[#5F8F72] text-[#7FAF91] bg-[rgba(95,143,114,0.08)]'
              : 'border-[#555555] text-[#777777] bg-[#111111]'
          }`}>
            <span className="text-[9.5px] font-mono opacity-80">DELIVERABLE</span>
            <span className="text-[11px] font-bold">{managerStatus === 'COMPLETED' ? '✓ REPORT' : 'PENDING'}</span>
          </div>
        </div>
      </div>

      {/* Real Inter-Agent Communication Stream */}
      {interAgentMessages.length > 0 && (
        <div className="rounded bg-[#333333] border border-[#555555] p-2.5 space-y-2">
          <button
            onClick={() => setShowInterAgentFeed(!showInterAgentFeed)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[#999999] hover:text-[#FFFFFF] transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#999999]" />
              Agent-to-Manager Communication ({interAgentMessages.length})
            </span>
            {showInterAgentFeed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showInterAgentFeed && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 font-mono text-[10.5px]">
              {interAgentMessages.map((msg, idx) => (
                <div key={idx} className="p-1.5 rounded bg-[#111111] border border-[#555555] flex items-start gap-2">
                  <span className="text-[#999999] font-bold shrink-0">
                    {msg.payload?.agent_name || msg.payload?.sender || 'Agent'} → {msg.payload?.target || 'Manager'}:
                  </span>
                  <span className="text-[#FFFFFF]">
                    &quot;{msg.payload?.question || msg.payload?.response || msg.payload?.message}&quot;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Evidence Stream */}
      {evidenceList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pt-1">
          <span className="text-[10px] font-mono text-[#777777] shrink-0 uppercase">Evidence ({evidenceList.length}):</span>
          {evidenceList.slice(0, 4).map((ev, idx) => (
            <div
              key={ev.id || idx}
              onClick={() => onSelectEvidence && onSelectEvidence(ev)}
              className="shrink-0 p-1.5 px-2 rounded bg-[#333333] border border-[#555555] hover:border-[#5F8F72] cursor-pointer transition text-[10px] font-mono flex items-center gap-1.5 text-[#999999]"
            >
              <FileText className="w-3 h-3 text-[#777777]" />
              <span className="truncate max-w-[90px]">{ev.document_name || 'Doc'}</span>
              <span className="text-[#777777]">p.{ev.page_number || 1}</span>
              <span className="text-[#7FAF91] text-[9px]">✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
