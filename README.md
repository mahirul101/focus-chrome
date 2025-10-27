# ☕ FocusBrowse - Chrome Extension

A Chrome extension that helps you maintain focus while studying using the Pomodoro Technique.

## Features

- **Pomodoro Timer**: 25-minute focus sessions with 5-minute breaks
- **Long Breaks**: After 4 completed cycles, take a 15-30 minute break (customizable)
- **Focus Sites**: Define which websites are study-related
- **Visual Warnings**: Non-focus tabs show a warning bar at the top
- **Dim Effect**: Non-focus tabs are slightly dimmed but still usable
- **Coffee Mug Indicator**: Animated coffee mug fills up as your study session progresses
- **Session Tracking**: See how many Pomodoros you've completed and your current cycle

## Installation

1. **Download the Extension Files**
   - Save all the following files in a folder (e.g., `focusbrowse`):
     - `manifest.json`
     - `popup.html`
     - `popup.js`
     - `background.js`
     - `content.js`
     - `content.css`

2. **Create Icons Folder**
   - Create a folder named `icons` inside your extension folder
   - Add three icon files (you can create simple icons or use placeholders):
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   
   **Quick Icon Creation**: You can use any image editor or online tool to create a simple coffee mug icon in these three sizes. Alternatively, use a solid color square as a placeholder.

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select your `focusbrowse` folder
   - The extension should now appear in your extensions list!

## Usage

### Setting Up Focus Sites

1. Click the FocusBrowse extension icon in your Chrome toolbar
2. In the "Focus Sites" section, enter the domain of websites you need for studying
   - **Base domain** (e.g., `google.com`) - matches ALL Google services
   - **Specific subdomain** (e.g., `docs.google.com`) - matches ONLY Google Docs
   - You don't need to include `https://`, `www.`, or any paths
3. Click "Add" to add each site to your focus list
4. **Add as many sites as you need** - just keep adding them one by one
5. Remove sites by clicking the "Remove" button next to them

**Example Focus List:**
- `docs.google.com` (for Google Docs)
- `notion.so` (for Notion notes)
- `stackoverflow.com` (for coding help)
- `github.com` (for repositories)
- `coursera.org` (for online courses)

**How Domain Matching Works:**
- **`google.com`** → Matches `google.com`, `docs.google.com`, `drive.google.com`, `mail.google.com`, etc.
- **`docs.google.com`** → Matches ONLY `docs.google.com` and its subdomains (like `api.docs.google.com`)
- **Be as specific or broad as you want!**

### Starting a Focus Session

1. Click the FocusBrowse icon
2. Adjust the "Long Break Duration" if desired (15-30 minutes)
3. Click "Start Focus" to begin your first 25-minute study session
4. A coffee mug will appear in the top-right corner of all tabs
5. On non-focus tabs, you'll see a warning bar at the top

### During Focus Mode

- **Focus Tabs**: Your designated study sites work normally with the coffee mug indicator
- **Non-Focus Tabs**: Show a warning message, slightly dimmed, but still functional
- **Coffee Mug**: Gradually fills up as time progresses, showing your session progress
- **Timer**: Displays remaining time in the coffee mug badge

### Breaks

- After 25 minutes, you'll get a notification for a 5-minute break
- After 4 completed Pomodoros, you'll get a longer break (15-30 minutes)
- During breaks, the warning bars and dim effects are removed
- The extension automatically transitions between focus and break periods

### Stopping a Session

- Click the extension icon
- Click "Stop" to end your current session
- All warnings and effects will be removed immediately

## Tips for Best Results

1. **Choose Your Specificity**: 
   - Add `google.com` if you need ALL Google services
   - Add `docs.google.com` if you only need Google Docs
   - Be as specific or broad as your study needs require
2. **Keep Focus List Relevant**: Add only the sites you genuinely need for your current study session
3. **Honor the Breaks**: Taking breaks is essential for maintaining long-term focus
4. **Use Consistently**: The Pomodoro Technique works best when used regularly

## File Structure

```
focusbrowse/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic and UI handling
├── background.js         # Timer logic and state management
├── content.js            # Page modification script
├── content.css           # Styles for warnings and coffee mug
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Troubleshooting

**Extension not loading?**
- Make sure all files are in the correct locations
- Check that you have the `icons` folder with all three icon files
- Try reloading the extension from `chrome://extensions/`

**Timer not working?**
- Refresh the page after starting focus mode
- Check that you've granted necessary permissions

**Sites not being recognized?**
- The extension respects your specificity:
  - `google.com` matches ALL Google services
  - `docs.google.com` matches ONLY Google Docs
- Make sure you've entered just the domain without `https://`, `www.`, or any paths
- Try being more specific (add subdomain) or more broad (remove subdomain) based on your needs

**Coffee mug not appearing?**
- Refresh the page after starting focus mode
- Some special pages (like `chrome://` URLs) won't show the coffee mug

## Privacy

This extension stores all data locally on your device. No information is sent to external servers.

## Support

For issues or feature requests, feel free to modify the code to suit your needs!

---

**Happy Studying! ☕📚**