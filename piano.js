(function(){
  if (window.__pianoArenaDefined) {
    return;
  }
  window.__pianoArenaDefined = true;

 const KEYS = [
    { id: 'home', label: 'Home', note: 'C', hex: 0xe8f7ff, hz: 261.63 },
    { id: 'about', label: 'About', note: 'D', hex: 0xffb000, hz: 293.66 },
    { id: 'skills', label: 'Skills', note: 'E', hex: 0x2f8cff, hz: 329.63 },
    { id: 'projects', label: 'Projects', note: 'F', hex: 0x00ff88, hz: 349.23 },
    { id: 'experience', label: 'Experience', note: 'G', hex: 0xb04dff, hz: 392.00 },
    { id: 'contact', label: 'Contact', note: 'A', hex: 0xff2e5b, hz: 440.00 },
  ];

  const KEY_PITCH = 0.0248;
  const WHITE_KEY_WIDTH = 0.0206;
  const WHITE_KEY_LENGTH = 0.16;
  const WHITE_KEY_HEIGHT = 0.022;
  const WHITE_KEY_COUNT = 35;
  const CENTER_KEY_INDEX = 17;
  const NAV_KEYS_START_INDEX = 14;
  const KEYBED_Y = 0.802;
  const KEY_FRONT_Z = 0.02;
  const BLACK_KEY_PATTERN = [0, 1, 3, 4, 5];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }
  function hexToCss(hex) {
    return '#' + ('000000' + hex.toString(16)).slice(-6);
  }
  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }
})