"""
GANZA Desktop Agent — Python
Perception → VLM → Action → Verification → Recovery
Implements coordinate normalization 0-1000 and strict VLM JSON contract.
"""
import asyncio
from perception.screenshot import capture_screenshot, get_screen_size
from perception.vlm import parse_vlm_output, validate_coordinate
from perception.ocr import run_ocr
from actions.mouse import click_at, drag
from actions.keyboard import type_text, press_key, hotkey
from verifier.verifier import verify
from browser.playwright_agent import BrowserAgent

class DesktopAgent:
    def __init__(self, vlm_client=None):
        self.vlm = vlm_client
        self.browser = BrowserAgent()

    async def observe(self):
        screenshot, w, h = capture_screenshot()
        ocr_text = run_ocr(screenshot)
        return {"screenshot": screenshot, "width": w, "height": h, "ocr": ocr_text}

    async def act(self, vlm_json: dict, screen_w: int, screen_h: int):
        parsed = parse_vlm_output(vlm_json)
        x_norm, y_norm = parsed.coordinate
        validate_coordinate(x_norm, y_norm)
        real_x = int(x_norm / 1000 * screen_w)
        real_y = int(y_norm / 1000 * screen_h)
        # Hard bounds check before action
        if not (0 <= real_x <= screen_w and 0 <= real_y <= screen_h):
            raise ValueError(f"Coordinate out of bounds: {real_x},{real_y} for {screen_w}x{screen_h}")
        action = parsed.action
        if action == "click":
            click_at(real_x, real_y)
        elif action == "type":
            type_text(parsed.text or "")
        elif action == "key":
            press_key(parsed.text or "Enter")
        elif action == "hotkey":
            hotkey(parsed.text or "")
        elif action == "scroll":
            drag(0, 0)  # placeholder
        elif action == "wait":
            await asyncio.sleep(float(parsed.text or "1"))
        else:
            raise ValueError(f"NOT_SUPPORTED action {action}")
        return {"action": action, "real_x": real_x, "real_y": real_y, "target": parsed.target}

    async def run_task(self, goal: str, expected: str):
        before = await self.observe()
        # VLM would be called here with screenshot + goal
        # For now, stub evidence — real VLM integration via self.vlm
        fake_vlm = {"action": "click", "coordinate": [500, 500], "target": "stub", "expected_result": expected, "confidence": 0.0, "text": ""}
        result = await self.act(fake_vlm, before["width"], before["height"])
        after = await self.observe()
        verification = verify(expected=expected, before=before, after=after, tool_result=result)
        return {"result": result, "verification": verification, "before": before, "after": after}

if __name__ == "__main__":
    agent = DesktopAgent()
    import json
    print("DesktopAgent ready — screen:", get_screen_size())
