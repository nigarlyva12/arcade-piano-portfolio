const KEYS = [
  { id: 'home', label: 'Home', color: '#e8f7ff' },
  { id: 'about', label: 'About', color: '#ffb000' },
  { id: 'skills', label: 'Skills', color: '#2f8cff' },
  { id: 'projects', label: 'Projects', color: '#00ff88' },
  { id: 'experience', label: 'Experience', color: '#b04dff' },
  { id: 'contact', label: 'Contact', color: '#ff2e5b' },
];
const CONTROLS = [
  { key: '1–6', text: 'Jump to a stage' },
  { key: '← →', text: 'Next / previous' },
  { key: 'ESC', text: 'Back to the keys' },
];

const POINTS_PER_NEW_STAGE = 100;
const POINTS_PER_CLICK = 10;
const POINTS_FOR_ALL_STAGES = 600;

const state = {
  started: false,
  panelOpen: false,
  activeId: null,
  visited: [],
  clicks: 0,
};

let popupTimer = null;
let wipeTimer = null;
let closeTimer = null;

const app = document.getElementById('app');
const titleScreen = document.getElementById('title-screen');
const xpBar = document.getElementById('xp-bar');
const railKeys = document.getElementById('rail-keys');
const rail = document.getElementById('rail');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panel-title');
const panelTabs = document.getElementById('panel-tabs');
const stageContent = document.getElementById('stage-content');
const wipe = document.getElementById('wipe');
const popupLayer = document.getElementById('popup-layer');

const railButtons = {};
const tabButtons = {};
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function findKey(id) {
  return KEYS.find(function (key) {
    return key.id === id;
  });
}

function hasVisited(id) {
  return state.visited.includes(id);
}

function sendToPiano(name, detail) {
  window.dispatchEvent(new CustomEvent('piano:' + name, { detail: detail || {} }));
}

function showAgain(element) {
  element.classList.remove('show');
  void element.offsetWidth;
  element.classList.add('show');
}
function createStage(id, kicker) {
  const stage = createElement('div', 'stage stage--' + id);
  stage.append(createElement('div', 'pixel stage-kicker', kicker));
  return stage;
}

function createHeading(text, spaced) {
  const className = 'pixel stage-heading' + (spaced ? ' stage-heading--spaced' : '');
  return createElement('h2', className, text);
}

function renderHome() {
  const stage = createStage('home', 'PLAYER PROFILE');

  const controls = createElement('div', 'controls');
  CONTROLS.forEach(function (control) {
    const item = createElement('div', 'control');
    item.append(
      createElement('span', 'pixel control-key', control.key),
      createElement('span', 'control-text', control.text)
    );
    controls.append(item);
  });

  stage.append(
    createElement('h1', 'pixel home-name', PORTFOLIO.name),
    createElement('div', 'pixel home-class', 'CLASS: ' + PORTFOLIO.home.className),
    createElement('p', 'home-text', PORTFOLIO.home.text),
    controls
  );
  return stage;
}

function renderAbout() {
  const stage = createStage('about', 'LORE');

  const cards = createElement('div', 'about-cards');
  PORTFOLIO.about.cards.forEach(function (card) {
    const value = createElement('div', 'about-card-value');
    if (card.online) {
      value.append(createElement('span', 'status-dot'));
    }
    value.append(card.value);

    const cardElement = createElement('div', 'about-card');
    cardElement.append(createElement('div', 'pixel about-card-label', card.label), value);
    cards.append(cardElement);
  });

  stage.append(
    createHeading(PORTFOLIO.about.heading, false),
    createElement('p', 'stage-text', PORTFOLIO.about.text),
    cards
  );
  return stage;
}
function renderSkills() {
  const stage = createStage('skills', 'SKILL TREE');
  stage.append(createHeading('STATS', true));

  const groups = createElement('div', 'skill-groups');
  PORTFOLIO.skillGroups.forEach(function (group) {
    const list = createElement('div', 'skill-list');

    group.items.forEach(function (skill) {
      const bar = createElement('div', 'skill-bar');
      for (let i = 0; i < 10; i++) {
        const isFilled = i < skill.level;
        bar.append(createElement('div', isFilled ? 'skill-seg on' : 'skill-seg'));
      }

      const row = createElement('div', 'skill-row');
      row.append(createElement('span', 'skill-name', skill.name), bar);
      list.append(row);
    });

    const groupElement = createElement('div', 'skill-group');
    groupElement.append(createElement('div', 'pixel skill-group-name', group.name), list);
    groups.append(groupElement);
  });

  stage.append(groups);
  return stage;
}

