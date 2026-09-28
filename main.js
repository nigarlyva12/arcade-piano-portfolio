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