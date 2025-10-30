let state = {
  focusMode: false,
  timeRemaining: 25 * 60,
  isBreak: false,
  completedPomodoros: 0,
  focusUrls: [],
  longBreakDuration: 15
};


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
  console.log('Popup: Add URL button clicked');
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
      console.log('Popup: URL already exists:', url);
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
  // Don't modify local state - let background script handle it
  // Just send the start message and let periodic updates sync the state
  chrome.runtime.sendMessage({ action: 'startFocus' });

  // Immediately get the updated state from background
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getState' }, resolve);
    });

    if (response) {
      state = response;
      updateUI();
    }
  } catch (error) {
    console.error('Popup: Error getting state after start:', error);
  }
});

// Stop focus mode
document.getElementById('stopBtn').addEventListener('click', async () => {
  // Don't modify local state - let background script handle it
  // Just send the stop message and let periodic updates sync the state
  chrome.runtime.sendMessage({ action: 'stopFocus' });

  // Immediately get the updated state from background
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getState' }, resolve);
    });

    if (response) {
      state = response;
      updateUI();
    }
  } catch (error) {
    console.error('Popup: Error getting state after stop:', error);
  }
});

// Update long break duration
document.getElementById('longBreak').addEventListener('change', async (e) => {
  state.longBreakDuration = parseInt(e.target.value);
  await saveState();
});

// LED Integration button
document.getElementById('ledIntegrationBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://mahirul101.github.io' });
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Reset all progress? This will reset the timer, completed sessions, and cycles.')) {
    try {
      await chrome.runtime.sendMessage({ action: 'resetProgress' });

      // Immediately get the updated state from background
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getState' }, resolve);
      });

      if (response) {
        state = response;
        updateUI();
      }
    } catch (error) {
      console.error('Popup: Error resetting progress:', error);
    }
  }
});

async function loadStateFromBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (response) {
        state = response;
        updateUI();
        resolve();
      } else {
        console.error('Popup: Failed to load state from background');
        resolve();
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup: DOM loaded, initializing...');
  try {
    if (chrome.storage && chrome.storage.local) {
      await loadStateFromBackground();
      await loadFocusUrls(); // Load and display focus URLs

      // Start periodic timer updates for the popup
      startTimerUpdates();
    } else {
      console.error('Popup: Chrome storage API not available');
      updateUI(); // Still show UI even if storage fails
    }
  } catch (error) {
    console.error('Popup: Initialization error:', error);
    updateUI(); // Still show UI even if initialization fails
  }
});

// Start periodic timer updates
let timerUpdateInterval = null;

function startTimerUpdates() {
  // Clear any existing interval
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
  }

  // Update timer immediately first
  updateTimerDisplay();

  // Update timer every second when popup is open
  timerUpdateInterval = setInterval(async () => {
    await updateTimerDisplay();
  }, 1000);
}

// Separate function for timer updates
async function updateTimerDisplay() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getState' }, resolve);
    });

    if (response) {
      console.log('Popup: Received timer state:', response);
      state = response;
      updateUI();
    }
  } catch (error) {
    console.error('Popup: Error getting state:', error);
  }
}

// Fallback initialization (in case DOMContentLoaded already fired)
if (document.readyState === 'loading') {
  // DOM hasn't loaded yet
} else {
  // DOM is already loaded
  console.log('Popup: DOM already loaded, initializing...');
  setTimeout(async () => {
    try {
      if (chrome.storage && chrome.storage.local) {
        await loadStateFromBackground();
        await loadFocusUrls(); // Load and display focus URLs

        // Start periodic timer updates for the popup
        startTimerUpdates();
      } else {
        console.error('Popup: Chrome storage API not available');
        updateUI();
      }
    } catch (error) {
      console.error('Popup: Fallback initialization error:', error);
      updateUI();
    }
  }, 100);
  SerialCommunicate();
}
