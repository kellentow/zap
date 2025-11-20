export function prompt(message:string, defaultValue = '') {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
      z-index: 9999;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style = `
      background: white; padding: 20px; border-radius: 8px; min-width: 300px;
      display: flex; flex-direction: column; gap: 10px;
    `;
    modal.innerHTML = `
      <div>${message}</div>
      <input type="text" value="${defaultValue}" style="width: 100%; padding: 5px;"/>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel">Cancel</button>
        <button id="ok">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('input');
    input.focus();

    const cleanup = () => document.body.removeChild(overlay);

    modal.querySelector('#ok').addEventListener('click', () => {
      cleanup();
      resolve(input.value);
    });

    modal.querySelector('#cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        cleanup();
        resolve(input.value);
      } else if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    });
  });
}
