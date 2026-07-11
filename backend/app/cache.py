import time
import threading
from typing import Dict, Any, Optional

class MemoryCache:
    def __init__(self, default_ttl: int = 300):
        """
        Initializes a thread-safe in-memory cache with a default Time-To-Live (TTL).
        :param default_ttl: Default TTL in seconds. Defaults to 300 seconds (5 minutes).
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = default_ttl
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieves an item from the cache. Returns None if it does not exist or has expired.
        """
        with self._lock:
            entry = self._cache.get(key)
            if entry:
                if time.time() < entry["expires_at"]:
                    return entry["data"]
                else:
                    # Cache entry has expired, purge it
                    del self._cache[key]
            return None

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        """
        Sets an item in the cache with a specific or default TTL.
        """
        ttl_seconds = ttl if ttl is not None else self._default_ttl
        with self._lock:
            self._cache[key] = {
                "data": data,
                "expires_at": time.time() + ttl_seconds
            }

    def clear(self) -> None:
        """
        Clears all items in the cache.
        """
        with self._lock:
            self._cache.clear()

# Singleton cache instance for the application
stock_cache = MemoryCache(default_ttl=300)
