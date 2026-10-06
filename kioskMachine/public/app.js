const statusPanel = document.getElementById('statusPanel');
const kioskBadge = document.getElementById('kioskBadge');
const kioskCode = document.getElementById('kioskCode');
const kioskLocation = document.getElementById('kioskLocation');
const lastHeartbeat = document.getElementById('lastHeartbeat');
const connectionBadge = document.getElementById('connectionBadge');
const scanForm = document.getElementById('scanForm');
const requestPassButton = document.getElementById('requestPassButton');

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
    setStatus('Kiosk ready. Please identify the student.', 'ok');
    return data;
  } catch (_error) {
    connectionBadge.textContent = 'Offline';
    setStatus('Unable to reach kiosk service.', 'warn');
    return null;
  }
}

async function sendHeartbeat() {
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
    destination: formData.get('destination'),
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
    destination: formData.get('destination'),
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
setInterval(sendHeartbeat, 15000);
