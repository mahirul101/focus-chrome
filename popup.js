let state = {
  focusMode: false,
  timeRemaining: 25 * 60,
  isBreak: false,
  completedPomodoros: 0,
  focusUrls: [],
  longBreakDuration: 15
};

// Load state from storage
async function loadState() {
  try {
    if (!chrome.storage || !chrome.storage.local) {
      throw new Error('Chrome storage API not available');
    }

    const data = await chrome.storage.local.get(['state', 'focusUrls']);
    if (data.state) {
      state = { ...state, ...data.state };
    }
    if (data.focusUrls) {
      state.focusUrls = data.focusUrls;
    }
    console.log('Popup: Loaded state', state);
    updateUI();
    await loadFocusUrls();
  } catch (error) {
    console.error('Popup: Error loading state:', error);
    updateUI(); // Still update UI even if loading fails
    await loadFocusUrls(); // Still try to load URLs
  }
}

// Save state to storage
async function saveState() {
  await chrome.storage.local.set({ state });
}

// Update UI elements
function updateUI() {
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  document.getElementById('timer').textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const cycle = state.completedPomodoros % 4;
  document.getElementById('currentCycle').textContent = `${cycle}/4`;
  document.getElementById('completedSessions').textContent = state.completedPomodoros;

  if (state.focusMode) {
    if (state.isBreak) {
      document.getElementById('sessionInfo').textContent =
        cycle === 0 && state.completedPomodoros > 0 ? 'Long Break 🌟' : 'Short Break ☕';
    } else {
      document.getElementById('sessionInfo').textContent = 'Focus Time 🎯';
    }
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';
  } else {
    document.getElementById('sessionInfo').textContent = 'Ready to start';
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('stopBtn').style.display = 'none';
  }

  document.getElementById('longBreak').value = state.longBreakDuration;
}

// Load and display focus URLs
async function loadFocusUrls() {
  try {
    const data = await chrome.storage.local.get(['focusUrls']);
    state.focusUrls = data.focusUrls || [];

    const list = document.getElementById('focusList');
    if (!list) {
      console.error('Popup: Focus list element not found');
      return;
    }

    list.innerHTML = '';

    if (state.focusUrls.length === 0) {
      return;
    }

    state.focusUrls.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'focus-item';
      item.innerHTML = `
        <span title="${url}">${url}</span>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;
      list.appendChild(item);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.target.dataset.index);
        state.focusUrls.splice(index, 1);
        // Save to storage
        await chrome.storage.local.set({ focusUrls: state.focusUrls });

        // Notify background script to reload URLs
        try {
          await chrome.runtime.sendMessage({ action: 'reloadUrls' });
        } catch (error) {
          console.error('Popup: Error notifying background script:', error);
        }

        // Reload display
        await loadFocusUrls();
      });
    });
  } catch (error) {
    console.error('Popup: Error loading focus URLs:', error);
  }
}

// Add URL to focus list
document.getElementById('addUrl').addEventListener('click', async () => {
  const input = document.getElementById('urlInput');
  let url = input.value.trim();

  if (url) {
    // Clean up URL - remove protocol and www, keep the domain structure as entered
    url = url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]  // Get just the domain (remove any paths)
      .split('?')[0]  // Remove query parameters
      .toLowerCase()
      .trim();

    if (url && !state.focusUrls.includes(url)) {
      console.log('Popup: Adding URL:', url);
      state.focusUrls.push(url);

      // Save to storage
      await chrome.storage.local.set({ focusUrls: state.focusUrls });

      // Clear input
      input.value = '';

      // Notify background script to reload URLs
      try {
        await chrome.runtime.sendMessage({ action: 'reloadUrls' });
      } catch (error) {
        console.error('Popup: Error notifying background script:', error);
      }

      // Reload display
      await loadFocusUrls();
    } else if (state.focusUrls.includes(url)) {
      input.value = '';
    }
  }
});

// Allow adding URL with Enter key
document.getElementById('urlInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addUrl').click();
  }
});

// Start focus mode
document.getElementById('startBtn').addEventListener('click', async () => {
  state.focusMode = true;
  state.timeRemaining = 25 * 60;
  state.isBreak = false;
  await saveState();

  // Send message to background to start timer
  chrome.runtime.sendMessage({ action: 'startFocus' });
  updateUI();
});

// Stop focus mode
document.getElementById('stopBtn').addEventListener('click', async () => {
  state.focusMode = false;
  state.timeRemaining = 25 * 60;
  state.isBreak = false;
  await saveState();

  chrome.runtime.sendMessage({ action: 'stopFocus' });
  updateUI();
});

// Update long break duration
document.getElementById('longBreak').addEventListener('change', async (e) => {
  state.longBreakDuration = parseInt(e.target.value);
  await saveState();
});

// Listen for timer updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTimer') {
    state = { ...state, ...message.state };
    updateUI();
  }
});

// Update UI every second while popup is open
setInterval(() => {
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (response) {
        state = { ...state, ...response };
        updateUI();
      }
    });
  }
}, 1000);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup: DOM loaded, initializing...');
  try {
    if (chrome.storage && chrome.storage.local) {
      await loadState();
    } else {
      console.error('Popup: Chrome storage API not available');
      updateUI(); // Still show UI even if storage fails
    }
  } catch (error) {
    console.error('Popup: Initialization error:', error);
    updateUI(); // Still show UI even if initialization fails
  }
});

// Fallback initialization (in case DOMContentLoaded already fired)
if (document.readyState === 'loading') {
  // DOM hasn't loaded yet
} else {
  // DOM is already loaded
  console.log('Popup: DOM already loaded, initializing...');
  setTimeout(async () => {
    try {
      if (chrome.storage && chrome.storage.local) {
        await loadState();
      } else {
        console.error('Popup: Chrome storage API not available');
        updateUI();
      }
    } catch (error) {
      console.error('Popup: Fallback initialization error:', error);
      updateUI();
    }
  }, 100);
}