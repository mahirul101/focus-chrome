let currentState = {
  focusMode: false,
  isFocused: true,
  isBreak: false,
  timeRemaining: 0,
  totalTime: 25 * 60
};

let warningBar = null;
let coffeeMug = null;

// Create warning bar for non-focus tabs
function createWarningBar() {
  // Don't recreate if it already exists
  if (warningBar && document.body.contains(warningBar)) {
    // Just update the class if needed
    const isBreak = currentState.isBreak;
    if (isBreak && !warningBar.classList.contains('break-time')) {
      warningBar.classList.add('break-time');
    } else if (!isBreak && warningBar.classList.contains('break-time')) {
      warningBar.classList.remove('break-time');
    }
    return;
  }

  const isBreak = currentState.isBreak;
  const icon = isBreak ? '☕' : '⚠️';
  const text = isBreak
    ? 'Break Time!'
    : 'Focus on study sites';

  warningBar = document.createElement('div');
  warningBar.id = 'focusbrowse-warning';
  if (isBreak) {
    warningBar.classList.add('break-time');
  }
  warningBar.innerHTML = `
    <div class="warning-content">
      <span class="warning-icon">${icon}</span>
      <span class="warning-text">${text}</span>
    </div>
  `;

  document.body.appendChild(warningBar);
}

// Remove warning bar
function removeWarningBar() {
  if (warningBar) {
    warningBar.remove();
    warningBar = null;
  }
}

// Create coffee mug indicator
function createCoffeeMug() {
  // Don't recreate if it already exists
  if (coffeeMug && document.body.contains(coffeeMug)) {
    return;
  }

  // Wait for body to be ready
  if (!document.body) {
    setTimeout(createCoffeeMug, 100);
    return;
  }

  coffeeMug = document.createElement('div');
  coffeeMug.id = 'focusbrowse-mug';
  coffeeMug.title = 'Click to see timer details';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mug-svg');
  svg.setAttribute('viewBox', '0 0 100 100');

  // Mug body
  const mugBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  mugBody.setAttribute('x', '20');
  mugBody.setAttribute('y', '30');
  mugBody.setAttribute('width', '50');
  mugBody.setAttribute('height', '55');
  mugBody.setAttribute('fill', '#fff');
  mugBody.setAttribute('stroke', '#333');
  mugBody.setAttribute('stroke-width', '3');
  mugBody.setAttribute('rx', '5');

  // Coffee fill
  const coffeeFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  coffeeFill.setAttribute('class', 'coffee-fill');
  coffeeFill.setAttribute('x', '23');
  coffeeFill.setAttribute('y', '33');
  coffeeFill.setAttribute('width', '44');
  coffeeFill.setAttribute('height', '0');
  coffeeFill.setAttribute('fill', '#8B4513');
  coffeeFill.setAttribute('rx', '3');

  // Handle
  const handle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  handle.setAttribute('d', 'M 70 45 Q 85 45 85 60 Q 85 75 70 75');
  handle.setAttribute('fill', 'none');
  handle.setAttribute('stroke', '#333');
  handle.setAttribute('stroke-width', '3');
  handle.setAttribute('stroke-linecap', 'round');

  // Steam group
  const steamGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  steamGroup.setAttribute('class', 'steam');

  const steam1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  steam1.setAttribute('d', 'M 35 25 Q 33 15 35 10');
  steam1.setAttribute('stroke', '#999');
  steam1.setAttribute('stroke-width', '2');
  steam1.setAttribute('fill', 'none');
  steam1.setAttribute('stroke-linecap', 'round');
  steam1.setAttribute('opacity', '0.6');

  const steam2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  steam2.setAttribute('d', 'M 45 25 Q 47 15 45 8');
  steam2.setAttribute('stroke', '#999');
  steam2.setAttribute('stroke-width', '2');
  steam2.setAttribute('fill', 'none');
  steam2.setAttribute('stroke-linecap', 'round');
  steam2.setAttribute('opacity', '0.6');

  const steam3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  steam3.setAttribute('d', 'M 55 25 Q 53 15 55 10');
  steam3.setAttribute('stroke', '#999');
  steam3.setAttribute('stroke-width', '2');
  steam3.setAttribute('fill', 'none');
  steam3.setAttribute('stroke-linecap', 'round');
  steam3.setAttribute('opacity', '0.6');

  steamGroup.appendChild(steam1);
  steamGroup.appendChild(steam2);
  steamGroup.appendChild(steam3);

  svg.appendChild(mugBody);
  svg.appendChild(coffeeFill);
  svg.appendChild(handle);
  svg.appendChild(steamGroup);

  coffeeMug.appendChild(svg);
  document.body.appendChild(coffeeMug);
}

// Remove coffee mug
function removeCoffeeMug() {
  if (coffeeMug) {
    coffeeMug.remove();
    coffeeMug = null;
  }
}

