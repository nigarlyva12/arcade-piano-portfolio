(function () {
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

  function createWoodTexture(THREE, baseColor, streakColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 420; i++) {
      const y = Math.random() * canvas.height;
      const lineWidth = 0.4 + Math.random() * 2.2;
      ctx.globalAlpha = 0.03 + Math.random() * 0.09;
      ctx.fillStyle = Math.random() > 0.45 ? streakColor : '#000';
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 64) {
        ctx.lineTo(x, y + Math.sin((x / canvas.width) * 6.2 + i) * 3.5);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  function createGlowTexture(THREE, brightness) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,' + brightness + ')');
    gradient.addColorStop(0.45, 'rgba(255,255,255,' + brightness * 0.35 + ')');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
  }

  function createLightShaftTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.32)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
  }

  function createPlateTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#6d6046';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 150; i++) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.4;
      ctx.fillStyle = i % 3 ? '#b9a877' : '#3b3428';
      ctx.fillRect(0, i * 3.4, canvas.width, 1.1);
    }
    return new THREE.CanvasTexture(canvas);
  }

  class PianoArena extends HTMLElement {

    connectedCallback() {
      if (this._booted) {
        return;
      }
      this._booted = true;

      this.style.display = 'block';
      this.style.position = this.style.position || 'absolute';
      this.style.inset = '0';
      this.style.background = '#07080b';

      const boot = () => {
        if (this._bootStarted) {
          return;
        }
        this._bootStarted = true;
        this._loadThree((threeIsReady) => {
          try {
            if (threeIsReady) {
              this._init();
            } else {
              this._showFallback();
            }
          } catch (error) {
            console.warn('piano-arena: 3D unavailable, using flat keyboard', error);
            try {
              this._showFallback();
            } catch (fallbackError) {

            }
          }
        });
      };

      if (document.readyState !== 'loading') {
        boot();
      } else {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
        setTimeout(boot, 1200);
      }
    }

    disconnectedCallback() {
      this._dead = true;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
      }
      if (this._unbindEvents) {
        this._unbindEvents();
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    }

    _loadThree(callback) {
      let called = false;
      const finish = (ok) => {
        if (called) {
          return;
        }
        called = true;
        callback(ok);
      };

      if (window.THREE) {
        finish(true);
        return;
      }

      const urls = [
        'https://unpkg.com/three@0.159.0/build/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js',
      ];

      if (!window.__threeLoading) {
        window.__threeLoading = new Promise((resolve) => {
          let i = 0;
          function tryNext() {
            if (window.THREE || i >= urls.length) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.src = urls[i++];
            script.async = true;
            script.onload = resolve;
            script.onerror = tryNext;
            document.head.appendChild(script);
          }
          tryNext();
          setTimeout(resolve, 6000);
        });
      }
      window.__threeLoading.then(() => finish(!!window.THREE));
    }

    _showFallback() {
      const wrap = document.createElement('div');
      wrap.style.cssText =
        'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'background:radial-gradient(120% 90% at 50% 8%,#1b1d24 0%,#0a0b0f 60%,#06070a 100%)';

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:4px;perspective:900px;transform:rotateX(46deg);transform-style:preserve-3d';

      KEYS.forEach((key) => {
        const button = document.createElement('button');
        button.style.cssText =
          'width:58px;height:220px;border:0;border-radius:0 0 6px 6px;cursor:pointer;' +
          'background:linear-gradient(#f4efe4,#cfc8b8);box-shadow:0 0 34px ' + hexToCss(key.hex) + '55';
        button.title = key.label;
        button.onclick = () => emit('piano:navigate', { id: key.id });
        row.appendChild(button);
      });

      wrap.appendChild(row);
      this.appendChild(wrap);
      emit('piano:phase', { phase: 'keys' });
    }

    _init() {
      if (this._inited) {
        return;
      }
      this._inited = true;
      const THREE = window.THREE;

      const renderer = this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.55;
      if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
      this.appendChild(renderer.domElement);

      const scene = this.scene = new THREE.Scene();
      scene.background = new THREE.Color(0x07080b);
      scene.fog = new THREE.FogExp2(0x0a0c11, 0.075);

      const camera = this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 90);
      this.cameraPosition = new THREE.Vector3();
      this.cameraTarget = new THREE.Vector3();

      this.createRoom(THREE, scene);
      this.createPiano(THREE, scene);
      this.createAtmosphere(THREE, scene);
      this.applyArcadeLook(THREE, scene);

      const navCenterX = (NAV_KEYS_START_INDEX + 2.5 - CENTER_KEY_INDEX) * KEY_PITCH;
      this.shots = {
        reveal: { position: [3.35, 2.05, 2.95], target: [0, 0.78, -0.40], fov: 38, exposure: 1.55 },
        keys: { position: [navCenterX, 0.915, 0.35], target: [navCenterX, 0.798, -0.055], fov: 33, exposure: 1.2 },
        panel: { position: [navCenterX + 0.17, 1.05, 0.66], target: [navCenterX, 0.80, -0.06], fov: 35, exposure: 0.72 },
      };
      this.orbitAngle = Math.atan2(2.95, 3.35);
      this.orbitRadius = Math.sqrt(3.35 * 3.35 + 2.95 * 2.95);
      this.phase = 'reveal';
      this.setCameraShot('reveal', 0);

      this.blackVeil = 1;
      this.mistAmount = 1;
      this.hoveredKey = null;
      this.startTime = performance.now();

      this._bindEvents();
      this._resize();
      this._tick();

      emit('piano:phase', { phase: 'reveal' });
      setTimeout(() => {
        if (this.phase === 'reveal') {
          emit('piano:prompt', {});
        }
      }, 2600);
    }

    _pianoOutlineShape(THREE, frontWidthBoost) {
      const boost = frontWidthBoost || 0;
      const halfWidth = 0.50 + boost * 0.10;
      const shape = new THREE.Shape();
      shape.moveTo(-halfWidth, boost);
      shape.lineTo(halfWidth, boost);
      shape.bezierCurveTo(0.62, 0.62, 0.55, 1.52, 0.26, 1.98);
      shape.bezierCurveTo(0.11, 2.22, -0.22, 2.26, -0.50, 2.10);
      shape.lineTo(-halfWidth, boost);
      return shape;
    }

    createRoom(THREE, scene) {
      const floorTexture = createWoodTexture(THREE, '#100f10', '#2a2118');
      floorTexture.repeat.set(5, 5);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(16, 64),
        new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.55, metalness: 0.18, map: floorTexture })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      this.floor = floor;

      scene.add(new THREE.AmbientLight(0x2b3444, 1.15));
      scene.add(new THREE.HemisphereLight(0x3d4a68, 0x0b0b0e, 0.55));

      const keyLightSpot = new THREE.SpotLight(0xfff0d6, 66, 22, 0.5, 0.9, 1.15);
      keyLightSpot.position.set(0.25, 6.4, 0.55);
      keyLightSpot.target.position.set(0, 0.7, -0.3);
      keyLightSpot.castShadow = true;
      keyLightSpot.shadow.mapSize.set(2048, 2048);
      keyLightSpot.shadow.bias = -0.0008;
      keyLightSpot.shadow.camera.near = 1;
      keyLightSpot.shadow.camera.far = 14;
      scene.add(keyLightSpot, keyLightSpot.target);

      const rimLight = new THREE.SpotLight(0x7f97ff, 20, 16, 0.8, 1, 1.2);
      rimLight.position.set(-3.4, 2.6, -3.0);
      rimLight.target.position.set(0, 0.8, -0.6);
      scene.add(rimLight, rimLight.target);

      const fillLight = new THREE.PointLight(0xffd9a0, 5.5, 10, 1.9);
      fillLight.position.set(1.9, 1.5, 2.5);
      const keyFillLight = new THREE.SpotLight(0xffe8c8, 9, 5, 0.62, 0.92, 1.1);
      keyFillLight.position.set(0, 2.1, 1.0);
      keyFillLight.target.position.set(0, 0.80, -0.04);
      scene.add(fillLight, keyFillLight, keyFillLight.target);

      this.hoverKeyLight = new THREE.PointLight(0xffffff, 0, 0.17, 1.7);
      this.hoverKeyLight.position.set(0, KEYBED_Y - 0.03, KEY_FRONT_Z + 0.05);
      scene.add(this.hoverKeyLight);
    }

    createPianoBody(THREE, group) {
      const woodTexture = createWoodTexture(THREE, '#191210', '#4a3222');
      woodTexture.repeat.set(2, 1);
      const caseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x7a5c40, map: woodTexture, roughness: 0.18, metalness: 0.1,
        clearcoat: 1, clearcoatRoughness: 0.07,
      });
      const lacquerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3a2c24, map: woodTexture, roughness: 0.1, metalness: 0.2,
        clearcoat: 1, clearcoatRoughness: 0.04,
      });
      this.lacquerMaterial = lacquerMaterial;

      const bodyShape = this._pianoOutlineShape(THREE);
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(bodyShape, {
        depth: 0.34, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24,
      }), caseMaterial);
      body.geometry.rotateX(-Math.PI / 2);
      body.geometry.translate(0, 0.44, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const plateShape = this._pianoOutlineShape(THREE, 0.22);
      const plate = new THREE.Mesh(
        new THREE.ExtrudeGeometry(plateShape, { depth: 0.012, bevelEnabled: false, curveSegments: 20 }),
        new THREE.MeshStandardMaterial({ map: createPlateTexture(THREE), color: 0xc9b98a, roughness: 0.3, metalness: 0.85 })
      );
      plate.geometry.rotateX(-Math.PI / 2);
      plate.geometry.scale(0.93, 1, 0.97);
      plate.geometry.translate(0, 0.752, -0.03);
      group.add(plate);

      const lidGeometry = new THREE.ExtrudeGeometry(plateShape, {
        depth: 0.026, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 24,
      });
      lidGeometry.rotateX(-Math.PI / 2);
      lidGeometry.translate(0.52, 0, 0);
      const lid = new THREE.Mesh(lidGeometry, lacquerMaterial);
      lid.castShadow = true;
      lid.receiveShadow = true;
      const lidHinge = new THREE.Group();
      lidHinge.position.set(-0.52, 0.788, 0);
      lidHinge.rotation.z = 0.66;
      lidHinge.add(lid);
      group.add(lidHinge);

      const fallboardMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3a2c24, map: woodTexture, roughness: 0.42, metalness: 0.08, clearcoat: 0.25, clearcoatRoughness: 0.5,
      });
      const fallboard = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.10, 0.028), fallboardMaterial);
      fallboard.position.set(0, 0.848, -0.196);
      fallboard.rotation.x = -0.12;
      fallboard.castShadow = true;
      group.add(fallboard);

      const keyslip = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.032, 0.022), lacquerMaterial);
      keyslip.position.set(0, 0.788, 0.041);
      group.add(keyslip);

      [[-0.42, -0.10], [0.42, -0.10], [-0.06, -1.86]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.042, 0.45, 20), lacquerMaterial);
        leg.position.set(x, 0.222, z);
        leg.castShadow = true;
        group.add(leg);
      });

      const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xc9a65a, roughness: 0.28, metalness: 0.95 });
      const lyre = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.02), lacquerMaterial);
      lyre.position.set(0, 0.30, -0.28);
      group.add(lyre);
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.011, 0.085), brassMaterial);
      pedal.position.set(0, 0.16, -0.21);
      pedal.rotation.x = 0.1;
      group.add(pedal);
    }

    createKeys(THREE, group) {
      const whiteKeyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xefe9dd, roughness: 0.34, metalness: 0.02, clearcoat: 0.45,
        clearcoatRoughness: 0.3, emissive: 0x000000, emissiveIntensity: 1,
      });
      const blackKeyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0a0a0c, roughness: 0.62, metalness: 0, clearcoat: 0, reflectivity: 0.12,
      });

      const keyGroup = new THREE.Group();
      group.add(keyGroup);

      const felt = new THREE.Mesh(
        new THREE.BoxGeometry(1.02, 0.008, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.95 })
      );
      felt.position.set(0, KEYBED_Y - 0.019, KEY_FRONT_Z - WHITE_KEY_LENGTH - 0.012);
      group.add(felt);

      const keybed = new THREE.Mesh(
        new THREE.BoxGeometry(1.02, 0.018, WHITE_KEY_LENGTH + 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2a201a, roughness: 0.9 })
      );
      keybed.position.set(0, KEYBED_Y - 0.03, KEY_FRONT_Z - WHITE_KEY_LENGTH / 2);
      group.add(keybed);

      const glowTexture = createGlowTexture(THREE, 0.9);
      this.navigationKeys = [];

      for (let i = 0; i < WHITE_KEY_COUNT; i++) {
        const x = (i - CENTER_KEY_INDEX) * KEY_PITCH;
        const navIndex = i - NAV_KEYS_START_INDEX;
        const isNavKey = navIndex >= 0 && navIndex < KEYS.length;
        const material = isNavKey ? whiteKeyMaterial.clone() : whiteKeyMaterial;

        const keyMesh = new THREE.Mesh(new THREE.BoxGeometry(WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT, WHITE_KEY_LENGTH), material);
        keyMesh.position.set(0, 0, WHITE_KEY_LENGTH / 2 - 0.005);

        const pivot = new THREE.Group();
        pivot.position.set(x, KEYBED_Y - WHITE_KEY_HEIGHT / 2, KEY_FRONT_Z - WHITE_KEY_LENGTH);
        pivot.add(keyMesh);
        keyGroup.add(pivot);

        if (isNavKey) {
          const spec = KEYS[navIndex];
          const color = new THREE.Color(spec.hex);
          material.emissive = color.clone();
          material.emissiveIntensity = 0.2;

          const colorPool = new THREE.Mesh(
            new THREE.PlaneGeometry(0.0158, 0.019),
            new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.72, depthWrite: false })
          );
          colorPool.rotation.x = -Math.PI / 2;
          colorPool.position.set(0, WHITE_KEY_HEIGHT / 2 + 0.0006, WHITE_KEY_LENGTH - 0.024);
          pivot.add(colorPool);

          const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture, color: color.clone(), transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4,
          }));
          glow.scale.set(0.024, 0.024, 1);
          glow.position.set(0, WHITE_KEY_HEIGHT / 2 + 0.004, WHITE_KEY_LENGTH - 0.024);
          pivot.add(glow);

          this.navigationKeys.push({
            spec, pivot, mesh: keyMesh, material, glow, colorPool, color,
            press: 0,
            target: 0,
            flash: 0,
          });
        }

        if (i < WHITE_KEY_COUNT - 1 && BLACK_KEY_PATTERN.indexOf(i % 7) !== -1) {
          const blackKey = new THREE.Mesh(new THREE.BoxGeometry(0.0128, 0.0195, 0.098), blackKeyMaterial);
          blackKey.position.set(x + KEY_PITCH / 2, KEYBED_Y + 0.0072, KEY_FRONT_Z - 0.112);
          keyGroup.add(blackKey);
        }
      }

      this.keyMeshes = this.navigationKeys.map((k) => k.mesh);
    }

    createPiano(THREE, scene) {
      const pianoGroup = this.piano = new THREE.Group();
      scene.add(pianoGroup);
      this.createPianoBody(THREE, pianoGroup);
      this.createKeys(THREE, pianoGroup);
    }

    createAtmosphere(THREE, scene) {
      const shaftAlphaMap = createLightShaftTexture(THREE);
      this.lightShafts = [];
      [[1.45, 5.6, 0.028, 0.5], [0.72, 5.0, 0.05, 0.3]].forEach(([radius, height, opacity, scaleZ]) => {
        const shaft = new THREE.Mesh(
          new THREE.ConeGeometry(radius, height, 40, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xffe9c4, transparent: true, alphaMap: shaftAlphaMap, opacity,
            blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
          })
        );
        shaft.position.set(0.2, height / 2 - 0.2, 0.3);
        shaft.scale.set(1, 1, scaleZ + 0.6);
        scene.add(shaft);
        this.lightShafts.push(shaft);
      });

      const mistTexture = createGlowTexture(THREE, 0.55);
      this.mistLayers = [];
      for (let i = 0; i < 4; i++) {
        const layer = new THREE.Mesh(
          new THREE.PlaneGeometry(9, 9),
          new THREE.MeshBasicMaterial({
            map: mistTexture, color: 0x8fa3c4, transparent: true, opacity: 0.1,
            blending: THREE.AdditiveBlending, depthWrite: false,
          })
        );
        layer.rotation.x = -Math.PI / 2 + 0.06 * i;
        layer.rotation.z = Math.random() * 6.28;
        layer.position.set(0, 0.12 + i * 0.34, -0.4);
        scene.add(layer);
        this.mistLayers.push(layer);
      }

      const dustCount = 900;
      const positions = new Float32Array(dustCount * 3);
      const seeds = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i++) {
        const radius = Math.pow(Math.random(), 0.6) * 4.6;
        const angle = Math.random() * 6.283;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 3.4;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        seeds[i] = Math.random() * 6.283;
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
        size: 0.017, map: createGlowTexture(THREE, 1), color: 0xffe7c2, transparent: true,
        opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
      this.dustSeeds = seeds;
      scene.add(this.dust);

      const burstCount = 160;
      const burstPositions = new Float32Array(burstCount * 3);
      const burstGeometry = new THREE.BufferGeometry();
      burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
      this.burst = new THREE.Points(burstGeometry, new THREE.PointsMaterial({
        size: 0.0032, map: createGlowTexture(THREE, 1), color: 0xffffff, transparent: true,
        opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.burstParticles = [];
      for (let i = 0; i < burstCount; i++) {
        this.burstParticles.push({ life: 0, vx: 0, vy: 0, vz: 0, x: 0, y: 0, z: 0 });
      }
      scene.add(this.burst);
    }

    setCameraShot(name, durationMs) {
      const THREE = window.THREE;
      const shot = this.shots[name];
      const target = {
        position: new THREE.Vector3().fromArray(shot.position),
        target: new THREE.Vector3().fromArray(shot.target),
        fov: shot.fov,
        exposure: shot.exposure,
      };

      if (!durationMs) {
        this.cameraPosition.copy(target.position);
        this.cameraTarget.copy(target.target);
        this.camera.fov = target.fov;
        this.camera.updateProjectionMatrix();
        this.renderer.toneMappingExposure = target.exposure;
        this.cameraTween = null;
      } else {
        this.cameraTween = {
          fromPosition: this.cameraPosition.clone(),
          fromTarget: this.cameraTarget.clone(),
          fromFov: this.camera.fov,
          fromExposure: this.renderer.toneMappingExposure,
          to: target,
          startTime: performance.now(),
          duration: durationMs,
        };
      }
      this.shotName = name;
    }

    goToKeys() {
      if (this.phase !== 'reveal') {
        return;
      }
      this.phase = 'keys';
      this.setCameraShot('keys', 1400);
      this.playStartChord();
      emit('piano:phase', { phase: 'keys' });
    }

    goToReveal() {
      this.phase = 'reveal';
      this.orbitAngle = Math.atan2(this.cameraPosition.z, this.cameraPosition.x);
      this.setCameraShot('reveal', 1300);
      emit('piano:phase', { phase: 'reveal' });
    }

    openPanel() {
      this.phase = 'panel';
      this.setCameraShot('panel', 800);
    }

    closePanel() {
      if (this.phase !== 'panel') {
        return;
      }
      this.phase = 'keys';
      this.setCameraShot('keys', 700);
      emit('piano:phase', { phase: 'keys' });
    }

    applyArcadeLook(THREE, scene) {
      scene.background = new THREE.Color(0x04030a);
      scene.fog.color = new THREE.Color(0x0b0620);

      const spotLights = [];
      const pointLights = [];
      scene.children.forEach((object) => {
        if (object.isSpotLight) {
          spotLights.push(object);
        } else if (object.isPointLight && object !== this.hoverKeyLight) {
          pointLights.push(object);
        } else if (object.isAmbientLight) {
          object.color.set(0x1c1440);
        } else if (object.isHemisphereLight) {
          object.color.set(0x3a2a8a);
        }
      });
      if (spotLights[0]) spotLights[0].color.set(0xe4dcff);
      if (spotLights[1]) { spotLights[1].color.set(0x00d8ff); spotLights[1].intensity = 70; }
      if (pointLights[0]) { pointLights[0].color.set(0xff2bd6); pointLights[0].intensity = 12; }

      if (this.floor) {
        this.floor.material.map = null;
        this.floor.material.color.set(0x07060f);
        this.floor.material.roughness = 0.3;
        this.floor.material.metalness = 0.7;
        this.floor.material.needsUpdate = true;
      }
      const grid = this.grid = new THREE.GridHelper(24, 96, 0xff2bd6, 0x3a1f8a);
      grid.material.transparent = true;
      grid.material.opacity = 0.55;
      grid.material.depthWrite = false;
      grid.position.y = 0.003;
      scene.add(grid);

      const cyanEdges = new THREE.LineBasicMaterial({ color: 0x22e8ff, transparent: true, opacity: 0.9 });
      const magentaEdges = new THREE.LineBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0.85 });
      const navMaterials = this.navigationKeys.map((k) => k.material);
      const recoloredWoodMaterials = [];

      this.piano.traverse((object) => {
        if (!object.isMesh) {
          return;
        }
        const material = object.material;
        const geometryType = object.geometry.type;

        if (material.map && material.isMeshPhysicalMaterial) {
          if (recoloredWoodMaterials.indexOf(material) < 0) {
            recoloredWoodMaterials.push(material);
            material.map = null;
            material.color.set(0x0c0b16);
            material.needsUpdate = true;
          }
        } else if (material.map && material.isMeshStandardMaterial) {
          material.map = null;
          material.color.set(0x2a1f5c);
          material.emissive = new THREE.Color(0x12082e);
          material.needsUpdate = true;
        }

        if (geometryType === 'ExtrudeGeometry' && object.geometry.parameters.options.depth > 0.02) {
          object.add(new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 35), cyanEdges));
        }
        if (geometryType === 'CylinderGeometry') {
          object.add(new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 35), magentaEdges));
        }
        if (geometryType === 'BoxGeometry' && Math.abs(object.geometry.parameters.width - WHITE_KEY_WIDTH) < 1e-4 && navMaterials.indexOf(material) < 0) {
          material.color.set(0xdde2f2);
        }
      });

      this.navigationKeys.forEach((k) => {
        k.material.color.copy(new THREE.Color(0xffffff).lerp(k.color, 0.45));
      });
      this.lightShafts.forEach((shaft) => shaft.material.color.set(0x9b5cff));
      this.mistLayers.forEach((layer) => layer.material.color.set(0x5a2cff));
      this.dust.material.color.set(0x9ff8ff);
      this.dust.material.size = 0.02;
      this.burst.material.size = 0.007;

      const glowTexture = createGlowTexture(THREE, 0.9);
      this.gems = this.navigationKeys.map((k, index) => {
        const gemMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.017, 0.007, 0.014),
          new THREE.MeshBasicMaterial({ color: k.color, transparent: true, opacity: 0 })
        );
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTexture, color: k.color, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
        }));
        halo.scale.set(0.05, 0.05, 1);
        gemMesh.add(halo);
        gemMesh.position.set(k.pivot.position.x, 1, KEY_FRONT_Z - 0.035);
        scene.add(gemMesh);
        return { mesh: gemMesh, halo, key: k, cycle: (index * 0.37) % 1 };
      });

      const firstX = this.navigationKeys[0].pivot.position.x;
      const lastX = this.navigationKeys[this.navigationKeys.length - 1].pivot.position.x;
      this.hitLine = new THREE.Mesh(
        new THREE.PlaneGeometry(lastX - firstX + KEY_PITCH, 0.0025),
        new THREE.MeshBasicMaterial({ color: 0xff2bd6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      this.hitLine.position.set((firstX + lastX) / 2, KEYBED_Y + WHITE_KEY_HEIGHT / 2 + 0.004, KEY_FRONT_Z - 0.028);
      scene.add(this.hitLine);

      this.cameraShake = 0;
      const onNavigate = (event) => {
        this.cameraShake = 1;
        const key = this._findKeyById(event.detail && event.detail.id);
        if (key) {
          key.flash = 1;
          this._spawnBurst(key);
          this._spawnBurst(key);
          this._spawnBurst(key);
        }
      };
      window.addEventListener('piano:navigate', onNavigate);
      this._unbindArcadeLook = () => window.removeEventListener('piano:navigate', onNavigate);
    }

    _getAudioContext() {
      if (this.muted) {
        return null;
      }
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          return null;
        }
        const ac = this.audioContext = new AudioContextClass();
        const master = this.masterGain = ac.createGain();
        master.gain.value = 0.9;

        try {
          const convolver = ac.createConvolver();
          const length = ac.sampleRate * 1.8;
          const buffer = ac.createBuffer(2, length, ac.sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
              data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8) * 0.5;
            }
          }
          convolver.buffer = buffer;
          const wet = ac.createGain();
          wet.gain.value = 0.12;
          master.connect(convolver);
          convolver.connect(wet);
          wet.connect(ac.destination);
        } catch (error) {

        }
        master.connect(ac.destination);
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    }

    _playTone(hz, startTime, duration, volume, waveform) {
      const ac = this.audioContext;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = waveform;
      osc.frequency.setValueAtTime(hz, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.004);
      gain.gain.setValueAtTime(volume, startTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    }

    playChord(hz, soft) {
      const ac = this._getAudioContext();
      if (!ac) {
        return;
      }
      const t = ac.currentTime;
      if (soft) {
        this._playTone(hz * 2, t, 0.07, 0.05, 'square');
        return;
      }
      [1, 1.26, 1.5, 2].forEach((multiplier, i) => {
        this._playTone(hz * multiplier, t + i * 0.055, 0.09, 0.07, 'square');
      });
      this._playTone(hz / 2, t, 0.28, 0.09, 'triangle');
    }

    playStartChord() {
      const ac = this._getAudioContext();
      if (!ac) {
        return;
      }
      const t = ac.currentTime;
      [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => {
        this._playTone(hz, t + i * 0.06, 0.1, 0.06, 'square');
      });
    }

    _findKeyById(id) {
      for (let i = 0; i < this.navigationKeys.length; i++) {
        if (this.navigationKeys[i].spec.id === id) {
          return this.navigationKeys[i];
        }
      }
      return null;
    }

    _spawnBurst(key) {
      let spawned = 0;
      for (let i = 0; i < this.burstParticles.length && spawned < 14; i++) {
        const particle = this.burstParticles[i];
        if (particle.life > 0) {
          continue;
        }
        particle.life = 1;
        particle.x = key.pivot.position.x + (Math.random() - 0.5) * WHITE_KEY_WIDTH * 2.4;
        particle.y = KEYBED_Y + 0.004;
        particle.z = KEY_FRONT_Z - Math.random() * WHITE_KEY_LENGTH * 0.8;
        particle.vx = (Math.random() - 0.5) * 0.045;
        particle.vy = 0.03 + Math.random() * 0.055;
        particle.vz = (Math.random() - 0.5) * 0.03;
        spawned++;
      }
      this.burst.material.color.copy(key.color);
    }

    _resize() {
      if (!this.renderer) {
        return;
      }
      const width = this.clientWidth || 1;
      const height = this.clientHeight || 1;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    _bindEvents() {
      const THREE = window.THREE;
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      const canvas = this.renderer.domElement;
      let lastScrollTime = 0;

      const updatePointer = (event) => {
        const rect = canvas.getBoundingClientRect();
        pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };
      const pickKey = () => {
        raycaster.setFromCamera(pointerNdc, this.camera);
        const hit = raycaster.intersectObjects(this.keyMeshes, false)[0];
        return hit ? this._findKeyByMesh(hit.object) : null;
      };
      const setHovered = (key) => {
        if (this.hoveredKey === key) {
          return;
        }
        this.hoveredKey = key;
        canvas.style.cursor = key ? 'pointer' : 'default';
        if (key) {
          this.playChord(key.spec.hz, true);
          this._spawnBurst(key);
        }
        emit('piano:hover', { id: key ? key.spec.id : null });
      };
      const pressKey = (key) => {
        key.target = 1;
        this.playChord(key.spec.hz, false);
        emit('piano:navigate', { id: key.spec.id, color: hexToCss(key.spec.hex) });
        setTimeout(() => { key.target = 0; }, 260);
      };

      const onPointerMove = (event) => {
        if (this.phase !== 'keys') {
          return;
        }
        updatePointer(event);
        setHovered(pickKey());
      };
      const onPointerDown = (event) => {
        updatePointer(event);
        if (this.phase === 'reveal') {
          this.goToKeys();
          this._getAudioContext();
          return;
        }
        if (this.phase !== 'keys') {
          return;
        }
        const key = pickKey();
        if (key) {
          pressKey(key);
        }
      };
      const onWheel = (event) => {
        const now = Date.now();
        if (now - lastScrollTime < 400) {
          return;
        }
        lastScrollTime = now;
        if (this.phase === 'reveal' && event.deltaY > 0) {
          this.goToKeys();
        } else if (this.phase === 'keys' && event.deltaY < -0.5) {
          this.goToReveal();
        }
      };
      const onKeyDown = (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && this.phase === 'reveal') {
          this.goToKeys();
          this._getAudioContext();
        }
      };
      const onPointerLeave = () => setHovered(null);

      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('keydown', onKeyDown);

      const windowHandlers = {
        'piano:zoom': () => { this.goToKeys(); this._getAudioContext(); },
        'piano:reset': () => this.closePanel(),
        'piano:wide': () => this.goToReveal(),
        'piano:activate': (event) => {
          const key = this._findKeyById(event.detail && event.detail.id);
          if (!key) {
            return;
          }
          if (this.phase === 'reveal') {
            this.goToKeys();
          }
          pressKey(key);
          this._spawnBurst(key);
        },
        'piano:highlight': (event) => {
          const key = this._findKeyById(event.detail && event.detail.id);
          if (key) {
            this.playChord(key.spec.hz, true);
            this._spawnBurst(key);
          }
          this.hoveredKey = key;
          emit('piano:hover', { id: key ? key.spec.id : null });
        },
        'piano:open-panel': () => this.openPanel(),
        'piano:toggle-audio': () => {
          this.muted = !this.muted;
          if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 0.9;
          }
          if (!this.muted) {
            this._getAudioContext();
          }
          emit('piano:audio', { on: !this.muted });
        },
      };
      Object.keys(windowHandlers).forEach((name) => window.addEventListener(name, windowHandlers[name]));

      const resizeObserver = new ResizeObserver(() => this._resize());
      resizeObserver.observe(this);

      this._unbindEvents = () => {
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('keydown', onKeyDown);
        Object.keys(windowHandlers).forEach((name) => window.removeEventListener(name, windowHandlers[name]));
        resizeObserver.disconnect();
        if (this._unbindArcadeLook) {
          this._unbindArcadeLook();
        }
      };
    }

    _findKeyByMesh(mesh) {
      for (let i = 0; i < this.navigationKeys.length; i++) {
        if (this.navigationKeys[i].mesh === mesh) {
          return this.navigationKeys[i];
        }
      }
      return null;
    }

    _tick() {
      if (this._dead) {
        return;
      }
      this._raf = requestAnimationFrame(() => this._tick());

      const now = performance.now();
      const elapsed = (now - this.startTime) / 1000;
      const dt = Math.min(0.05, (now - (this._lastFrameTime || now)) / 1000);
      this._lastFrameTime = now;

      this._updateCamera(dt, elapsed);
      this._updateFadeIn(dt);
      this._updateFogAndMist(dt, elapsed);
      this._updateDust(dt);
      this._updateKeys(dt);
      this._updateBurstParticles(dt);
      this._updateArcadeLook(dt, elapsed);

      this.renderer.render(this.scene, this.camera);
    }

    _updateCamera(dt, elapsed) {
      if (this.cameraTween) {
        const tween = this.cameraTween;
        const k = clamp01((performance.now() - tween.startTime) / tween.duration);
        const eased = easeInOutCubic(k);
        this.cameraPosition.lerpVectors(tween.fromPosition, tween.to.position, eased);
        this.cameraTarget.lerpVectors(tween.fromTarget, tween.to.target, eased);
        this.camera.fov = tween.fromFov + (tween.to.fov - tween.fromFov) * eased;
        this.camera.updateProjectionMatrix();
        this.renderer.toneMappingExposure = tween.fromExposure + (tween.to.exposure - tween.fromExposure) * eased;
        if (k >= 1) {
          this.cameraTween = null;
        }
      } else if (this.phase === 'reveal') {

        this.orbitAngle += dt * 0.13;
        this.cameraPosition.set(
          Math.cos(this.orbitAngle) * this.orbitRadius,
          2.05 + Math.sin(elapsed * 0.25) * 0.13,
          Math.sin(this.orbitAngle) * this.orbitRadius
        );
      } else if (this.phase === 'keys') {

        const shot = this.shots.keys;
        this.cameraPosition.set(
          shot.position[0] + Math.sin(elapsed * 0.4) * 0.009,
          shot.position[1] + Math.sin(elapsed * 0.31) * 0.005,
          shot.position[2]
        );
      }
      this.camera.position.copy(this.cameraPosition);
      this.camera.lookAt(this.cameraTarget);
    }

    _updateFadeIn(dt) {
      if (this.blackVeil > 0) {
        this.blackVeil = Math.max(0, this.blackVeil - dt / 1.0);
        this.renderer.domElement.style.opacity = String(easeOutCubic(1 - this.blackVeil));
      }
    }

    _updateFogAndMist(dt, elapsed) {
      const wantMist = this.phase === 'reveal' ? 1 : 0.22;
      this.mistAmount += (wantMist - this.mistAmount) * Math.min(1, dt * 1.6);

      this.mistLayers.forEach((layer, i) => {
        layer.rotation.z += dt * (0.02 + i * 0.008);
        layer.material.opacity = (0.035 + 0.06 * Math.abs(Math.sin(elapsed * 0.2 + i))) * this.mistAmount * (1 - this.blackVeil * 0.4);
      });
      this.scene.fog.density = 0.022 + 0.055 * this.mistAmount;

      this.lightShafts.forEach((shaft, i) => {
        shaft.material.opacity = (i ? 0.05 : 0.028) * (0.5 + 0.5 * this.mistAmount);
      });
    }

    _updateDust(dt) {
      const positions = this.dust.geometry.attributes.position;
      const array = positions.array;
      for (let i = 0; i < this.dustSeeds.length; i++) {
        const yIndex = i * 3 + 1;
        array[yIndex] += dt * (0.014 + (i % 7) * 0.003);
        if (array[yIndex] > 3.4) {
          array[yIndex] = 0;
        }
        array[i * 3] += Math.sin(this._elapsedForDust(i)) * dt * 0.012;
      }
      positions.needsUpdate = true;
      this.dust.material.opacity = (this.phase === 'reveal' ? 0.5 : 0.36) * (1 - this.blackVeil * 0.5);
    }

    _elapsedForDust(i) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      return elapsed * 0.35 + this.dustSeeds[i];
    }

    _updateKeys(dt) {
      const hovered = this.hoveredKey;
      let hoverLightStrength = 0;

      for (const key of this.navigationKeys) {
        const wantsPress = key.target || (hovered === key ? 1 : 0);
        key.press += (wantsPress - key.press) * Math.min(1, dt * 12);
        key.pivot.rotation.x = key.press * 0.042;

        key.material.emissiveIntensity = 0.2 + key.press * 0.8;
        key.glow.material.opacity = 0.34 + key.press * 0.5;
        const glowScale = 0.026 + key.press * 0.02;
        key.glow.scale.set(glowScale, glowScale, 1);
        key.colorPool.material.opacity = 0.7 + key.press * 0.3;

        if (hovered === key) {
          this.hoverKeyLight.color.copy(key.color);
          this.hoverKeyLight.position.set(key.pivot.position.x, KEYBED_Y - 0.03, KEY_FRONT_Z + 0.05);
          hoverLightStrength = key.press * 1.1;
        }
      }
      this.hoverKeyLight.intensity += (hoverLightStrength * 0.34 - this.hoverKeyLight.intensity) * Math.min(1, dt * 10);
    }

    _updateBurstParticles(dt) {
      const positions = this.burst.geometry.attributes.position;
      const array = positions.array;
      let strongestLife = 0;

      for (let i = 0; i < this.burstParticles.length; i++) {
        const p = this.burstParticles[i];
        if (p.life <= 0) {
          array[i * 3 + 1] = -99;
          continue;
        }
        p.life -= dt / 0.85;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy *= 0.985;
        array[i * 3] = p.x;
        array[i * 3 + 1] = p.y;
        array[i * 3 + 2] = p.z;
        strongestLife = Math.max(strongestLife, p.life);
      }
      positions.needsUpdate = true;
      this.burst.material.opacity = strongestLife * 0.42;
    }

    _updateArcadeLook(dt, elapsed) {
      if (!this.gems) {
        return;
      }

      this.grid.position.z = (elapsed * 0.35) % 0.25;

      const wantGemVisibility = this.phase !== 'reveal' ? 1 : 0;
      this.gemVisibility = (this.gemVisibility || 0) + (wantGemVisibility - (this.gemVisibility || 0)) * Math.min(1, dt * 3);
      const beat = Math.pow(0.5 + 0.5 * Math.cos(elapsed * Math.PI * 2 / 0.6), 6);

      for (const key of this.navigationKeys) {
        key.flash = Math.max(0, key.flash - dt * 3);
        key.material.emissiveIntensity = 0.35 + beat * 0.12 + key.press * 1.2 + key.flash * 0.9;
        const glowScale = 0.034 + key.press * 0.03 + key.flash * 0.03;
        key.glow.scale.set(glowScale, glowScale, 1);
        key.glow.material.opacity = 0.55 + key.press * 0.45;
      }

      for (const gem of this.gems) {
        gem.cycle += dt / 1.9;
        if (gem.cycle >= 1) {
          gem.cycle -= 1;
          gem.key.flash = Math.max(gem.key.flash, 0.6);
        }
        gem.mesh.position.y = KEYBED_Y + WHITE_KEY_HEIGHT / 2 + 0.008 + (1 - gem.cycle) * 0.24;
        const opacity = Math.min(1, gem.cycle * 4) * this.gemVisibility;
        gem.mesh.material.opacity = opacity;
        gem.halo.material.opacity = opacity * 0.6;
      }

      this.hitLine.material.opacity = (0.35 + beat * 0.4) * this.gemVisibility;

      if (this.cameraShake > 0) {
        this.cameraShake = Math.max(0, this.cameraShake - dt * 3.2);
        const shakeAmount = this.cameraShake * this.cameraShake * 0.006;
        this.camera.position.x += (Math.random() - 0.5) * shakeAmount;
        this.camera.position.y += (Math.random() - 0.5) * shakeAmount;
      }

      this.burst.material.opacity = Math.min(1, this.burst.material.opacity * 2.2);
    }
  }

  if (!window.customElements.get('piano-arena')) {
    window.customElements.define('piano-arena', PianoArena);
  }
  window.ARENA_KEYS = KEYS;
})();