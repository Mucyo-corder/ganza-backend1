from PIL import Image
import io
import base64

def get_screen_size():
    try:
        import pyautogui
        w, h = pyautogui.size()
        return w, h
    except Exception:
        return 1920, 1080

def capture_screenshot():
    """
    Returns (PIL.Image, width, height)
    Normalize coordinates later to 0-1000
    """
    try:
        import pyautogui
        img = pyautogui.screenshot()
        w, h = img.size
        return img, w, h
    except Exception as e:
        # Fallback blank image for headless CI
        w, h = get_screen_size()
        img = Image.new("RGB", (w, h), color=(15, 30, 60))
        return img, w, h

def image_to_base64(img, max_width=1280):
    if img.width > max_width:
        ratio = max_width / img.width
        new_h = int(img.height * ratio)
        img = img.resize((max_width, new_h))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def normalize_coordinate(x: int, y: int, screen_w: int, screen_h: int):
    """
    GANZA spec: normalized = x / screen_width * 1000
    """
    return int(x / screen_w * 1000), int(y / screen_h * 1000)

def denormalize_coordinate(nx: int, ny: int, screen_w: int, screen_h: int):
    return int(nx / 1000 * screen_w), int(ny / 1000 * screen_h)
