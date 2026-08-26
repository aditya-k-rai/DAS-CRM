"""
sync_engine.py — DAS CRM Windows
Offline-First Sync Engine with SQLite + JSON Persistence and Backend Integration
"""

import sqlite3
import json
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import logging

# ─────────────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────────────

logger = logging.getLogger("DASCRMSync")
logger.setLevel(logging.DEBUG)

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class PendingAction:
    """Pending mutation to sync with backend"""
    id: str
    action_type: str  # CREATE, UPDATE, DELETE, BULK_DELETE
    entity_type: str  # lead, deal, contact, product, etc.
    entity_id: str
    payload: Dict[str, Any]
    timestamp: str
    status: str  # PENDING, SYNCING, SYNCED, FAILED
    retry_count: int = 0
    error_message: Optional[str] = None

@dataclass
class SyncConflict:
    """Conflict when local and remote data differ"""
    entity_type: str
    entity_id: str
    local_version: int
    remote_version: int
    resolution: str  # KEEP_LOCAL, KEEP_REMOTE, MERGE

# ─────────────────────────────────────────────────────────────────────────────────────
# SYNC ENGINE
# ─────────────────────────────────────────────────────────────────────────────────────

class DASCRMSyncEngine:
    """Offline-first sync engine with conflict resolution"""

    def __init__(self, db_path: str = "~/.dascrm/offline.db", queue_path: str = "~/.dascrm/pending_actions.json"):
        self.db_path = Path(db_path).expanduser()
        self.queue_path = Path(queue_path).expanduser()

        # Create directories
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.queue_path.parent.mkdir(parents=True, exist_ok=True)

        self._init_database()
        self._load_pending_queue()

    def _init_database(self):
        """Initialize SQLite database schema"""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()

        # Leads table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT NOT NULL,
                company TEXT,
                status TEXT,
                value TEXT,
                source TEXT,
                assigned_rep TEXT,
                last_contact TEXT,
                next_followup TEXT,
                version INTEGER DEFAULT 1,
                synced INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        """)

        # Pending actions queue
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pending_actions (
                id TEXT PRIMARY KEY,
                action_type TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                payload TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                retry_count INTEGER DEFAULT 0,
                error_message TEXT
            )
        """)

        # Sync conflicts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conflicts (
                id TEXT PRIMARY KEY,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                local_version INTEGER,
                remote_version INTEGER,
                resolution TEXT,
                created_at TEXT
            )
        """)

        # Sync metadata
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT
            )
        """)

        conn.commit()
        conn.close()
        logger.info(f"Initialized database at {self.db_path}")

    def _load_pending_queue(self):
        """Load pending actions from JSON queue"""
        if self.queue_path.exists():
            try:
                with open(self.queue_path, 'r') as f:
                    data = json.load(f)
                    logger.info(f"Loaded {len(data)} pending actions from queue")
            except Exception as e:
                logger.error(f"Failed to load pending queue: {e}")

    def _save_pending_queue(self, actions: List[PendingAction]):
        """Save pending actions to JSON queue"""
        try:
            with open(self.queue_path, 'w') as f:
                json.dump([asdict(a) for a in actions], f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save pending queue: {e}")

    # ── LOCAL OPERATIONS ────────────────────────────────────────────────────────────

    def create_lead_locally(self, lead_data: Dict[str, Any]) -> bool:
        """Create lead locally and queue for sync"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            lead_id = lead_data.get('id', f"lead-{int(datetime.now().timestamp())}")
            now = datetime.now().isoformat()

            cursor.execute("""
                INSERT INTO leads (id, name, email, phone, company, status, value, source,
                                  assigned_rep, last_contact, next_followup, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lead_id,
                lead_data.get('name'),
                lead_data.get('email'),
                lead_data.get('phone'),
                lead_data.get('company'),
                lead_data.get('status', 'NEW_LEAD'),
                lead_data.get('value'),
                lead_data.get('source'),
                lead_data.get('assignedRep'),
                lead_data.get('lastContact'),
                lead_data.get('nextFollowUp'),
                now,
                now
            ))

            conn.commit()
            conn.close()

            # Queue for sync
            self._queue_action(PendingAction(
                id=f"action-{lead_id}",
                action_type="CREATE",
                entity_type="lead",
                entity_id=lead_id,
                payload=lead_data,
                timestamp=now,
                status="PENDING"
            ))

            logger.info(f"Created lead locally: {lead_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to create lead locally: {e}")
            return False

    def update_lead_locally(self, lead_id: str, updates: Dict[str, Any]) -> bool:
        """Update lead locally and queue for sync"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            now = datetime.now().isoformat()
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            set_clause += ", updated_at = ?"

            values = list(updates.values()) + [now, lead_id]

            cursor.execute(f"UPDATE leads SET {set_clause} WHERE id = ?", values)

            conn.commit()
            conn.close()

            # Queue for sync
            self._queue_action(PendingAction(
                id=f"action-{lead_id}-{int(datetime.now().timestamp())}",
                action_type="UPDATE",
                entity_type="lead",
                entity_id=lead_id,
                payload=updates,
                timestamp=now,
                status="PENDING"
            ))

            logger.info(f"Updated lead locally: {lead_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update lead locally: {e}")
            return False

    def delete_lead_locally(self, lead_id: str) -> bool:
        """Delete lead locally and queue for sync"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))

            conn.commit()
            conn.close()

            # Queue for sync
            self._queue_action(PendingAction(
                id=f"action-{lead_id}-delete",
                action_type="DELETE",
                entity_type="lead",
                entity_id=lead_id,
                payload={},
                timestamp=datetime.now().isoformat(),
                status="PENDING"
            ))

            logger.info(f"Deleted lead locally: {lead_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete lead locally: {e}")
            return False

    def get_lead_locally(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get lead from local database"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
            row = cursor.fetchone()

            conn.close()

            if row:
                return dict(row)
            return None
        except Exception as e:
            logger.error(f"Failed to get lead locally: {e}")
            return None

    def get_all_leads_locally(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all leads from local database"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM leads ORDER BY updated_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()

            conn.close()

            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get leads locally: {e}")
            return []

    # ── SYNC OPERATIONS ─────────────────────────────────────────────────────────────

    def _queue_action(self, action: PendingAction):
        """Queue pending action for sync"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR REPLACE INTO pending_actions
                (id, action_type, entity_type, entity_id, payload, timestamp, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                action.id,
                action.action_type,
                action.entity_type,
                action.entity_id,
                json.dumps(action.payload),
                action.timestamp,
                action.status
            ))

            conn.commit()
            conn.close()

            logger.info(f"Queued action: {action.action_type} on {action.entity_type}")
        except Exception as e:
            logger.error(f"Failed to queue action: {e}")

    def get_pending_actions(self) -> List[PendingAction]:
        """Get all pending actions"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM pending_actions
                WHERE status = 'PENDING' OR status = 'FAILED'
                ORDER BY timestamp ASC
            """)
            rows = cursor.fetchall()

            conn.close()

            actions = []
            for row in rows:
                actions.append(PendingAction(
                    id=row['id'],
                    action_type=row['action_type'],
                    entity_type=row['entity_type'],
                    entity_id=row['entity_id'],
                    payload=json.loads(row['payload']),
                    timestamp=row['timestamp'],
                    status=row['status'],
                    retry_count=row['retry_count'],
                    error_message=row['error_message']
                ))

            return actions
        except Exception as e:
            logger.error(f"Failed to get pending actions: {e}")
            return []

    async def sync_pending_actions(self, api_client) -> Dict[str, int]:
        """Sync all pending actions with backend"""
        pending = self.get_pending_actions()
        results = {"synced": 0, "failed": 0, "conflicts": 0}

        for action in pending:
            try:
                # Mark as syncing
                self._update_action_status(action.id, "SYNCING")

                # Execute action based on type
                if action.action_type == "CREATE":
                    response = await api_client.create_lead(action.payload)
                    if response.success:
                        self._update_action_status(action.id, "SYNCED")
                        self._mark_entity_synced(action.entity_id)
                        results["synced"] += 1
                    else:
                        self._update_action_status(action.id, "FAILED", response.message)
                        results["failed"] += 1

                elif action.action_type == "UPDATE":
                    response = await api_client.update_lead(action.entity_id, action.payload)
                    if response.success:
                        self._update_action_status(action.id, "SYNCED")
                        results["synced"] += 1
                    else:
                        self._update_action_status(action.id, "FAILED", response.message)
                        results["failed"] += 1

                elif action.action_type == "DELETE":
                    response = await api_client.delete_lead(action.entity_id)
                    if response.success:
                        self._update_action_status(action.id, "SYNCED")
                        results["synced"] += 1
                    else:
                        self._update_action_status(action.id, "FAILED", response.message)
                        results["failed"] += 1

            except Exception as e:
                logger.error(f"Error syncing action {action.id}: {e}")
                self._update_action_status(action.id, "FAILED", str(e))
                results["failed"] += 1

        logger.info(f"Sync complete: {results['synced']} synced, {results['failed']} failed")
        return results

    def _update_action_status(self, action_id: str, status: str, error: Optional[str] = None):
        """Update action status in database"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE pending_actions
                SET status = ?, error_message = ?
                WHERE id = ?
            """, (status, error, action_id))

            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to update action status: {e}")

    def _mark_entity_synced(self, entity_id: str):
        """Mark entity as synced"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE leads
                SET synced = 1
                WHERE id = ?
            """, (entity_id,))

            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to mark entity synced: {e}")

    def get_sync_stats(self) -> Dict[str, Any]:
        """Get sync statistics"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) as count FROM pending_actions WHERE status = 'PENDING'")
            pending_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) as count FROM pending_actions WHERE status = 'FAILED'")
            failed_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) as count FROM leads WHERE synced = 1")
            synced_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) as count FROM leads")
            total_count = cursor.fetchone()[0]

            conn.close()

            return {
                "pending": pending_count,
                "failed": failed_count,
                "synced": synced_count,
                "total": total_count,
                "sync_percentage": (synced_count / total_count * 100) if total_count > 0 else 0
            }
        except Exception as e:
            logger.error(f"Failed to get sync stats: {e}")
            return {}

# ─────────────────────────────────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────────────────────────────────────────────

_sync_engine: Optional[DASCRMSyncEngine] = None

def get_sync_engine() -> DASCRMSyncEngine:
    """Get or create sync engine singleton"""
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = DASCRMSyncEngine()
    return _sync_engine
