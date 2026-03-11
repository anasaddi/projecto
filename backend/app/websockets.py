from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Mappa share_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, share_id: str):
        await websocket.accept()
        if share_id not in self.active_connections:
            self.active_connections[share_id] = []
        self.active_connections[share_id].append(websocket)

    def disconnect(self, websocket: WebSocket, share_id: str):
        if share_id in self.active_connections:
            if websocket in self.active_connections[share_id]:
                self.active_connections[share_id].remove(websocket)
            if not self.active_connections[share_id]:
                del self.active_connections[share_id]

    async def broadcast(self, message: dict, share_id: str, exclude: WebSocket = None):
        if share_id in self.active_connections:
            for connection in self.active_connections[share_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        # Se la connessione è morta, potremmo rimuoverla, 
                        # ma disconnect() viene chiamato solitamente dall'endpoint
                        pass

manager = ConnectionManager()
