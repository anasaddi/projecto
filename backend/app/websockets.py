"""
WebSocket connection manager with:
- Per-connection message rate limiting
- Graceful shutdown with client notification  
- Optimistic locking version tracking
"""
import time
import logging
import asyncio
from typing import List, Dict, Optional
from collections import defaultdict
from fastapi import WebSocket

logger = logging.getLogger("km.ws")

# Rate limits
WS_MAX_MESSAGES_PER_MINUTE = 60
WS_RATE_WINDOW = 60  # seconds


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self._message_counts: Dict[int, list] = defaultdict(list)  # ws_id -> [timestamps]
        self._versions: Dict[str, int] = defaultdict(int)  # share_id -> version counter

    async def connect(self, websocket: WebSocket, share_id: str):
        await websocket.accept()
        if share_id not in self.active_connections:
            self.active_connections[share_id] = []
        self.active_connections[share_id].append(websocket)
        logger.info(f"WS connected", extra={"share_id": share_id, "action": "connect"})

    def disconnect(self, websocket: WebSocket, share_id: str):
        if share_id in self.active_connections:
            if websocket in self.active_connections[share_id]:
                self.active_connections[share_id].remove(websocket)
            if not self.active_connections[share_id]:
                del self.active_connections[share_id]
        # Clean up rate limit tracking
        ws_id = id(websocket)
        self._message_counts.pop(ws_id, None)
        logger.info(f"WS disconnected", extra={"share_id": share_id, "action": "disconnect"})

    def check_rate_limit(self, websocket: WebSocket) -> bool:
        """Returns True if the message is allowed, False if rate-limited."""
        ws_id = id(websocket)
        now = time.monotonic()
        window_start = now - WS_RATE_WINDOW
        
        # Prune old timestamps
        self._message_counts[ws_id] = [
            t for t in self._message_counts[ws_id] if t > window_start
        ]
        
        if len(self._message_counts[ws_id]) >= WS_MAX_MESSAGES_PER_MINUTE:
            return False
        
        self._message_counts[ws_id].append(now)
        return True

    def increment_version(self, share_id: str) -> int:
        """Increment and return the optimistic locking version for a share_id."""
        self._versions[share_id] += 1
        return self._versions[share_id]

    def get_version(self, share_id: str) -> int:
        return self._versions[share_id]

    async def broadcast(self, message: dict, share_id: str, exclude: WebSocket = None):
        """Broadcast message to all connections for a share_id, with version stamp."""
        if share_id not in self.active_connections:
            return
        
        # Stamp the message with the current version
        message["_version"] = self.increment_version(share_id)
        
        dead_connections = []
        for connection in self.active_connections[share_id]:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
        
        # Clean up dead connections
        for dead in dead_connections:
            self.disconnect(dead, share_id)

    async def graceful_shutdown(self):
        """Notify all clients of server restart and close connections."""
        shutdown_msg = {"type": "server_restart", "message": "Server is restarting. Reconnect shortly."}
        
        all_tasks = []
        for share_id, connections in list(self.active_connections.items()):
            for ws in connections:
                async def _close(w=ws, sid=share_id):
                    try:
                        await w.send_json(shutdown_msg)
                        await w.close(code=1001, reason="Server restart")
                    except Exception:
                        pass
                all_tasks.append(_close())
        
        if all_tasks:
            await asyncio.gather(*all_tasks, return_exceptions=True)
            logger.info(f"Gracefully closed {len(all_tasks)} WebSocket connections")
        
        self.active_connections.clear()
        self._message_counts.clear()


manager = ConnectionManager()
