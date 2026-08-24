export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  default_conversation_id?: string;
  file_count?: number;
}

export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  size_bytes?: number;
  page_count: number;
  processing_status?: string;
  mime_type?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  objective: string;
  status: 'QUEUED' | 'PLANNING' | 'ASSIGNED' | 'RUNNING' | 'REVIEW' | 'COMPLETED' | 'FAILED';
  capabilities?: string[];
  worker?: string;
  provider?: string;
}

export interface Evidence {
  id: string;
  claim: string;
  excerpt: string;
  page_number?: number;
  verification_status: 'PENDING' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'CONTRADICTED';
  document_name?: string;
}

export interface SSEEvent {
  event_type: string;
  timestamp: number;
  payload: any;
}
