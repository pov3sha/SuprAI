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
      case 'agent_question':
        return `${event.payload?.agent_name || 'Agent'} → Manager: "${event.payload?.question || 'Clarification request'}"`;
      case 'manager_clarification':
        return `Manager → ${event.payload?.target || 'Agent'}: "${event.payload?.response || 'Strategic guidance'}"`;
      case 'agent_acknowledged':
        return `${event.payload?.agent_name || 'Agent'}: Clarification received`;
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
    <div className="w-full bg-[#333333] border border-[#555555] rounded overflow-hidden flex flex-col text-xs text-[#FFFFFF] font-sans">
      {/* Header */}
      <div className="px-3 py-2 bg-[#111111] border-b border-[#555555] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#999999]" />
          <h4 className="font-bold text-[#FFFFFF] tracking-wide text-xs">Execution Lifecycle Stream</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1 text-[10px] text-[#999999] hover:text-[#FFFFFF] transition font-mono px-2 py-0.5 rounded bg-[#333333] border border-[#555555]"
          >
            <Terminal className="w-3 h-3 text-[#999999]" />
            {showTechnicalDetails ? 'Hide JSON' : 'JSON'}
            {showTechnicalDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#7FAF91]' : 'bg-[#A47A7A]'}`} />
        </div>
      </div>

      {/* Timeline List */}
      <div className="p-3 max-h-[calc(100vh-10rem)] overflow-y-auto space-y-2.5 scrollbar-thin">
        {events.length === 0 ? (
          <div className="py-6 text-center text-[#777777] flex flex-col items-center gap-2">
            <Clock className="w-5 h-5 stroke-1 text-[#555555]" />
            <span className="text-[11px]">Awaiting execution lifecycle events...</span>
          </div>
        ) : (
          events.map((ev, index) => {
            const isCompleted = ev.event_type === 'execution_completed' || ev.event_type === 'agent_completed';
            const isFailed = ev.event_type === 'execution_failed' || ev.event_type === 'agent_failed';

            return (
              <div key={index} className="flex items-start gap-2 text-[11px]">
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#7FAF91]" />
                  ) : isFailed ? (
                    <AlertCircle className="w-3.5 h-3.5 text-[#A47A7A]" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-[#999999] bg-[#111111] flex items-center justify-center text-[8px] text-[#999999] font-mono">
                      ●
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[#FFFFFF]">
                    <span className="font-semibold text-[11px] leading-tight">{getEventTitle(ev)}</span>
                    <span className="text-[9px] font-mono text-[#777777] shrink-0 ml-1">
                      {new Date((ev.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Technical JSON Details */}
                  {showTechnicalDetails && (
                    <pre className="p-2 rounded bg-[#111111] border border-[#555555] font-mono text-[9px] text-[#999999] overflow-x-auto">
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
