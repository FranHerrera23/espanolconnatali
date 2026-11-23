const form = document.querySelector('[data-course-payment-form]');
if (form && typeof crypto.randomUUID === 'function') {
  const errorMessage = form.querySelector('[role="alert"]');
  const submit = form.querySelector('button');
  const success = document.querySelector('.payment-success');
  const requestId = crypto.randomUUID();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    errorMessage.textContent = '';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), language: form.dataset.language, kind: form.dataset.kind, requestId })
      });
      if (!response.ok || !(await response.json()).ok) throw new Error('Request failed');
      form.reset();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      errorMessage.textContent = form.dataset.error;
    } finally {
      submit.disabled = false;
    }
  });
  form.hidden = false;
}
