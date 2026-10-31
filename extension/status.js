const statusPanel = document.querySelector('#status');
const title = document.querySelector('#status-title');
const description = document.querySelector('#status-description');
const checkButton = document.querySelector('#check-status');

function showError(message) {
  statusPanel.dataset.state = 'error';
  title.textContent = 'Status unavailable';
  description.textContent = message;
  document.querySelector('#setup').hidden = false;
}

async function checkStatus() {
  if (checkButton.disabled) return;
  checkButton.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'check-status' });
    if (result?.error || typeof result?.allowed !== 'boolean') {
      throw new Error(result?.error || 'Reload the extension and try again.');
    }
    statusPanel.dataset.state = result.allowed ? 'active' : 'inactive';
    title.textContent = result.allowed ? 'Automatic closing is on' : 'Setup required';
    description.textContent = result.allowed
      ? 'Incognito windows will close when they open.'
      : 'Enable incognito access to start blocking.';
    document.querySelector('#setup').hidden = result.allowed;
  } catch (error) {
    showError(error.message);
  } finally {
    checkButton.disabled = false;
  }
}

document.querySelector('#open-settings').addEventListener('click', async () => {
  try {
    await chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  } catch {
    showError('Open chrome://extensions, find TopLock-Antincognito, then choose Details.');
  }
});
checkButton.addEventListener('click', checkStatus);
window.addEventListener('focus', checkStatus);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void checkStatus();
});
void checkStatus();
