import React, { useState } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { SSEEvent } from '../lib/types';

interface LiveFeedProps {
  events: SSEEvent[];
  isConnected: boolean;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events, isConnected }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getEventTitle = (event: SSEEvent) => {
    switch (event.event_type) {
      case 'manager_started':
        return 'Task received by Lead Manager';
      case 'manager_planning':
        return 'Manager analyzing objective & document chunks';
      case 'task_created':
        return `Subtask created: ${event.payload?.objective || 'Agent Task'}`;
      case 'agent_assigned':
        return `Assigned ${event.payload?.agent_name || 'Agent'} to subtask`;
      case 'agent_started':
        return `${event.payload?.agent_name || 'Agent'} started processing`;
      case 'document_reading':
        return `${event.payload?.agent_name || 'Agent'} reading ${event.payload?.filename || 'document'} (Page ${event.payload?.page || 1})`;
      case 'evidence_created':
        return `Evidence verified from ${event.payload?.document_name || 'document'} (Page ${event.payload?.page || 1})`;
      case 'agent_completed':
        return `${event.payload?.agent_name || 'Agent'} task completed`;
      case 'manager_reviewing':
        return 'Manager reviewing worker findings';
      case 'manager_synthesizing':
        return 'Manager synthesizing final deliverable report';
      case 'execution_completed':
        return 'Execution completed successfully';
      case 'execution_failed':
        return `Execution failed: ${event.payload?.error || 'Error occurred'}`;
      default:
        return event.event_type.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div className="w-full bg-[#1B242C] border border-[#2D3945] rounded-xl overflow-hidden flex flex-col text-xs text-white">
      {/* Header */}
      <div className="px-4 py-3 bg-[#11161B] border-b border-[#2D3945] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6366F1]" />
          <h4 className="font-bold text-[#F1F5F9] tracking-wide">Real-Time Execution Timeline</h4>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1 text-[11px] text-[#A3ACB3] hover:text-white transition font-mono px-2 py-0.5 rounded bg-[#1B242C] border border-[#2D3945]"
          >
            <Terminal className="w-3 h-3 text-[#6366F1]" />
            {showTechnicalDetails ? 'Hide JSON Events' : 'Show JSON Events'}
            {showTechnicalDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        </div>
      </div>

      {/* Timeline List */}
      <div className="p-4 max-h-72 overflow-y-auto space-y-3 font-sans scrollbar-thin">
        {events.length === 0 ? (
          <div className="py-6 text-center text-[#5A6A78] flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 stroke-1 text-[#2D3945]" />
            <span>Awaiting execution stream events...</span>
          </div>
        ) : (
          events.map((ev, index) => {
            const isCompleted = ev.event_type === 'execution_completed' || ev.event_type === 'agent_completed';
            const isFailed = ev.event_type === 'execution_failed' || ev.event_type === 'agent_failed';

            return (
              <div key={index} className="flex items-start gap-3 text-[11px]">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-[#6366F1] bg-[#6366F1]/20 flex items-center justify-center text-[9px] text-[#6366F1] font-mono">
                      ●
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[#F1F5F9]">
                    <span className="font-semibold">{getEventTitle(ev)}</span>
                    <span className="text-[9.5px] font-mono text-[#5A6A78]">
                      {new Date((ev.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Technical JSON Payload Details */}
                  {showTechnicalDetails && (
                    <pre className="p-2 rounded bg-[#11161B] border border-[#2D3945] font-mono text-[9.5px] text-[#A3ACB3] overflow-x-auto">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
