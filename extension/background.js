/* Register listeners synchronously so Chrome can wake this worker for events. */
async function closeIncognitoWindow(window) {
  if (!window.incognito || !Number.isInteger(window.id) || window.id < 0) return;
  try {
    await chrome.windows.remove(window.id);
  } catch (error) {
    // A window can disappear between enumeration and removal. Only report a
    // failure if it still exists; never inspect or record its tabs or URLs.
    try {
      await chrome.windows.get(window.id);
    } catch {
      return;
    }
    throw error;
  }
}

async function refreshProtection() {
  const allowed = await chrome.extension.isAllowedIncognitoAccess();
  if (allowed) {
    const windows = await chrome.windows.getAll({ populate: false });
    await Promise.all(windows.map(closeIncognitoWindow));
  }
  await chrome.action.setBadgeBackgroundColor({ color: allowed ? '#23694d' : '#9a4b19' });
  await chrome.action.setBadgeText({ text: allowed ? 'ON' : '!' });
  await chrome.action.setTitle({
    title: allowed ? 'No Incognito — automatic closing enabled' : 'No Incognito — setup required'
  });
  return { allowed };
}

function reportError(error) {
  console.warn('No Incognito could not complete a window check.', error);
  void chrome.action.setBadgeText({ text: '!' }).catch(() => {});
  void chrome.action.setTitle({ title: 'No Incognito — check status' }).catch(() => {});
}

chrome.windows.onCreated.addListener(window => {
  void closeIncognitoWindow(window).catch(reportError);
});

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    void chrome.runtime.openOptionsPage().catch(reportError);
  }
  void refreshProtection().catch(reportError);
});

chrome.runtime.onStartup.addListener(() => {
  void refreshProtection().catch(reportError);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== 'check-status') return;
  refreshProtection().then(sendResponse, error => {
    reportError(error);
    sendResponse({ error: 'Could not check protection. Reload the extension and try again.' });
  });
  return true;
});

// Also covers reloads, enabling incognito access, and service-worker restarts.
void refreshProtection().catch(reportError);
