import React from 'react';
import { Activity, Clock, ShieldCheck } from 'lucide-react';
import { ExecutionEvent } from '../../lib/types';

interface ActivityViewProps {
  events: ExecutionEvent[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ events }) => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0B0F17] overflow-y-auto p-8 text-white select-none">
      <div className="flex items-center justify-between border-b border-[#263347] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Execution Activity & Event Stream
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time backend execution events, state machine transitions, and evidence verification logs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-md bg-[#141A26] border border-[#263347] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live SSE Observability Stream
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#263347] rounded-xl p-12 text-center bg-[#141A26]/40">
          <Activity className="w-8 h-8 text-[#94A3B8] mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No Activity Logs Captured Yet</h3>
          <p className="text-xs text-[#94A3B8]">Submit an objective in the dashboard to view real-time state transitions and model execution logs.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {events.map((ev, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-[#263347] bg-[#141A26] flex items-start justify-between gap-4 font-mono text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#0B0F17] border border-[#263347] text-[#6366F1] mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white uppercase tracking-wide text-[11px] px-2 py-0.5 rounded bg-[#1B2433] border border-[#263347]">
                      {ev.event_type}
                    </span>
                    {ev.payload?.execution_id && (
                      <span className="text-[10px] text-[#94A3B8]">
                        ID: {ev.payload.execution_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs mt-1">
                    {ev.payload?.reason || ev.payload?.objective || ev.payload?.error || JSON.dumps(ev.payload)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] shrink-0">
                <Clock className="w-3 h-3" />
                {ev.timestamp ? new Date(ev.timestamp * 1000).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
