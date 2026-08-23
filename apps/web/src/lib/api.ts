import { Project, FileRecord, Message, Task, Evidence } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function deleteAllProjects(): Promise<void> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete all projects');
}

export async function uploadProjectFile(projectId: string, file: File): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/projects/${projectId}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
}

export async function submitObjective(conversationId: string, prompt: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/objectives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('Failed to submit objective');
  return res.json();
}

export async function fetchConversationHistory(conversationId: string): Promise<{
  messages: Message[];
  tasks: Task[];
  evidence: Evidence[];
}> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation history');
  return res.json();
}
