(() => {
  const dialog = document.querySelector('#reel-dialog');
  const frame = document.querySelector('#reel-frame');
  let opener;
  document.querySelectorAll('[data-reel]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      opener = button;
      document.querySelector('#reel-title').textContent = button.dataset.title;
      document.querySelector('#reel-original').href = `https://www.instagram.com/${button.dataset.account}/reel/${button.dataset.reel}/`;
      frame.src = `https://www.instagram.com/p/${button.dataset.reel}/embed/`;
      dialog.showModal();
    });
  });
  document.querySelector('#reel-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { frame.removeAttribute('src'); opener?.focus(); });
  document.querySelectorAll('.career-rows details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.career-rows details').forEach(other => { if (other !== item) other.open = false; });
  }));
})();
