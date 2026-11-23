const controls = document.querySelector('[data-preview-controls]');
if (controls) {
  const buttons = [...controls.querySelectorAll('button')];
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
  controls.hidden = false;
  for (const [index, button] of buttons.entries()) {
    button.addEventListener('click', () => {
      for (const [item, panel] of panels.entries()) {
        const selected = item === index;
        panel.hidden = !selected;
        buttons[item].setAttribute('aria-pressed', String(selected));
      }
    });
  }
}
