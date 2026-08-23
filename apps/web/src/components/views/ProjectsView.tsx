import React from 'react';
import { FolderPlus, Trash2, Calendar, FileText, CheckCircle } from 'lucide-react';
import { Project } from '../../lib/types';

interface ProjectsViewProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProjectClick: () => void;
  onDeleteProject: (projectId: string) => void;
  onClearAll: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProjectClick,
  onDeleteProject,
  onClearAll,
}) => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0B0F17] overflow-y-auto p-8 text-white select-none">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-[#263347] pb-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Projects Workspace
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Manage your autonomous AI work organization projects and file datasets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all projects?')) {
                  onClearAll();
                }
              }}
              className="px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Projects
            </button>
          )}

          <button
            onClick={onCreateProjectClick}
            className="px-4 py-2 rounded-md bg-[#6366F1] text-white text-xs font-medium hover:bg-indigo-600 transition cursor-pointer flex items-center gap-1.5 shadow-lg"
          >
            <FolderPlus className="w-4 h-4" />
            + New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#263347] rounded-xl p-12 text-center bg-[#141A26]/40">
          <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1] mb-4">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Projects Found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mb-6">
            Your workspace is 100% clean. Create your first project to start executing objectives with your AI team.
          </p>
          <button
            onClick={onCreateProjectClick}
            className="px-5 py-2.5 rounded-lg bg-[#6366F1] text-white font-medium text-xs hover:bg-indigo-600 transition"
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isSelected = activeProject?.id === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#141A26] border-[#6366F1] shadow-lg shadow-[#6366F1]/10'
                    : 'bg-[#141A26]/60 border-[#263347] hover:border-[#6366F1]/50 hover:bg-[#141A26]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id);
                      }}
                      className="p-1 rounded text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#94A3B8] mb-4 line-clamp-2">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#263347]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
                    {proj.file_count || 0} Documents
                  </span>

                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3 h-3 text-[#94A3B8]" />
                    {proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
