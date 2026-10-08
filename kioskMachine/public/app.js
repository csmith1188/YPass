const statusPanel = document.getElementById('statusPanel');
const kioskBadge = document.getElementById('kioskBadge');
const kioskCode = document.getElementById('kioskCode');
const kioskLocation = document.getElementById('kioskLocation');
const lastHeartbeat = document.getElementById('lastHeartbeat');
const connectionBadge = document.getElementById('connectionBadge');
const scanForm = document.getElementById('scanForm');
const requestPassButton = document.getElementById('requestPassButton');
const enrollmentPanel = document.getElementById('enrollmentPanel');
const serverUrlInput = document.getElementById('serverUrl');
const enrollmentCodeDisplay = document.getElementById('enrollmentCodeDisplay');
const enrollmentExpiry = document.getElementById('enrollmentExpiry');
let kioskOptions = [];
let registered = false;

function setStatus(message, tone = 'ok') {
  statusPanel.className = `status ${tone}`;
  statusPanel.innerHTML = `<strong>Status:</strong> ${message}`;
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    kioskBadge.textContent = `${data.kioskCode || 'KIOSK'} • ${data.kioskName || 'Hall Pass Kiosk'}`;
    kioskCode.textContent = data.kioskCode || '--';
    kioskLocation.textContent = data.kioskLocation || '--';
    connectionBadge.textContent = 'Online';
    registered = Boolean(data.registered);
    serverUrlInput.value = data.serverUrl || serverUrlInput.value;
    enrollmentPanel.hidden = registered;
    scanForm.hidden = !registered;
    enrollmentCodeDisplay.textContent = data.enrollmentCode || 'Connecting...';
    enrollmentExpiry.textContent = data.enrollmentCode
      ? 'Waiting for registration in YPass Manager...'
      : 'Unable to connect. Retrying...';
    setStatus(registered ? 'Kiosk ready. Please identify the student.' : 'Registration required.', registered ? 'ok' : 'warn');
    if (registered) await loadOptions();
    return data;
  } catch (_error) {
    connectionBadge.textContent = 'Offline';
    setStatus('Unable to reach kiosk service.', 'warn');
    return null;
  }
}

async function pollEnrollment() {
  if (registered) return;
  try {
    const response = await fetch('/api/enrollment/status');
    const result = await response.json();
    if (result.ok && result.status === 'complete') {
      setStatus('Registration successful. Connecting to YPass...', 'ok');
      await loadConfig();
      await sendHeartbeat();
    } else if (!response.ok) {
      setStatus(result.message || 'Unable to connect to YPass. Retrying...', 'warn');
    }
  } catch (_error) {
    setStatus('Unable to connect to YPass. Retrying...', 'warn');
  }
}

async function loadOptions() {
  try {
    const response = await fetch('/api/options');
    const data = await response.json();
    kioskOptions = data.destinations || [];
    const destination = document.getElementById('destination');
    destination.replaceChildren(
      ...kioskOptions.map((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.teacher_name ? `${item.teacher_name} - ${item.name}` : item.name;
        return option;
      }),
    );
  } catch (_error) {
    setStatus('Unable to load destinations from YPass.', 'warn');
  }
}

async function sendHeartbeat() {
  if (!registered) return false;
  try {
    const response = await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    });

    if (response.ok) {
      const data = await response.json();
      lastHeartbeat.textContent = new Date(data.timestamp || Date.now()).toLocaleTimeString();
      connectionBadge.textContent = 'Online';
      return true;
    }
  } catch (_error) {
    connectionBadge.textContent = 'Offline';
  }

  return false;
}

scanForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(scanForm);
  const payload = {
    studentNumber: formData.get('studentNumber'),
    studentName: formData.get('studentName'),
    destinationLocationId: formData.get('destination'),
  };

  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  setStatus(result.message || 'Student scanned.', result.ok ? 'ok' : 'warn');
});

requestPassButton.addEventListener('click', async () => {
  const formData = new FormData(scanForm);
  const payload = {
    studentNumber: formData.get('studentNumber'),
    studentName: formData.get('studentName'),
    destinationLocationId: formData.get('destination'),
  };

  const response = await fetch('/api/request-pass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  setStatus(result.message || 'Pass request sent.', result.ok ? 'ok' : 'warn');
});

loadConfig();
sendHeartbeat();
pollEnrollment();
setInterval(sendHeartbeat, 15000);
setInterval(pollEnrollment, 3000);
