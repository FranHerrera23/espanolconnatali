const form = document.querySelector('#tutor-waitlist');
const status = document.querySelector('#waitlist-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = form.dataset.pending;
  const fields = new FormData(form);
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        email: fields.get('email'),
        consent: fields.get('consent') === 'on',
        website: fields.get('website'),
        language: document.documentElement.lang
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      status.textContent = response.status === 409 ? form.dataset.full : form.dataset.fail;
      return;
    }
    const result = await response.json();
    if (result.ok !== true) throw new Error('Unexpected waitlist response');
    if (result.created === true) document.dispatchEvent(new Event('ecn:waitlist-joined'));
    form.hidden = true;
    form.style.display = 'none';
    status.textContent = form.dataset.success;
  } catch {
    status.textContent = form.dataset.fail;
  } finally {
    button.disabled = false;
  }
});
