import copy
import json
from pathlib import Path
from typing import Any, Dict

_INITIAL_STATE_PATH = Path(__file__).resolve().parent / "initial_state.json"


def _load_initial_state() -> Dict[str, Any]:
    with _INITIAL_STATE_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


_BASE_STATE = _load_initial_state()


def default_state_data() -> Dict[str, Any]:
    return copy.deepcopy(_BASE_STATE)