function renderProjects() {
    const stage = createStage('projects', 'QUEST LOG');
    stage.append(createHeading('COMPLETED QUESTS', true));

    const grid = createElement('div', 'project-grid');
    PORTFOLIO.projects.forEach(function (project) {
        const top = createElement('div', 'pixel project-top');
        top.append(
        createElement('span', 'project-tag', project.tag),
        createElement('span', 'project-stars', project.stars)
        );

        const tech = createElement('div', 'project-tech');
        project.tech.forEach(function (name) {
        tech.append(createElement('span', 'chip', name));
        });

        const thumb = createElement('div', 'project-thumb');
        thumb.append(createElement('span', 'pixel project-thumb-label', 'SCREENSHOT'));

        const body = createElement('div', 'project-body');
        body.append(
        top,
        createElement('div', 'pixel project-name', project.name),
        createElement('p', 'project-text', project.text),
        tech
        );

        const card = createElement('div', 'project-card');
        card.append(thumb, body);
        grid.append(card);
    });

    stage.append(grid);
    return stage;
}
function renderExperience() {
  const stage = createStage('experience', 'CAMPAIGN');
  stage.append(createHeading('LEVELS CLEARED', true));

  const list = createElement('div', 'level-list');
  PORTFOLIO.experience.forEach(function (job) {
    const side = createElement('div', 'level-side');
    side.append(
      createElement('span', 'pixel level-number', job.level),
      createElement('span', 'pixel level-years', job.years)
    );

    const info = createElement('div', 'level-info');
    info.append(
      createElement('div', 'level-role', job.role),
      createElement('div', 'pixel level-company', job.company),
      createElement('p', 'level-text', job.text)
    );

    const level = createElement('div', job.current ? 'level current' : 'level');
    level.append(side, info);
    list.append(level);
  });

  stage.append(list);
  return stage;
}

function renderContact() {
  const stage = createStage('contact', 'MULTIPLAYER');

  const button = createElement('a', 'pixel contact-button', 'SEND MESSAGE ►');
  button.href = 'mailto:' + PORTFOLIO.contact.email;

  const links = createElement('div', 'contact-links');
  PORTFOLIO.contact.links.forEach(function (link) {
    const anchor = createElement('a', 'pixel contact-link', link.label);
    anchor.href = link.url;
    if (link.url.startsWith('http')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener';
    }
    links.append(anchor);
  });

  stage.append(
    createHeading(PORTFOLIO.contact.heading, false),
    createElement('p', 'contact-text', PORTFOLIO.contact.text),
    button,
    createElement('div', 'contact-email', PORTFOLIO.contact.email),
    links
  );
  return stage;
}
const STAGE_RENDERERS = {
  home: renderHome,
  about: renderAbout,
  skills: renderSkills,
  projects: renderProjects,
  experience: renderExperience,
  contact: renderContact,
};
function createKeyButtons() {
  KEYS.forEach(function (key, index) {
    const statusText = createElement('span', 'pixel key-status', 'NEW');

    const text = createElement('span', 'key-text');
    text.append(createElement('span', 'pixel key-name', key.label.toUpperCase()), statusText);

    const button = createElement('button', 'key-button');
    button.type = 'button';
    button.style.setProperty('--key-color', key.color);
    button.append(createElement('span', 'pixel key-number', String(index + 1)), text);

    button.addEventListener('click', function () {
      sendToPiano('activate', { id: key.id });
    });
    button.addEventListener('mouseenter', function () {
      if (!state.panelOpen) {
        sendToPiano('highlight', { id: key.id });
      }
    });

    railButtons[key.id] = statusText;
    railKeys.append(button);
  });
}

function createTabs() {
  KEYS.forEach(function (key, index) {
    const button = createElement('button', 'pixel tab');
    button.type = 'button';
    button.style.setProperty('--key-color', key.color);
    button.append(createElement('span', 'tab-number', String(index + 1)), key.label.toUpperCase());

    button.addEventListener('click', function () {
      sendToPiano('activate', { id: key.id });
    });

    tabButtons[key.id] = button;
    panelTabs.append(button);
  });
}

function createXpBar() {
  KEYS.forEach(function () {
    xpBar.append(createElement('div', 'xp-seg'));
  });
}

function updateHud() {
  const visitedCount = state.visited.length;
  const allDone = visitedCount === KEYS.length;
  const score =
    visitedCount * POINTS_PER_NEW_STAGE +
    state.clicks * POINTS_PER_CLICK +
    (allDone ? POINTS_FOR_ALL_STAGES : 0);

  document.getElementById('hud-level').textContent = String(visitedCount + 1);
  document.getElementById('hud-progress').textContent = visitedCount + '/' + KEYS.length + ' STAGES';
  document.getElementById('hud-score').textContent = String(score).padStart(6, '0');

  KEYS.forEach(function (key, index) {
    const segment = xpBar.children[index];
    segment.style.setProperty('--seg-color', key.color);
    segment.classList.toggle('filled', hasVisited(key.id));
  });
}

function updateKeyButtons() {
  KEYS.forEach(function (key) {
    const statusText = railButtons[key.id];
    const done = hasVisited(key.id);
    statusText.textContent = done ? 'CLEAR ✓' : 'NEW';
    statusText.classList.toggle('done', done);
  });
}

