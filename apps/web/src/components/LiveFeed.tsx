import React from 'react';
import { Terminal } from 'lucide-react';
import { SSEEvent } from '../lib/types';

interface LiveFeedProps {
  events: SSEEvent[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#141A26] text-white">
      <div className="p-4 border-b border-[#263347] flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>Real-Time Execution Logs</span>
        </h3>
        <span className="text-[10px] text-[#94A3B8] font-mono">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
        {events.length === 0 ? (
          <div className="text-center text-[#94A3B8] py-8 italic text-[11px]">
            No activity log yet. Submit an objective to view execution events.
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="p-2 rounded bg-[#0B0F17] border border-[#263347] text-slate-300">
              <div className="flex items-center justify-between text-[9px] text-[#94A3B8] mb-1">
                <span className="text-[#6366F1] font-semibold uppercase">{ev.event_type}</span>
                <span>{new Date(ev.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300 truncate">
                {ev.payload?.objective || ev.payload?.agent_name || ev.payload?.claim || JSON.stringify(ev.payload)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
