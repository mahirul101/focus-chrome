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

// Load state from storage
async function loadState() {
  try {
    const data = await chrome.storage.local.get(['state', 'focusUrls']);
    if (data.state) {
      state = { ...state, ...data.state };
    }
    if (data.focusUrls) {
      state.focusUrls = data.focusUrls;
    }
    console.log('Background: State loaded', state);
    console.log('Background: Focus URLs', state.focusUrls);
  } catch (error) {
    console.error('Background: Error loading state:', error);
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
      notifyAllTabs();
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
  state.timeRemaining = 25 * 60;
  state.isBreak = false;
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
  } else {
    // Break completed, start new focus session
    state.isBreak = false;
    state.timeRemaining = 25 * 60;
    showNotification('Back to Focus!', 'Break is over. Time to focus again!');
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
  const stateWithTotalTime = {
    ...state,
    totalTime: state.isBreak ?
      (state.completedPomodoros % 4 === 0 && state.completedPomodoros > 0 ?
        state.longBreakDuration * 60 : 5 * 60) : 25 * 60
  };

  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateState',
      state: stateWithTotalTime
    }).catch(() => {
      // Ignore errors for tabs that can't receive messages
    });
  });
}

// Check if URL is in focus list
function isUrlFocused(url) {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    console.log('FocusBrowse: Checking URL:', hostname, 'against:', state.focusUrls);

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

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startFocus') {
    state.focusMode = true;
    state.timeRemaining = 25 * 60;
    state.isBreak = false;
    saveState();
    startTimer();
    notifyAllTabs();
    sendResponse({ success: true });
  } else if (message.action === 'stopFocus') {
    stopTimer();
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
    sendResponse({
      focusMode: state.focusMode,
      isFocused: isFocused,
      isBreak: state.isBreak,
      timeRemaining: state.timeRemaining,
      totalTime: state.isBreak ?
        (state.completedPomodoros % 4 === 0 ? state.longBreakDuration * 60 : 5 * 60) :
        25 * 60
    });
  }

  return true; // Keep message channel open for async response
});

// Update content scripts when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && state.focusMode) {
    chrome.tabs.sendMessage(tabId, {
      action: 'updateState',
      state: state
    }).catch(() => {
      // Ignore errors
    });
  }
});

// Also update when tabs become active
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (state.focusMode) {
    chrome.tabs.sendMessage(activeInfo.tabId, {
      action: 'updateState',
      state: state
    }).catch(() => {
      // Ignore errors
    });
  }
});

// Service worker startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Service worker starting up');
  loadState().then(() => {
    if (state.focusMode) {
      startTimer();
      notifyAllTabs();
    }
  });
});

// Service worker installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Background: Extension installed/updated');
  loadState().then(() => {
    if (state.focusMode) {
      startTimer();
      notifyAllTabs();
    }
  });
});

// Initialize immediately
console.log('Background: Service worker initializing');
loadState().then(() => {
  console.log('Background: Initialization complete');
  // If focus mode was active, restart timer
  if (state.focusMode) {
    startTimer();
    notifyAllTabs();
  }
}).catch((error) => {
  console.error('Background: Initialization failed:', error);
});