import { useEffect, useState } from 'react';
import { SSEEvent } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export function useSSE(conversationId: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const eventSource = new EventSource(`${API_BASE}/conversations/${conversationId}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream warning:', err);
      setIsConnected(false);
    };

    const handleEvent = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event_type) {
          setEvents((prev) => [...prev, parsed]);
        }
      } catch (e) {
        // ignore parse error
      }
    };

    // Universal message listener + specific type listeners
    eventSource.onmessage = handleEvent;

    const eventTypes = [
      'manager_started',
      'manager_planning',
      'task_created',
      'agent_assigned',
      'agent_started',
      'agent_completed',
      'agent_failed',
      'evidence_created',
      'manager_reviewing',
      'manager_synthesizing',
      'execution_completed',
      'execution_failed'
    ];

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, handleEvent);
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [conversationId]);

  return { events, isConnected };
}
