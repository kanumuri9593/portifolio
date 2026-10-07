(() => {
  const root = document.querySelector('#baton');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const instrument = root.querySelector('.baton-instrument');
  const steps = [...root.querySelectorAll('.baton-steps li')];
  const command = root.querySelector('.baton-command');
  const message = root.querySelector('.baton-message');
  const status = root.querySelector('.baton-status');
  const run = root.querySelector('.baton-run');
  const reload = root.querySelector('.baton-reload');
  let timer;
  let generation = 0;
  const sequence = [
    ['inspect_project', 'Inspecting', 'Discover launch targets from existing project configuration. Baton reads launch.json, package.json, Flutter, Xcode, and Gradle projects.'],
    ['run_target', 'Launching', 'Start a session on the selected device or checkout. People and agents share the same session through the local daemon.'],
    ['wait_for', 'Ready', 'Wait for the application to become ready before the next step. This demo illustrates a Flutter lab on an iOS simulator.'],
    ['screenshot / read_logs', 'Evidence', 'Capture an image and collect logs. A person or agent must still inspect the evidence: an image written is not proof of visual correctness.'],
    ['hot_reload', 'State preserved', 'Flutter hot reload applies the edit while preserving app state. Native iOS and Android use rebuild-and-relaunch instead.']
  ];
  function setStep(index) {
    instrument.dataset.batonStep = String(index);
    steps.forEach((item, i) => {
      item.classList.toggle('is-current', i === index);
      item.classList.toggle('is-complete', i < index);
      if (i === index) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    if (index < 0) {
      command.textContent = '$ baton list';
      status.textContent = 'Idle';
      message.textContent = 'A human and an agent. The same running app. Press Run to follow the loop.';
      return;
    }
    command.textContent = `> ${sequence[index][0]}`;
    status.textContent = sequence[index][1];
    message.textContent = sequence[index][2];
  }
  function stop() { generation++; clearTimeout(timer); }
  function play(start = 0) {
    stop();
    const current = generation;
    run.disabled = true;
    reload.disabled = true;
    function advance(index) {
      if (generation !== current) return;
      setStep(index);
      if (index < sequence.length - 1) timer = setTimeout(() => advance(index + 1), index === 3 ? 2400 : 1700);
      else { run.disabled = false; reload.disabled = false; }
    }
    advance(start);
  }
  run.addEventListener('click', () => play());
  reload.addEventListener('click', () => play(3));
  root.querySelector('.baton-reset').addEventListener('click', () => {
    stop(); setStep(-1); run.disabled = false; reload.disabled = true;
  });
  window.addEventListener('pagehide', stop);
})();
