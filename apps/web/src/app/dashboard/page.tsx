'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { ChatWorkspace } from '@/components/ChatWorkspace';
import { OrgDiagram } from '@/components/OrgDiagram';
import { LiveFeed } from '@/components/LiveFeed';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import { fetchProjects, createProject, deleteProject, deleteAllProjects, uploadProjectFile, submitObjective, fetchConversationHistory } from '@/lib/api';
import { useSSE } from '@/lib/useSSE';
import { Project, FileRecord, Message, Task, Evidence } from '@/lib/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [forceOpenModal, setForceOpenModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projList = await fetchProjects();
      setProjects(projList);
      if (projList.length > 0) {
        selectProject(projList[0]);
      } else {
        setActiveProject(null);
        setConversationId(null);
        setMessages([]);
        setTasks([]);
        setEvidenceList([]);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const selectProject = async (proj: Project) => {
    setActiveProject(proj);
    if (proj.default_conversation_id) {
      setConversationId(proj.default_conversation_id);
      loadHistory(proj.default_conversation_id);
    }
  };

  const loadHistory = async (convId: string) => {
    try {
      const history = await fetchConversationHistory(convId);
      setMessages(history.messages);
      setTasks(history.tasks);
      setEvidenceList(history.evidence);
    } catch (e) {
      console.error('Failed to load conversation history:', e);
    }
  };

  // Poll for history while processing
  useEffect(() => {
    if (!isProcessing || !conversationId) return;
    const interval = setInterval(() => {
      loadHistory(conversationId);
    }, 2000);
    return () => clearInterval(interval);
  }, [isProcessing, conversationId]);

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const newProj = await createProject(name, description);
      setProjects((prev) => [newProj, ...prev]);
      selectProject(newProj);
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProject?.id === projectId) {
        if (remaining.length > 0) {
          selectProject(remaining[0]);
        } else {
          setActiveProject(null);
          setConversationId(null);
          setMessages([]);
          setTasks([]);
          setEvidenceList([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllProjects();
      setProjects([]);
      setActiveProject(null);
      setConversationId(null);
      setMessages([]);
      setTasks([]);
      setEvidenceList([]);
    } catch (e) {
      console.error('Failed to clear workspace:', e);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!activeProject) return;
    setIsUploading(true);
    try {
      const fileRec = await uploadProjectFile(activeProject.id, file);
      setFiles((prev) => [...prev, fileRec]);
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitObjective = async (prompt: string) => {
    if (!conversationId) return;
    setIsProcessing(true);

    const tempUserMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      await submitObjective(conversationId, prompt);
    } catch (e) {
      console.error('Objective submission error:', e);
      setIsProcessing(false);
    }
  };

  // Real-time SSE Stream Listener
  const { events } = useSSE(conversationId);

  useEffect(() => {
    if (!events.length || !conversationId) return;
    const latestEvent = events[events.length - 1];

    if (latestEvent.event_type === 'task_created') {
      const p = latestEvent.payload;
      if (p && p.task_id) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === p.task_id)) return prev;
          return [
            ...prev,
            {
              id: p.task_id,
              objective: p.objective,
              status: 'QUEUED',
              worker: 'Ollama Worker',
              priority: p.priority || 'high',
            },
          ];
        });
      }
    } else if (latestEvent.event_type === 'agent_assigned' || latestEvent.event_type === 'agent_started') {
      const p = latestEvent.payload;
      if (p && p.task_id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === p.task_id ? { ...t, status: 'RUNNING', worker: p.agent_name || 'Worker' } : t))
        );
      }
    } else if (latestEvent.event_type === 'agent_completed') {
      const p = latestEvent.payload;
      if (p && p.task_id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === p.task_id ? { ...t, status: 'COMPLETED' } : t))
        );
      }
      loadHistory(conversationId);
    } else if (latestEvent.event_type === 'execution_completed' || latestEvent.event_type === 'execution_failed') {
      setIsProcessing(false);
      loadHistory(conversationId);
    }
  }, [events, conversationId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B0F17] text-white">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ProjectSidebar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={selectProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onClearAll={handleClearAll}
          onFileUpload={handleFileUpload}
          files={files}
          isUploading={isUploading}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          forceOpenModal={forceOpenModal}
          onCloseModal={() => setForceOpenModal(false)}
        />

        {/* Center Workspace */}
        <ChatWorkspace
          activeProject={activeProject}
          messages={messages}
          onSubmitObjective={handleSubmitObjective}
          isProcessing={isProcessing}
          onSelectEvidence={(ev) => setSelectedEvidence(ev)}
          evidenceList={evidenceList}
          onOpenCreateProject={() => setForceOpenModal(true)}
        />

        {/* Right AI Organization Panel */}
        <div className="w-80 border-l border-[#263347] bg-[#141A26] flex flex-col h-[calc(100vh-3.5rem)]">
          <OrgDiagram tasks={tasks} isProcessing={isProcessing} />
          <LiveFeed events={events} />
        </div>
      </div>

      {/* Slide-over Evidence Drawer */}
      <EvidenceDrawer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
    </div>
  );
}
