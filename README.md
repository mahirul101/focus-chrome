# ☕ FocusBrowse - Chrome Extension

A Chrome extension that helps you maintain focus while studying using the Pomodoro Technique, with **LED integration via a native host**.

## Features

* **Pomodoro Timer**: 25-minute focus sessions with 5-minute breaks
* **Long Breaks**: After 4 completed cycles, take a 15-30 minute break (customizable)
* **Focus Sites**: Define which websites are study-related
* **Visual Warnings**: Non-focus tabs show a warning bar at the top
* **Dim Effect**: Non-focus tabs are slightly dimmed but still usable
* **Coffee Mug Indicator**: Animated coffee mug fills up as your study session progresses
* **Session Tracking**: See how many Pomodoros you've completed and your current cycle
* **LED Integration**: Native host allows controlling an Arduino/LED to indicate focus/break status

---

## Folder Structure

* `extension/` → Chrome extension source (this is the folder to load in Chrome)
* `host/` → Native host script and installer for LED integration

---

## Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mahirul101/focus-chrome.git
cd focus-chrome
```

---

### 2️⃣ Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from the repository
5. Chrome will display the **extension ID** under the extension name — **copy this ID**

> The extension ID is unique per user and is required for the native host setup.

---

### 3️⃣ Install the Native Host (LED Integration)

Open a terminal or command prompt:

```bash
cd host
python3 install-host.py <extension-id>
```

* Replace `<extension-id>` with the ID you copied from Chrome.
* This will:

  * Detect Python 3
  * Make `focus-host.py` executable (macOS/Linux)
  * Create the Chrome native messaging manifest for your extension

> **Note:** Python must be installed.

---

## Usage

### Setting Up Focus Sites

1. Click the FocusBrowse extension icon in your Chrome toolbar
2. In the "Focus Sites" section, enter the domain of websites you need for studying

   * **Base domain** (e.g., `google.com`) - matches all Google services
   * **Specific subdomain** (e.g., `docs.google.com`) - matches only Google Docs
   * You don't need to include `https://`, `www.`, or any paths
3. Click "Add" to add each site to your focus list
4. Remove sites by clicking the "Remove" button next to them

---

### Starting a Focus Session

1. Click the FocusBrowse icon
2. Adjust the "Long Break Duration" if desired (15-30 minutes)
3. Click **Start Focus** to begin your first 25-minute study session
4. A coffee mug will appear in the top-right corner of all tabs
5. If your LED hardware is connected, it will indicate focus mode
6. Non-focus tabs will show a warning bar at the top

---

### During Focus Mode

* **Focus Tabs**: Your designated study sites work normally with the coffee mug indicator
* **Non-Focus Tabs**: Show a warning message, slightly dimmed, but still functional
* **Coffee Mug**: Gradually fills up as time progresses
* **LED**: Turns on or changes color to indicate focus/break status
* **Timer**: Displays remaining time in the coffee mug badge

---

### Breaks

* After 25 minutes, you'll get a notification for a 5-minute break
* After 4 completed Pomodoros, you'll get a longer break (15-30 minutes)
* During breaks, the warning bars, dim effects, and LED indicate break mode
* The extension automatically transitions between focus and break periods

---

### Stopping a Session

* Click the extension icon
* Click **Stop** to end your current session
* All warnings, effects, and LED indicators are removed immediately

---

## Quick Test

* After installing the native host and loading the extension, you can test communication with the host by clicking the test button in the extension (if available).
* A popup like the following confirms communication:

```
✅ Host says: {"status":"✅ Test received focus"}
```

---

**Happy Studying! ☕📚**