// Update coffee mug fill
function updateCoffeeMug() {
  if (!coffeeMug) return;

  const progress = currentState.totalTime > 0 ?
    1 - (currentState.timeRemaining / currentState.totalTime) : 0;

  const maxHeight = 49;
  const fillHeight = maxHeight * progress;

  const fill = coffeeMug.querySelector('.coffee-fill');
  if (fill) {
    fill.setAttribute('height', fillHeight);
    fill.setAttribute('y', 33 + maxHeight - fillHeight);

    // Remove existing progress classes
    fill.classList.remove('quarter-full', 'half-full', 'three-quarter-full', 'nearly-full');

    // Add appropriate progress class for visual effects
    if (progress >= 0.9) {
      fill.classList.add('nearly-full');
    } else if (progress >= 0.75) {
      fill.classList.add('three-quarter-full');
    } else if (progress >= 0.5) {
      fill.classList.add('half-full');
    } else if (progress >= 0.25) {
      fill.classList.add('quarter-full');
    }

    // Add visual feedback for progress milestones
    const percentComplete = Math.round(progress * 100);
    const timeFormatted = formatTime(currentState.timeRemaining);
    const totalTimeFormatted = formatTime(currentState.totalTime);

    coffeeMug.title = `Study Progress: ${percentComplete}% complete\n${timeFormatted} / ${totalTimeFormatted} remaining`;

    // Add color changes as mug fills up (progressive darkening)
    if (progress < 0.25) {
      fill.setAttribute('fill', '#D2B48C'); // Tan
    } else if (progress < 0.5) {
      fill.setAttribute('fill', '#CD853F'); // Peru
    } else if (progress < 0.75) {
      fill.setAttribute('fill', '#8B4513'); // Saddle brown
    } else if (progress < 0.9) {
      fill.setAttribute('fill', '#654321'); // Dark brown
    } else {
      fill.setAttribute('fill', '#2F1B14'); // Very dark brown - almost done!
    }

    // Add bubbles/foam effect when nearly full
    if (progress > 0.85) {
      const foam = coffeeMug.querySelector('.foam') || createFoamEffect();
      if (foam) {
        foam.style.opacity = Math.min(0.9, (progress - 0.85) / 0.15);
      }
    } else {
      const foam = coffeeMug.querySelector('.foam');
      if (foam) {
        foam.style.opacity = '0';
      }
    }
  }
}

// Create foam effect for nearly full mug
function createFoamEffect() {
  if (!coffeeMug) return null;

  const svg = coffeeMug.querySelector('.mug-svg');
  if (!svg) return null;

  const foam = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  foam.setAttribute('class', 'foam');
  foam.setAttribute('cx', '45');
  foam.setAttribute('cy', '36');
  foam.setAttribute('rx', '20');
  foam.setAttribute('ry', '3');
  foam.setAttribute('fill', '#F5F5DC');
  foam.setAttribute('opacity', '0');

  svg.appendChild(foam);
  return foam;
}

// Format time for display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Apply dim effect to page
function applyDimEffect() {
  document.body.classList.add('focusbrowse-dimmed');
}

// Remove dim effect
function removeDimEffect() {
  document.body.classList.remove('focusbrowse-dimmed');
}

// Update page based on focus state
function updatePageState() {
  console.log('FocusBrowse: Updating page state', currentState);

  if (currentState.focusMode) {
    // Always show coffee mug during focus mode (both focus and break time)
    createCoffeeMug();
    updateCoffeeMug();

    if (currentState.isBreak) {
      // During break, show red banner on ALL tabs
      createWarningBar();
      removeDimEffect(); // Don't dim during breaks
    } else {
      // During focus time
      // If NOT a focused site, show yellow warning and dim
      if (!currentState.isFocused) {
        createWarningBar();
        applyDimEffect();
      } else {
        // If IS a focused site, NO warning and NO dim
        removeWarningBar();
        removeDimEffect();
      }
    }
  } else {
    // Not in focus mode, remove everything
    removeWarningBar();
    removeCoffeeMug();
    removeDimEffect();
  }
}

// Check if current URL should be focused
async function checkCurrentUrl() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkUrl',
      url: window.location.href
    });

    if (response) {
      updateState(response);
    }
  } catch (e) {
    console.error('FocusBrowse Error:', e);
  }
}

// Update state and UI
function updateState(newState) {
  const wasInFocus = currentState.focusMode;
  const previousTimeRemaining = currentState.timeRemaining;

  currentState = {
    focusMode: newState.focusMode,
    isFocused: newState.isFocused,
    isBreak: newState.isBreak,
    timeRemaining: newState.timeRemaining,
    totalTime: newState.totalTime || 25 * 60
  };

  // If we just entered focus mode or time changed significantly, update immediately
  if (!wasInFocus && currentState.focusMode ||
    Math.abs(currentState.timeRemaining - previousTimeRemaining) > 2) {
    updatePageState();
  } else {
    // Otherwise just update the mug if we're in focus mode
    if (currentState.focusMode) {
      updateCoffeeMug();
    }
  }
}

// Listen for state updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateState') {
    console.log('FocusBrowse: Received state update', message.state);
    updateState(message.state);
    sendResponse({ success: true });
  }
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkCurrentUrl);
} else {
  checkCurrentUrl();
}

// Check URL on page navigation
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    checkCurrentUrl();
  }
}, 500);

// Sync state from background every 5 seconds (fallback)
setInterval(() => {
  if (currentState.focusMode) {
    checkCurrentUrl();
  }
}, 5000);

// Local timer for smooth mug filling (syncs with background every 5 seconds)
setInterval(() => {
  if (currentState.focusMode && !currentState.isBreak && currentState.timeRemaining > 0) {
    currentState.timeRemaining--;
    updateCoffeeMug();
  }
}, 1000);