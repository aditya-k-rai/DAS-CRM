import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, merge, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface CrmDomainEvent {
  event:
    | 'lead.created'
    | 'lead.updated'
    | 'lead.allocated'
    | 'lead.status_changed'
    | 'lead.deleted'
    | 'dashboard.refresh';
  organizationId: string;
  leadId?: string;
  actorId?: string;
  actorRole?: string;
  changes?: Record<string, any>;
  timestamp: string;
}

export interface RealtimeMessage {
  data: CrmDomainEvent | { type: 'heartbeat'; timestamp: string };
  type?: string;
  id?: string;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly eventBus$ = new Subject<CrmDomainEvent>();

  /**
   * Publishes a domain event across the realtime gateway for the specified organization.
   */
  emitDomainEvent(event: CrmDomainEvent) {
    this.logger.debug(
      `[Realtime] Emitting ${event.event} for org ${event.organizationId}, lead: ${event.leadId}`
    );
    this.eventBus$.next(event);
  }

  /**
   * Returns an Observable stream for a specific authenticated organization client.
   * Merges real domain events with a 25-second heartbeat to maintain persistent connection.
   */
  getEventStream(
    organizationId: string,
    userId: string,
    role: string
  ): Observable<RealtimeMessage> {
    const domainStream$ = this.eventBus$.pipe(
      filter((e) => e.organizationId === organizationId),
      map((event) => ({
        id: `${event.event}-${Date.now()}`,
        type: event.event,
        data: event,
      }))
    );

    const heartbeatStream$ = interval(25000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: { type: 'heartbeat' as const, timestamp: new Date().toISOString() },
      }))
    );

    return merge(domainStream$, heartbeatStream$);
  }
}
