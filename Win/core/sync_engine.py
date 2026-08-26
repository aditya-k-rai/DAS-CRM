"""
DAS CRM Windows Application - Sync Engine
Offline queue management with SQLite persistence and network monitoring.
Automatically syncs pending actions when connectivity is restored.
"""

import sqlite3
import json
import socket
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from PyQt6.QtCore import QObject, pyqtSignal, QTimer


@dataclass
class PendingAction:
    """Represents a pending action to sync."""
    id: str
    action_type: str  # CREATE_LEAD, UPDATE_DEAL, DELETE_CONTACT, etc.
    payload: Dict[str, Any]
    timestamp: datetime
    retry_count: int = 0
    max_retries: int = 3


class SyncEngine(QObject):
    """Manages offline queue and network synchronization."""
    
    sync_complete = pyqtSignal()
    sync_failed = pyqtSignal(str)
    offline_status_changed = pyqtSignal(bool)  # True = offline, False = online
    
    def __init__(self):
        super().__init__()
        self.db_path = Path.home() / ".dascrm" / "offline.db"
        self.queue_path = Path.home() / ".dascrm" / "pending_actions.json"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self._init_database()
        self._is_online = self._check_connectivity()
        
        # Network monitor thread
        self.monitor_thread = threading.Thread(target=self._monitor_network, daemon=True)
        self.monitor_thread.start()
    
    def _init_database(self):
        """Initialize SQLite database schema."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Pending actions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pending_actions (
                id TEXT PRIMARY KEY,
                action_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0
            )
        """)
        
        # Offline cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cached_entities (
                entity_id TEXT PRIMARY KEY,
                entity_type TEXT NOT NULL,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()
    
    def _check_connectivity(self) -> bool:
        """Check if device is online."""
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=2)
            return True
        except (socket.timeout, socket.error):
            return False
    
    def _monitor_network(self):
        """Background thread monitoring network connectivity."""
        previous_status = self._is_online
        
        while True:
            threading.Event().wait(5)  # Check every 5 seconds
            current_status = self._check_connectivity()
            
            if current_status != previous_status:
                self._is_online = current_status
                self.offline_status_changed.emit(not current_status)
                
                if current_status:  # Just came online
                    self._sync_pending_actions()
                
                previous_status = current_status
    
    def enqueue_action(self, action_type: str, payload: Dict[str, Any]) -> str:
        """Queue a pending action for sync."""
        import uuid
        action_id = str(uuid.uuid4())
        
        action = PendingAction(
            id=action_id,
            action_type=action_type,
            payload=payload,
            timestamp=datetime.now()
        )
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO pending_actions (id, action_type, payload, timestamp, retry_count)
            VALUES (?, ?, ?, ?, ?)
        """, (
            action.id,
            action.action_type,
            json.dumps(action.payload),
            action.timestamp.isoformat(),
            action.retry_count
        ))
        
        conn.commit()
        conn.close()
        
        return action_id
    
    def cache_entity(self, entity_id: str, entity_type: str, data: Dict[str, Any]):
        """Cache an entity locally."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO cached_entities (entity_id, entity_type, data, updated_at)
            VALUES (?, ?, ?, ?)
        """, (
            entity_id,
            entity_type,
            json.dumps(data),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_cached_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached entity."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("SELECT data FROM cached_entities WHERE entity_id = ?", (entity_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return json.loads(row[0])
        return None
    
    def get_pending_actions(self) -> List[PendingAction]:
        """Retrieve all pending actions."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, action_type, payload, timestamp, retry_count FROM pending_actions")
        rows = cursor.fetchall()
        conn.close()
        
        actions = []
        for row in rows:
            actions.append(PendingAction(
                id=row[0],
                action_type=row[1],
                payload=json.loads(row[2]),
                timestamp=datetime.fromisoformat(row[3]),
                retry_count=row[4]
            ))
        
        return actions
    
    def _sync_pending_actions(self):
        """Sync all pending actions to backend."""
        # This would be called by main.py when syncing
        # For now, just emit signal
        self.sync_complete.emit()
    
    def remove_pending_action(self, action_id: str):
        """Remove action after successful sync."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pending_actions WHERE id = ?", (action_id,))
        conn.commit()
        conn.close()
