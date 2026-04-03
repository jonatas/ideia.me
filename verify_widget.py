from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://127.0.0.1:8000/fast-ast-folding-token-savings.html')
    time.sleep(2) # wait for render

    # Scroll down to make mermaid diagram visible
    page.evaluate("window.scrollTo(0, 500)")
    time.sleep(1)
    page.screenshot(path='screenshot_mermaid.png')

    # Scroll down to make interactive widget visible
    page.evaluate("window.scrollTo(0, 1000)")
    time.sleep(1)
    page.screenshot(path='screenshot_widget_full.png')

    # Click the toggle button to see the folded state
    page.click('#toggle-fold-btn')
    time.sleep(1)
    page.screenshot(path='screenshot_widget_folded.png')

    browser.close()