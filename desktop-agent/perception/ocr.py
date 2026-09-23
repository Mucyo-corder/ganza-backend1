def run_ocr(image):
    try:
        import pytesseract
        return pytesseract.image_to_string(image)
    except Exception as e:
        return f"OCR_NOT_AVAILABLE: {e}"
