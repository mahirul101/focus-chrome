let state = {
  focusMode: false,
  timeRemaining: 25 * 60,
  isBreak: false,
  completedPomodoros: 0,
  focusUrls: [],
  longBreakDuration: 15,
  startTime: null
};

let timerInterval = null;
let stateLoaded = false;

// Load state from storage
async function loadState() {
  try {
    const data = await chrome.storage.local.get(['state', 'focusUrls']);
    console.log('Background: Loaded state from storage:', data);
    if (data.state) {
      state = { ...state, ...data.state };
    }
    if (data.focusUrls) {
      state.focusUrls = data.focusUrls;
    }
    stateLoaded = true;
  } catch (error) {
    console.error('Background: Error loading state:', error);
    stateLoaded = true; // Set to true even on error to prevent infinite waiting
  }
}

// Save state to storage
async function saveState() {
  await chrome.storage.local.set({ state });
}

// Start the timer
function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  state.startTime = Date.now();

  timerInterval = setInterval(async () => {
    if (state.timeRemaining > 0) {
      state.timeRemaining--;
      await saveState();

      // Only update the active tab with timer data
      notifyActiveTabTimer();
    } else {
      handleTimerComplete();
    }
  }, 1000);
}

// stop the timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  state.focusMode = false;
  // Don't reset timeRemaining - keep current progress
  // Don't reset isBreak - maintain current state
  saveState();
  notifyAllTabs();
}

async function handleTimerComplete() {
  if (!state.isBreak) {
    state.completedPomodoros++;
    const cycle = state.completedPomodoros % 4;

    state.isBreak = true;
    if (cycle === 0) {
      // Long break
      state.timeRemaining = state.longBreakDuration * 60;
      showNotification('Long Break Time!', `Great job! Take a ${state.longBreakDuration} minute break.`);
    } else {
      // Short break
      state.timeRemaining = 5 * 60;
      showNotification('Break Time!', 'Take a 5 minute break.');
    }
    // Break time started
    sendModeToSerialPage(4);
  } else {
    // Break completed, start new focus session
    state.isBreak = false;
    state.timeRemaining = 25 * 60;
    showNotification('Back to Focus!', 'Break is over. Time to focus again!');
    // Back to focus mode
    sendModeToSerialPage(1);
  }

  await saveState();
  notifyAllTabs();
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Notify all tabs about state changes
async function notifyAllTabs() {
  const tabs = await chrome.tabs.query({});

  tabs.forEach(tab => {
    if (tab.url) {
      // Calculate isFocused for each tab individually
      const isFocused = isUrlFocused(tab.url);

      const stateWithTotalTime = {
        ...state,
        isFocused: isFocused,
        totalTime: state.isBreak ?
          (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
            state.longBreakDuration * 60 : 5 * 60) : 25 * 60
      };

      chrome.tabs.sendMessage(tab.id, {
        action: 'updateState',
        state: stateWithTotalTime
      }).catch(() => {
        // Ignore errors for tabs that can't receive messages
      });
    }
  });
}

// Ultra-lightweight: only update active tab with timer data
async function notifyActiveTabTimer() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (activeTab && activeTab.url) {
      // Only send timer data to active tab
      const timerData = {
        timeRemaining: state.timeRemaining,
        totalTime: state.isBreak ?
          (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
            state.longBreakDuration * 60 : 5 * 60) : 25 * 60
      };

      chrome.tabs.sendMessage(activeTab.id, {
        action: 'updateTimer',
        timer: timerData
      }).catch(() => {
        // Ignore errors
      });
    }
  } catch (error) {
    console.error('Background: Error notifying active tab timer:', error);
  }
}

// Check if URL is in focus list
function isUrlFocused(url) {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    if (hostname === 'mahirul101.github.io') {
      return false;
    }

    const isFocused = state.focusUrls.some(focusUrl => {
      // Remove protocol and www from focus URL
      const cleanFocusUrl = focusUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] // Get just the domain part
        .toLowerCase()
        .trim();

      if (!cleanFocusUrl) return false;

      // Exact match
      if (hostname === cleanFocusUrl) {
        return true;
      }

      // Check if hostname is a subdomain of the focus URL
      // This means the focus URL must be a suffix of hostname with a dot before it
      // e.g., docs.google.com matches api.docs.google.com but NOT drive.google.com
      if (hostname.endsWith('.' + cleanFocusUrl)) {
        return true;
      }

      // If focus URL is a base domain (2 parts like google.com), match all subdomains
      // e.g., google.com matches docs.google.com, drive.google.com, etc.
      const focusUrlParts = cleanFocusUrl.split('.');
      if (focusUrlParts.length === 2 && hostname.endsWith('.' + cleanFocusUrl)) {
        return true;
      }

      return false;
    });

    return isFocused;
  } catch (e) {
    console.error('FocusBrowse: URL check error:', e);
    return false;
  }
}


//talk to arduino
function sendModeToSerialPage(mode) {
  const serialTabUrl = "https://mahirul101.github.io/";
  const message = { mode: mode.toString() };
  console.log(mode)
  // Find the tab and post the message
  chrome.tabs.query({}, (tabs) => {
    const serialTab = tabs.find(tab => tab.url && tab.url.startsWith(serialTabUrl));
    if (serialTab && serialTab.id) {
      chrome.scripting.executeScript({
        target: { tabId: serialTab.id },
        func: (msg) => window.postMessage(msg, "*"),
        args: [message]
      });
    } else {
      console.warn("Serial tab not found.");
    }
  });
}

