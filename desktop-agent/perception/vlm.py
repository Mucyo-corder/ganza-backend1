from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
import json

class VlmAction(BaseModel):
    action: Literal["click", "double_click", "long_press", "type", "key", "hotkey", "scroll", "drag", "hover", "wait", "open_app", "open_url", "back", "home"]
    coordinate: list[int] = Field(default=[500, 500], description="Normalized 0-1000")
    text: Optional[str] = None
    target: Optional[str] = None
    expected_result: str
    confidence: float = Field(ge=0, le=1)

    @field_validator("coordinate")
    @classmethod
    def validate_coord(cls, v):
        if len(v) != 2:
            raise ValueError("coordinate must be [x,y]")
        x, y = v
        if not (0 <= x <= 1000 and 0 <= y <= 1000):
            raise ValueError(f"coordinate out of bounds 0-1000: {v}")
        return v

def parse_vlm_output(raw: dict | str) -> VlmAction:
    """
    Strict JSON contract:
    { "action": "...", "coordinate": [x,y], "expected_result": "...", "confidence": 0.97 }
    Invalid JSON → INVALID_MODEL_OUTPUT
    """
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"INVALID_MODEL_OUTPUT: JSON parse failed: {e}")
    else:
        data = raw
    try:
        return VlmAction.model_validate(data)
    except Exception as e:
        # Attempt repair: try to extract JSON substring
        if isinstance(raw, str):
            import re
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                try:
                    return VlmAction.model_validate(json.loads(m.group()))
                except:
                    pass
        raise ValueError(f"INVALID_MODEL_OUTPUT: {e}")

def validate_coordinate(x: int, y: int):
    if not (0 <= x <= 1000 and 0 <= y <= 1000):
        raise ValueError(f"Coordinate out of bounds 0-1000: [{x},{y}]")
