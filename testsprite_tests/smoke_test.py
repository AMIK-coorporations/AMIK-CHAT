
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print("Navigating to http://localhost:3000")
            await page.goto("http://localhost:3000", timeout=60000)
            title = await page.title()
            print(f"Page title: {title}")
            
            # Check for generic elements to verify app loaded
            # Maybe check for 'AMIK CHAT' text or login link
            content = await page.content()
            if "AMIK CHAT" in content or "login" in content.lower():
                 print("App loaded successfully")
            else:
                 print("App load suspicious - content check failed")
                 
            await page.screenshot(path="testsprite_tests/home.png")
            print("Screenshot saved to testsprite_tests/home.png")

        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
