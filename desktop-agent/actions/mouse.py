def click_at(x: int, y: int):
    import pyautogui
    # Bounds check already done by agent; PyAutoGUI failsafe
    pyautogui.FAILSAFE = False
    pyautogui.click(x, y)

def drag(x1: int, y1: int, x2: int = None, y2: int = None):
    import pyautogui
    if x2 is None:
        pyautogui.scroll(-300)
    else:
        pyautogui.dragTo(x2, y2, duration=0.5)