// Inject content scripts into existing tabs (for extension reload)
async function injectContentScriptsIntoExistingTabs() {
  try {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      // Skip chrome:// and extension pages
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });

          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          });

        } catch (error) {
          console.log('Background: Could not inject into tab:', tab.url, error);
        }
      }
    }
  } catch (error) {
    console.error('Background: Error injecting content scripts:', error);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'startFocus') {

    state.focusMode = true;
    // Only reset timer if it's completed (0) or this is the first time
    if (state.timeRemaining <= 0) {
      state.timeRemaining = 25 * 60;
      state.isBreak = false;
    }

    // Otherwise resume with current timeRemaining and isBreak state
    saveState();
    startTimer();
    notifyAllTabs();

    // Check current active tab and send appropriate mode
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const isFocused = isUrlFocused(tabs[0].url);
        if (state.isBreak) {
          sendModeToSerialPage(4); // Break mode
        } else if (isFocused) {
          sendModeToSerialPage(1); // Focused
        } else {
          sendModeToSerialPage(2); // Distracted
        }
      } else {
        // Fallback to focused mode if can't determine tab
        sendModeToSerialPage(1);
      }
    });

    sendResponse({ success: true });

  } else if (message.action === 'stopFocus') {
    stopTimer();
    sendModeToSerialPage(0);
    sendResponse({ success: true });
  } else if (message.action === 'getState') {
    sendResponse(state);
  } else if (message.action === 'reloadUrls') {
    // Reload URLs from storage
    chrome.storage.local.get(['focusUrls']).then((data) => {
      state.focusUrls = data.focusUrls || [];
      notifyAllTabs();
      if (sendResponse) {
        sendResponse({ success: true });
      }
    }).catch((error) => {
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // Keep channel open for async
  } else if (message.action === 'checkUrl') {
    const isFocused = isUrlFocused(message.url);

    // Only send mode to serial page if we're actually in focus mode
    if (state.focusMode && !isFocused) {
      sendModeToSerialPage(2);
    }

    sendResponse({
      focusMode: state.focusMode,
      isFocused: isFocused,
      isBreak: state.isBreak,
      timeRemaining: state.timeRemaining,
      totalTime: state.isBreak ?
        (state.completedPomodoros % 4 === 0 ? state.longBreakDuration * 60 : 5 * 60) :
        25 * 60
    });
  } else if (message.action === 'resetProgress') {
    // Stop any running timer
    stopTimer();

    // Reset all progress
    state.focusMode = false;
    state.timeRemaining = 25 * 60; // Reset to 25 minutes
    state.isBreak = false;
    state.completedPomodoros = 0; // Reset completed sessions

    // Save the reset state and respond
    saveState().then(() => {
      // Notify all tabs and send mode to serial page
      notifyAllTabs();
      sendModeToSerialPage(0); // Turn off LED

      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Background: Error saving reset state:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keep channel open for async response
  }

  return true; // Keep message channel open for async response
});

// Update content scripts when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && state.focusMode && tab.url) {
    // Only check focus for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs[0] && activeTabs[0].id === tabId) {
        // This is the active tab, check focus and send LED mode
        const isFocused = isUrlFocused(tab.url);

        // Send appropriate LED mode based on focus state
        if (state.isBreak) {
          sendModeToSerialPage(4); // Break mode
        } else if (isFocused) {
          sendModeToSerialPage(1); // Focused
        } else {
          sendModeToSerialPage(2); // Distracted
        }

        const stateWithTotalTime = {
          ...state,
          isFocused: isFocused,
          totalTime: state.isBreak ?
            (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
              state.longBreakDuration * 60 : 5 * 60) : 25 * 60
        };

        chrome.tabs.sendMessage(tabId, {
          action: 'updateState',
          state: stateWithTotalTime
        }).catch(() => {
          // Ignore errors
        });
      } else {
        // Not the active tab, just send basic state
        const basicState = {
          ...state,
          totalTime: state.isBreak ?
            (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
              state.longBreakDuration * 60 : 5 * 60) : 25 * 60
        };

        chrome.tabs.sendMessage(tabId, {
          action: 'updateState',
          state: basicState
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }
});

// Also update when tabs become active
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (state.focusMode) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab && tab.url) {
        const isFocused = isUrlFocused(tab.url);

        // Send appropriate mode based on focus state
        if (state.isBreak) {
          sendModeToSerialPage(4);
        } else if (isFocused) {
          sendModeToSerialPage(1);
        } else {
          sendModeToSerialPage(2);
        }

        // Send state update with isFocused calculated for this tab
        const stateWithTotalTime = {
          ...state,
          isFocused: isFocused,
          totalTime: state.isBreak ?
            (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
              state.longBreakDuration * 60 : 5 * 60) : 25 * 60
        };

        chrome.tabs.sendMessage(activeInfo.tabId, {
          action: 'updateState',
          state: stateWithTotalTime
        }).catch(() => {
          // Ignore errors
        });
      }
    });
  }
});

// Service worker startup handler
chrome.runtime.onStartup.addListener(() => {
  loadState().then(() => {
    console.log('Background: State loaded on startup');
  });
});

// Service worker installation handler
chrome.runtime.onInstalled.addListener(() => {
  loadState().then(async () => {
    console.log('Background: State loaded on install/update');
    // Inject content scripts into existing tabs after extension reload
    await injectContentScriptsIntoExistingTabs();
  });
});

// Initialize immediately
loadState().then(() => {
  console.log('Background: Initialization complete');
  // Don't automatically restart timer - user should manually start focus mode
  // Just load the state, timer will be started when user clicks "Start Focus"
}).catch((error) => {
  console.error('Background: Initialization failed:', error);
});