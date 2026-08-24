import React, { useState } from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { SSEEvent } from '../lib/types';

interface LiveFeedProps {
  events: SSEEvent[];
  isConnected: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events, isConnected, isCollapsed = false, onToggleCollapse }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getEventTitle = (event: SSEEvent) => {
    switch (event.event_type) {
      case 'manager_started':
        return 'Task received from user';
      case 'manager_planning':
        return 'Manager analyzing objective';
      case 'task_created':
        return `${event.payload?.role ? event.payload.role.charAt(0).toUpperCase() + event.payload.role.slice(1) : 'Worker'} subtask created`;
      case 'agent_assigned':
        return `${event.payload?.agent_name || 'Worker'} assigned`;
      case 'agent_started':
        return `${event.payload?.agent_name || 'Worker'} started processing`;
      case 'agent_question':
        return `${event.payload?.agent_name || 'Worker'} asked clarification`;
      case 'manager_clarification':
        return `Manager provided clarification`;
      case 'agent_acknowledged':
        return `${event.payload?.agent_name || 'Worker'} acknowledged`;
      case 'document_reading':
        return `${event.payload?.agent_name || 'Worker'} extracting data`;
      case 'evidence_created':
        return `Evidence verified (Page ${event.payload?.page || 1})`;
      case 'agent_completed':
        return `${event.payload?.agent_name || 'Worker'} task completed`;
      case 'manager_reviewing':
        return 'Manager reviewing results';
      case 'manager_synthesizing':
        return 'Manager synthesizing report';
      case 'execution_completed':
        return 'Execution completed successfully';
      case 'execution_failed':
        return `Execution failed: ${event.payload?.error || 'Error occurred'}`;
      default:
        return event.event_type.replace(/_/g, ' ');
    }
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-14' : 'w-80'
      } border-l border-[#313A40] bg-[#171C20] flex flex-col h-[calc(100vh-3.5rem)] text-[#F3F4F6] select-none shrink-0 font-sans transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#313A40] flex items-center justify-between">
        {!isCollapsed ? (
          <>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3F4F6]">EXECUTION TIMELINE</h4>
              <p className="text-[10px] text-[#6B7780]">Real-time lifecycle stream</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-1 text-[10px] text-[#9DA8B0] hover:text-[#F3F4F6] transition font-mono px-2 py-0.5 rounded-xl bg-[#242B30] border border-[#313A40]"
              >
                <Zap className="w-3 h-3 text-[#9DA8B0]" />
                <span>JSON</span>
              </button>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 text-[#9DA8B0] hover:text-[#F3F4F6] transition rounded-lg hover:bg-[#242B30]"
                  title="Collapse Timeline"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1 text-[#9DA8B0] hover:text-[#F3F4F6] transition rounded-lg hover:bg-[#242B30]"
            title="Expand Timeline"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Timeline Stream */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
          {events.length === 0 ? (
            <div className="py-8 text-center text-[#6B7780] flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 stroke-1 text-[#313A40]" />
              <span className="text-xs">Awaiting execution lifecycle events...</span>
            </div>
          ) : (
            events.map((ev, index) => {
              const isCompleted = ev.event_type === 'execution_completed' || ev.event_type === 'agent_completed' || ev.event_type === 'evidence_created' || ev.event_type === 'agent_acknowledged';
              const isFailed = ev.event_type === 'execution_failed' || ev.event_type === 'agent_failed';

              const timeStr = ev.timestamp ? new Date(ev.timestamp * 1000).toLocaleTimeString() : '18:58:26';

              return (
                <div key={index} className="flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-[#6B7780] shrink-0">{timeStr}</span>
                    <span className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#7FAF91]" />
                      ) : isFailed ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#A47A7A]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full border border-[#6B7780] inline-block" />
                      )}
                    </span>
                    <span className={`truncate text-[11px] font-sans ${isCompleted ? 'text-[#7FAF91] font-semibold' : isFailed ? 'text-[#A47A7A] font-semibold' : 'text-[#F3F4F6]'}`}>
                      {getEventTitle(ev)}
                    </span>
                  </div>

                  {/* Technical JSON Details */}
                  {showTechnicalDetails && (
                    <pre className="p-2 rounded-xl bg-[#121619] border border-[#313A40] font-mono text-[9px] text-[#9DA8B0] overflow-x-auto w-full mt-1">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center p-2 gap-3 overflow-y-auto">
          <Activity className="w-4 h-4 text-[#9DA8B0] my-2" />
          {events.slice(-8).map((ev, index) => {
            const isCompleted = ev.event_type === 'execution_completed' || ev.event_type === 'agent_completed' || ev.event_type === 'evidence_created';
            const isFailed = ev.event_type === 'execution_failed' || ev.event_type === 'agent_failed';
            return (
              <span key={index} title={getEventTitle(ev)}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-[#7FAF91]" />
                ) : isFailed ? (
                  <AlertCircle className="w-4 h-4 text-[#A47A7A]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#6B7780] inline-block" />
                )}
              </span>
            );
          })}
        </div>
      )}
    </aside>
  );
};
