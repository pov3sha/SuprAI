import React from 'react';
import { FileText, Upload, Trash2, FileCheck, AlertCircle } from 'lucide-react';
import { FileRecord, Project } from '../../lib/types';

interface FilesViewProps {
  activeProject: Project | null;
  files: FileRecord[];
  isUploading: boolean;
  onFileUpload: (file: File) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  activeProject,
  files,
  isUploading,
  onFileUpload,
  onDeleteFile,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0B0F17] overflow-y-auto p-8 text-white select-none">
      <div className="flex items-center justify-between border-b border-[#263347] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Multi-Format Document Library
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Uploaded document datasets for RAG context extraction and Pandas analytics.
          </p>
        </div>

        {activeProject && (
          <label className="px-4 py-2 rounded-md bg-[#6366F1] text-white text-xs font-medium hover:bg-indigo-600 transition cursor-pointer flex items-center gap-2 shadow-lg">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Extracting File...' : '+ Upload Document'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.json,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {!activeProject ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#263347] rounded-xl p-12 text-center bg-[#141A26]/40">
          <AlertCircle className="w-8 h-8 text-[#94A3B8] mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No Active Project Selected</h3>
          <p className="text-xs text-[#94A3B8]">Select or create a project from the left sidebar to upload document datasets.</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#263347] rounded-xl p-12 text-center bg-[#141A26]/40 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">No Documents Uploaded</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm">
              Supports PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT, and Markdown files.
            </p>
          </div>
          <label className="px-4 py-2 rounded-md bg-[#6366F1] text-white text-xs font-medium hover:bg-indigo-600 transition cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.json,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="border border-[#263347] rounded-xl bg-[#141A26] overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0E131F] border-b border-[#263347] text-[#94A3B8] text-[10px] uppercase font-mono tracking-wider">
              <tr>
                <th className="p-3.5">Filename</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Chunks / Pages</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263347]/60">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-[#1B2433]/40 transition">
                  <td className="p-3.5 font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6366F1]" />
                    <span className="font-mono text-xs">{f.filename}</span>
                  </td>
                  <td className="p-3.5 font-mono text-[#94A3B8]">
                    {f.size_bytes ? `${(f.size_bytes / 1024).toFixed(1)} KB` : 'N/A'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {f.page_count || 1}
                  </td>
                  <td className="p-3.5 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] flex items-center gap-1 w-max">
                      <FileCheck className="w-3 h-3" /> Indexed
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDeleteFile(f.id)}
                      className="p-1.5 rounded text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
