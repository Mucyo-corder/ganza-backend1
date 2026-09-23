class BrowserAgent:
    """
    Browser agent — DOM/API preferred; VLM fallback.
    """
    def __init__(self):
        self.playwright = None

    async def open(self, url: str):
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch()
                page = await browser.new_page()
                await page.goto(url)
                content = await page.content()
                await browser.close()
                return {"success": True, "data": content}
        except Exception as e:
            return {"success": False, "error": f"NOT_SUPPORTED browser open failed: {e}"}
