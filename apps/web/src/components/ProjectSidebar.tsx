import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Folder, Users, FileText, Activity, Plus, FileCheck, X, Trash2, RefreshCw, ChevronLeft } from 'lucide-react';
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
    <aside className="w-64 border-r border-[#313A40] bg-[#171C20] flex flex-col h-[calc(100vh-3.5rem)] text-[#F3F4F6] select-none shrink-0 font-sans">
      {/* Navigation section */}
      <div className="p-4 space-y-1 border-b border-[#313A40]">
        <div className="text-[10px] font-bold text-[#6B7780] uppercase tracking-wider mb-2">WORKSPACE</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive ? 'bg-[#242B30] text-[#F3F4F6] border border-[#313A40] shadow-sm' : 'text-[#9DA8B0] hover:bg-[#1C2226] hover:text-[#F3F4F6]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#9DA8B0]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Projects section */}
      <div className="flex-1 flex flex-col min-h-0 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#6B7780] uppercase tracking-wider">PROJECTS ({projects.length})</span>
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
              className="p-1 rounded text-[#9DA8B0] hover:text-[#F3F4F6] hover:bg-[#242B30] transition cursor-pointer"
              title="Create Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-[#6B7780] text-xs">
            <p className="mb-2 text-[11px]">No projects active.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#242B30] border border-[#313A40] text-[#F3F4F6] font-bold hover:bg-[#313A40] transition text-xs cursor-pointer"
            >
              + New Project
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {projects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition border cursor-pointer ${
                    isSelected
                      ? 'bg-[#242B30] border-[#313A40] text-[#F3F4F6] shadow-sm'
                      : 'border-transparent text-[#9DA8B0] hover:bg-[#1C2226] hover:text-[#F3F4F6]'
                  }`}
                  onClick={() => onSelectProject(p)}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="font-bold truncate text-[#F3F4F6]">{p.name}</div>
                    <div className="text-[10px] text-[#6B7780] truncate mt-0.5 font-mono">
                      {isSelected ? 'Active Workspace' : 'Idle'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    className="p-1 text-[#6B7780] hover:text-[#A47A7A] opacity-0 group-hover:opacity-100 transition cursor-pointer"
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
        <div className="p-4 border-t border-[#313A40] bg-[#171C20]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#6B7780] uppercase tracking-wider">DOCUMENTS</span>
          </div>

          <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-[#313A40] rounded-xl text-xs text-[#9DA8B0] hover:border-[#6B7780] hover:text-[#F3F4F6] cursor-pointer transition">
            <Plus className="w-3.5 h-3.5 text-[#9DA8B0]" />
            <span>{isUploading ? 'Uploading Document...' : 'Attach Document'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.json,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-xl bg-[#1C2226] text-[11px] text-[#9DA8B0] border border-[#313A40]">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-[#9DA8B0] shrink-0" />
                  <span className="truncate max-w-[110px] font-medium text-[#F3F4F6] text-[11px]">{f.filename}</span>
                </div>
                <span className="text-[10px] text-[#6B7780] font-mono shrink-0">
                  {f.page_count} pgs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Collapse Button */}
      <div className="p-3 border-t border-[#313A40] bg-[#171C20] flex items-center text-xs text-[#6B7780]">
        <button className="flex items-center gap-1.5 hover:text-[#F3F4F6] transition cursor-pointer font-medium">
          <ChevronLeft className="w-4 h-4" />
          <span>Collapse</span>
        </button>
      </div>

      {/* Clean Modal for Project Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C2226] border border-[#313A40] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#313A40] pb-3">
              <h3 className="text-sm font-bold text-[#F3F4F6]">Create New Project</h3>
              <button onClick={handleModalClose} className="text-[#6B7780] hover:text-[#F3F4F6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B7780] uppercase tracking-wider block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121619] border border-[#313A40] rounded-xl text-xs text-[#F3F4F6] focus:outline-none focus:border-[#6B7780]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7780] uppercase tracking-wider block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121619] border border-[#313A40] rounded-xl text-xs text-[#F3F4F6] focus:outline-none focus:border-[#6B7780]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#9DA8B0] hover:text-[#F3F4F6] border border-[#313A40]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs bg-[#242B30] border border-[#313A40] text-[#F3F4F6] font-bold hover:bg-[#313A40]"
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