function updateTabs() {
  KEYS.forEach(function (key) {
    tabButtons[key.id].classList.toggle('active', key.id === state.activeId);
  });
}

function showPopup(key) {
  const allDone = state.visited.length === KEYS.length;

  document.getElementById('popup-title').textContent = allDone ? 'ALL STAGES CLEAR' : 'STAGE UNLOCKED';
  document.getElementById('popup-sub').textContent = allDone ? 'PORTFOLIO 100%' : key.label.toUpperCase();
  document.getElementById('popup-xp').textContent = allDone ? '+' + POINTS_FOR_ALL_STAGES + ' XP' : '+' + POINTS_PER_NEW_STAGE + ' XP';
  popupLayer.style.setProperty('--popup-color', allDone ? '#ffe14d' : key.color);

  showAgain(popupLayer);
  clearTimeout(popupTimer);
  popupTimer = setTimeout(function () {
    popupLayer.classList.remove('show');
  }, 2450);
}

function showWipe(key) {
  wipe.style.setProperty('--wipe-color', key.color + '55');
  showAgain(wipe);
  clearTimeout(wipeTimer);
  wipeTimer = setTimeout(function () {
    wipe.classList.remove('show');
  }, 650);
}

function openStage(id) {
  const key = findKey(id);
  if (!key) {
    return;
  }

  const isFirstVisit = !hasVisited(id);
  const wasOpen = state.panelOpen;

  state.activeId = id;
  state.panelOpen = true;
  state.clicks++;
  if (isFirstVisit) {
    state.visited.push(id);
  }
  clearTimeout(closeTimer);

  panel.style.setProperty('--stage-color', key.color);
  panel.style.setProperty('--stage-glow', key.color + '66');
  panelTitle.textContent = 'STAGE 0' + (KEYS.indexOf(key) + 1) + ' — ' + key.label.toUpperCase();

  stageContent.replaceChildren(STAGE_RENDERERS[id]());

  app.classList.remove('prompt-ready');
  app.classList.add('panel-open');

  updateHud();
  updateKeyButtons();
  updateTabs();

  if (isFirstVisit) {
    showPopup(key);
  }
  showWipe(key);

  if (!wasOpen) {
    sendToPiano('open-panel');
  }
}

function closePanel() {
  if (!state.panelOpen) {
    return;
  }

  state.panelOpen = false;
  app.classList.remove('panel-open');
  sendToPiano('reset');

  clearTimeout(closeTimer);
  closeTimer = setTimeout(function () {
    if (!state.panelOpen) {
      state.activeId = null;
      stageContent.replaceChildren();
      updateTabs();
    }
  }, 500);
}

function goToNeighbour(step) {
  const currentIndex = KEYS.findIndex(function (key) {
    return key.id === state.activeId;
  });
  const nextIndex = (currentIndex + step + KEYS.length) % KEYS.length;
  sendToPiano('activate', { id: KEYS[nextIndex].id });
}

function startGame() {
  if (!state.started) {
    sendToPiano('zoom');
  }
}

function setupPianoEvents() {
  window.addEventListener('piano:phase', function (event) {
    state.started = event.detail.phase !== 'reveal';
    app.classList.toggle('started', state.started);
  });

  window.addEventListener('piano:prompt', function () {
    app.classList.add('prompt-ready');
  });

  window.addEventListener('piano:audio', function (event) {
    document.getElementById('audio-button').textContent = event.detail.on ? 'SFX ON' : 'SFX OFF';
  });

  window.addEventListener('piano:navigate', function (event) {
    openStage(event.detail.id);
  });
}

function setupPageEvents() {
  titleScreen.addEventListener('click', startGame);
  titleScreen.addEventListener('wheel', startGame);

  document.getElementById('audio-button').addEventListener('click', function () {
    sendToPiano('toggle-audio');
  });
  document.getElementById('wide-button').addEventListener('click', function () {
    sendToPiano('wide');
  });
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('panel-backdrop').addEventListener('click', closePanel);

  rail.addEventListener('mouseleave', function () {
    sendToPiano('highlight', { id: null });
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closePanel();
      return;
    }

    const number = parseInt(event.key, 10);
    if (number >= 1 && number <= KEYS.length) {
      sendToPiano('activate', { id: KEYS[number - 1].id });
      return;
    }

    if (state.panelOpen && event.key === 'ArrowRight') {
      goToNeighbour(1);
    }
    if (state.panelOpen && event.key === 'ArrowLeft') {
      goToNeighbour(-1);
    }
  });
}

function init() {
  document.getElementById('title-name').textContent = PORTFOLIO.name;
  document.getElementById('title-role').textContent = PORTFOLIO.title;
  document.getElementById('hud-name').textContent = PORTFOLIO.name;

  createXpBar();
  createKeyButtons();
  createTabs();
  updateHud();
  setupPianoEvents();
  setupPageEvents();
}

init();