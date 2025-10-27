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

async function loadState() {
  const data = await chrome.storage.local.get(['state', 'focusUrls']);
  if (data.state) {
    state = { ...state, ...data.state };
  }
  if (data.focusUrls) {
    state.focusUrls = data.focusUrls;
  }
}

async function saveState() {
  await chrome.storage.local.set({ state });
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  state.startTime = Date.now();

  timerInterval = setInterval(async () => {
    if (state.timeRemaining > 0) {
      state.timeRemaining--;
      await saveState();

      // Notify content scripts about the timer update
      notifyAllTabs();
    } else {
      // Timer completed
      handleTimerComplete();
    }
  }, 1000);
}

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

// Handle timer completion
async function handleTimerComplete() {
  if (!state.isBreak) {
    state.completedPomodoros++;
    const cycle = state.completedPomodoros % 4;

    state.isBreak = true;
    if (cycle === 0) {
      state.timeRemaining = state.longBreakDuration * 60;
      showNotification('Long Break Time!', `Great job! Take a ${state.longBreakDuration} minute break.`);
    } else {
      state.timeRemaining = 5 * 60;
      showNotification('Break Time!', 'Take a 5 minute break.');
    }
  } else {
    state.isBreak = false;
    state.timeRemaining = 25 * 60;
    showNotification('Back to Focus!', 'Break is over. Time to focus again!');
  }

  await saveState();
  notifyAllTabs();
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

async function notifyAllTabs() {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateState',
      state: state
    }).catch(() => {

    });
  });
}

function isUrlFocused(url) {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    const isFocused = state.focusUrls.some(focusUrl => {
      // Remove protocol and www from focus URL
      const cleanFocusUrl = focusUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] // Get just the domain part
        .toLowerCase()
        .trim();

      if (!cleanFocusUrl) return false;

      // If focus URL is specific (has subdomain), match exactly or with further subdomains
      // e.g., docs.google.com matches docs.google.com and api.docs.google.com
      if (cleanFocusUrl.split('.').length > 2) {
        return hostname === cleanFocusUrl ||
          hostname.endsWith('.' + cleanFocusUrl);
      }

      // If focus URL is a base domain (e.g., google.com), match it and all subdomains
      // e.g., google.com matches google.com, docs.google.com, drive.google.com
      return hostname === cleanFocusUrl ||
        hostname.endsWith('.' + cleanFocusUrl);
    });

    return isFocused;
  } catch (e) {
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

// Initialize
loadState().then(() => {
  // If focus mode was active, restart timer
  if (state.focusMode) {
    startTimer();
    notifyAllTabs();
  }
});