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