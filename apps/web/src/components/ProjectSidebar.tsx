import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Folder, Users, FileText, Activity, Plus, FileCheck, X, Trash2, RefreshCw } from 'lucide-react';
import { Project, FileRecord } from '../lib/types';

interface ProjectSidebarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, description?: string) => void;
  onDeleteProject: (projectId: string) => void;
  onClearAll: () => void;
  onFileUpload: (file: File) => void;
  files: FileRecord[];
  isUploading: boolean;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClearAll,
  onFileUpload,
  files,
  isUploading,
  activeNav,
  setActiveNav,
  forceOpenModal = false,
  onCloseModal,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (forceOpenModal) {
      setShowModal(true);
    }
  }, [forceOpenModal]);

  const handleModalClose = () => {
    setShowModal(false);
    if (onCloseModal) onCloseModal();
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject(name.trim(), description.trim());
      setName('');
      setDescription('');
      handleModalClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'organization', label: 'AI Organization', icon: Users },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <aside className="w-60 border-r border-[#555555] bg-[#111111] flex flex-col h-[calc(100vh-3.5rem)] text-[#FFFFFF] select-none shrink-0 font-sans">
      {/* Navigation section */}
      <div className="p-4 space-y-1 border-b border-[#555555]">
        <div className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider mb-2">Workspace Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${
                isActive ? 'bg-[#333333] text-[#FFFFFF] border border-[#555555]' : 'text-[#777777] hover:bg-[#333333] hover:text-[#FFFFFF]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Projects section */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider">Projects ({projects.length})</span>
          <div className="flex items-center gap-1">
            {projects.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all projects?')) {
                    onClearAll();
                  }
                }}
                className="p-1 rounded text-[#A47A7A] hover:bg-[rgba(143,102,102,0.1)] transition cursor-pointer"
                title="Clear All Projects"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="p-1 rounded text-[#777777] hover:text-[#FFFFFF] hover:bg-[#333333] transition cursor-pointer"
              title="Create Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-[#777777] text-xs">
            <p className="mb-2 text-[11px]">No projects active.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded bg-[#999999] text-[#111111] font-bold hover:bg-[#FFFFFF] transition text-xs cursor-pointer"
            >
              + New Project
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {projects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between p-2.5 rounded text-xs transition border cursor-pointer ${
                    isSelected
                      ? 'bg-[#333333] border-[#555555] text-[#FFFFFF]'
                      : 'border-transparent text-[#777777] hover:bg-[#333333]/50 hover:text-[#FFFFFF]'
                  }`}
                  onClick={() => onSelectProject(p)}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="font-semibold truncate">{p.name}</div>
                    {p.description && <div className="text-[10px] text-[#777777] truncate mt-0.5">{p.description}</div>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    className="p-1 text-[#777777] hover:text-[#A47A7A] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Project Files */}
      {activeProject && (
        <div className="p-4 border-t border-[#555555] bg-[#333333]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#777777] uppercase tracking-wider">Project Documents</span>
          </div>

          <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-[#555555] rounded text-xs text-[#999999] hover:border-[#999999] hover:text-[#FFFFFF] cursor-pointer transition">
            <FileText className="w-3.5 h-3.5 text-[#777777]" />
            <span>{isUploading ? 'Uploading Document...' : '+ Attach Document'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.json,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-1.5 rounded bg-[#111111] text-[11px] text-[#999999] border border-[#555555]">
                <span className="truncate max-w-[120px] font-mono text-[10px]">{f.filename}</span>
                <span className="text-[9px] text-[#7FAF91] font-mono flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-[#7FAF91]" />
                  {f.page_count} pgs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Modal for Project Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#333333] border border-[#555555] rounded w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#555555] pb-3">
              <h3 className="text-sm font-bold text-[#FFFFFF]">Create New Project</h3>
              <button onClick={handleModalClose} className="text-[#777777] hover:text-[#FFFFFF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#555555] rounded text-xs text-[#FFFFFF] focus:outline-none focus:border-[#999999]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#555555] rounded text-xs text-[#FFFFFF] focus:outline-none focus:border-[#999999]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-3 py-1.5 rounded text-xs text-[#777777] hover:text-[#FFFFFF] border border-[#555555]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs bg-[#999999] text-[#111111] font-bold hover:bg-[#FFFFFF]"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
