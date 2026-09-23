def type_text(text: str):
    import pyautogui
    pyautogui.typewrite(text, interval=0.02)

def press_key(key: str):
    import pyautogui
    pyautogui.press(key)

def hotkey(keys: str):
    import pyautogui
    parts = [k.strip() for k in keys.split("+")]
    pyautogui.hotkey(*parts)
