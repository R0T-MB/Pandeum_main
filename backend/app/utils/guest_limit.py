from collections import deque
import time
from typing import Dict, Deque

# Límite de consultas por invitado (sin cuenta) usando la IP como identidad.
# In-memory: suficiente para MVP/single-instance. Para multi-instancia
# habría que usar Redis, pero no es necesario ahora.
class GuestUsageTracker:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._usage: Dict[str, Deque[float]] = {}

    def check(self, key: str) -> bool:
        """Devuelve True si el invitado aún puede hacer consultas."""
        now = time.time()
        history = self._usage.get(key)
        if history is None:
            history = deque()
            self._usage[key] = history

        while history and now - history[0] > self.window_seconds:
            history.popleft()

        return len(history) < self.max_requests

    def record(self, key: str):
        now = time.time()
        history = self._usage.get(key)
        if history is None:
            history = deque()
            self._usage[key] = history

        while history and now - history[0] > self.window_seconds:
            history.popleft()

        history.append(now)

    def remaining(self, key: str) -> int:
        now = time.time()
        history = self._usage.get(key)
        if history is None:
            return self.max_requests

        while history and now - history[0] > self.window_seconds:
            history.popleft()

        return max(0, self.max_requests - len(history))
