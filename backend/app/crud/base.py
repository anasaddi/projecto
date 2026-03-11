import json
import inspect
from typing import Any

def _parse_json(val: Any, default: Any = None) -> Any:
    if val is None: return default
    if isinstance(val, (dict, list)): return val
    if isinstance(val, str):
        try: return json.loads(val)
        except Exception: return default
    return default


async def _maybe_await(result: Any) -> Any:
    if inspect.isawaitable(result):
        return await result
    return result
