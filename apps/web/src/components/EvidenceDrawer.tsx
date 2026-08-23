import React from 'react';
import { ShieldCheck, ShieldAlert, X, FileText } from 'lucide-react';
import { Evidence } from '../lib/types';

interface EvidenceDrawerProps {
  evidence: Evidence | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  const isSupported = evidence.verification_status === 'SUPPORTED';

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#141A26] border-l border-[#263347] shadow-2xl z-50 p-6 flex flex-col space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-[#263347] pb-4">
        <div className="flex items-center gap-2">
          {isSupported ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          )}
          <h3 className="text-sm font-semibold text-white">Evidence Inspector</h3>
        </div>
        <button onClick={onClose} className="text-[#94A3B8] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-[#94A3B8] uppercase font-semibold text-[10px] tracking-wider">Claim</span>
          <p className="text-white mt-1 p-2.5 rounded-lg bg-[#0B0F17] border border-[#263347]">{evidence.claim}</p>
        </div>

        <div>
          <span className="text-[#94A3B8] uppercase font-semibold text-[10px] tracking-wider">Verification Status</span>
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-1 rounded text-[10px] font-semibold uppercase ${
                isSupported ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {evidence.verification_status}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[#94A3B8] uppercase font-semibold text-[10px] tracking-wider">Source Document & Page</span>
          <div className="flex items-center gap-2 mt-1 p-2 rounded bg-[#0B0F17] border border-[#263347] text-slate-300">
            <FileText className="w-4 h-4 text-[#6366F1]" />
            <span>{evidence.document_name || 'Document.pdf'}</span>
            <span className="ml-auto font-mono text-[10px] text-[#6366F1]">Page {evidence.page_number || 1}</span>
          </div>
        </div>

        <div>
          <span className="text-[#94A3B8] uppercase font-semibold text-[10px] tracking-wider">Verbatim Page Excerpt</span>
          <p className="text-slate-300 mt-1 p-3 rounded-lg bg-[#0B0F17] border border-[#263347] italic leading-relaxed text-[11px]">
            "{evidence.excerpt}"
          </p>
        </div>
      </div>
    </div>
  );
};
