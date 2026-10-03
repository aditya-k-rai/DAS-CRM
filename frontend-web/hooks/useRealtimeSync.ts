'use client';

import { useEffect, useRef } from 'react';
import { getAuthToken } from '@/lib/apiClient';
import { clearAllDashboardCaches } from '@/lib/cacheUtils';

export interface RealtimeSyncOptions {
  onLeadChange?: (event: any) => void;
  enabled?: boolean;
}

/**
 * useRealtimeSync
 * Subscribes to the backend Server-Sent Events (SSE) stream for tenant-isolated
 * realtime updates. Dispatches local events, updates caches, and handles reconnection.
 */
export function useRealtimeSync(options: RealtimeSyncOptions = {}) {
  const { onLeadChange, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const backoffDelayRef = useRef<number>(1000); // 1s start

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      const token = getAuthToken();
      if (!token) {
        // Retry after delay if token not yet hydrated
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
        return;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const streamUrl = `${apiBase}/realtime/stream?token=${encodeURIComponent(token)}`;

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          backoffDelayRef.current = 1000; // Reset backoff on successful connection
        };

        const handleIncomingEvent = (event: MessageEvent) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'heartbeat') return;

            // Invalidate client caches to force authoritative database read
            clearAllDashboardCaches();

            // Dispatch global UI events for all open views & components
            window.dispatchEvent(
              new CustomEvent('das_crm_leads_updated', { detail: parsed })
            );

            // Also synchronize across tabs in the same browser via BroadcastChannel
            try {
              const bc = new BroadcastChannel('das_crm_lead_sync');
              bc.postMessage(parsed);
              bc.close();
            } catch (_) {}

            if (onLeadChange) {
              onLeadChange(parsed);
            }
          } catch (err) {
            console.warn('[useRealtimeSync] Error parsing incoming event:', err);
          }
        };

        // Listen for standard message and named domain events
        es.onmessage = handleIncomingEvent;
        es.addEventListener('lead.created', handleIncomingEvent);
        es.addEventListener('lead.updated', handleIncomingEvent);
        es.addEventListener('lead.allocated', handleIncomingEvent);
        es.addEventListener('lead.status_changed', handleIncomingEvent);
        es.addEventListener('lead.deleted', handleIncomingEvent);

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          if (!isMounted) return;

          // Exponential backoff with jitter (max 30s)
          const jitter = Math.random() * 500;
          const nextDelay = Math.min(backoffDelayRef.current * 2 + jitter, 30000);
          backoffDelayRef.current = nextDelay;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
            // On reconnect: trigger a sync refresh to catch up on any missed events
            window.dispatchEvent(new CustomEvent('das_crm_leads_updated'));
          }, nextDelay);
        };
      } catch (e) {
        console.warn('[useRealtimeSync] Failed to initialize EventSource:', e);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, onLeadChange]);
}
