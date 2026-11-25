/* ==========================================================================
   SPRUNKI STUDIO — Interactive Drag & Drop Controller & Stage UI
   ========================================================================== */

(function () {
  'use strict';

  const { CHARACTERS, CHAR_MAP, CATEGORY_COLORS, renderOutfitIcon, renderStageCharacter } =
    window.SPRUNKI_DATA;

  const engine = new window.SprunkiAudioEngine();

  // Application State
  const SLOT_COUNT = 7;
  const slots = Array.from({ length: SLOT_COUNT }, () => ({
    charId: null,
    muted: false,
    solo: false,
  }));

  let currentTheme = 'normal'; // 'normal' | 'horror' | 'underwater'
  let preferredSpecialTheme = 'normal';
  let dragState = null; // { charId, sourceType: 'tray'|'slot', sourceSlotIndex, startX, startY, moved }
  let toastTimeout = null;

  // DOM References
  const stageEl = document.getElementById('character-stage');
  const trayEl = document.getElementById('outfit-tray');
  const dragGhostEl = document.getElementById('drag-ghost');
  const fxLayerEl = document.getElementById('fx-layer');
  const stageHintEl = document.getElementById('stage-hint');
  const glitchOverlayEl = document.getElementById('glitch-overlay');
  const phaseLabelEl = document.getElementById('phase-label');
  const bpmValueEl = document.getElementById('bpm-value');
  const clockProgressEl = document.getElementById('clock-progress');
  const clockBarNumEl = document.getElementById('clock-bar-num');
  const mysteryHintEl = document.getElementById('mystery-hint');
  const toastEl = document.getElementById('toast');

  // Controls
  const btnPlayPause = document.getElementById('btn-play-pause');
  const playIconEl = document.getElementById('play-icon');
  const playTextEl = document.getElementById('play-text');
  const btnPresets = document.getElementById('btn-presets');
  const presetMenu = document.getElementById('preset-menu');
  const btnRandom = document.getElementById('btn-random');
  const btnRecord = document.getElementById('btn-record');
  const recTextEl = document.getElementById('rec-text');
  const btnClear = document.getElementById('btn-clear');
  const volumeSlider = document.getElementById('master-volume');
  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const visCtx = visualizerCanvas.getContext('2d');

  // Preset Mixes
  const PRESETS = {
    friends: ['oren', 'connor', 'gray', 'mrsun', 'allison', 'doug', 'pinki'],
    sunny: ['oren', 'raddy', 'clukr', 'gray', 'mrsun', 'simon', 'pinki'],
    electro: ['oren', 'funbot', 'vineria', 'garnold', 'owakcx', 'funcomputer', 'wenda'],
    choir: ['vineria', 'sky', 'mrsun', 'mrtree', 'tunner', 'pinki', 'jevin'],
    western: ['oren', 'raddy', 'brud', 'gray', 'mrtree', 'tunner', 'wenda'],
    underwater: ['oren', 'raddy', 'connor', 'garnold', 'allison', 'pinki', 'aqua'],
    phonk: ['oren', 'raddy', 'connor', 'gray', 'brud', 'jevin', 'drift'],
    horror: ['oren', 'raddy', 'gray', 'sky', 'mrsun', 'jevin', 'black'],
  };

  /* ------------------------------------------------------------------------
     Initialization
     ------------------------------------------------------------------------ */
  function init() {
    buildStageSlots();
    buildOutfitTray();
    bindGlobalControls();
    bindPointerDragEvents();

    engine.setSlots(slots);
    engine.onStepCallback = handleAudioStep;

    startVisualizerLoop();
    updateUIState();
  }

  function buildStageSlots() {
    stageEl.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'char-slot';
      slotEl.dataset.slotIndex = String(i);
      slotEl.innerHTML = `
        <div class="slot-name-pill" data-role="name"></div>
        <div class="char-avatar-wrap" data-role="avatar" title="Drag an outfit here">
          ${renderStageCharacter(null, currentTheme)}
        </div>
        <div class="slot-controls">
          <button class="slot-mini-btn btn-mute" data-action="mute" title="Mute character">M</button>
          <button class="slot-mini-btn btn-solo" data-action="solo" title="Solo character">S</button>
          <button class="slot-mini-btn btn-remove" data-action="remove" title="Remove outfit">×</button>
        </div>
      `;

      // Slot mini control handlers
      slotEl.querySelector('[data-action="mute"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute(i);
      });
      slotEl.querySelector('[data-action="solo"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSolo(i);
      });
      slotEl.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCharacterFromSlot(i);
      });

      // Drag from occupied slot (to swap or drag off stage)
      const avatarWrap = slotEl.querySelector('[data-role="avatar"]');
      avatarWrap.addEventListener('pointerdown', (e) => {
        if (!slots[i].charId || e.button > 0) return;
        engine.init();
        startDrag(e, {
          charId: slots[i].charId,
          sourceType: 'slot',
          sourceSlotIndex: i,
        });
      });

      stageEl.appendChild(slotEl);
    }
  }

  function buildOutfitTray() {
    trayEl.innerHTML = '';
    CHARACTERS.forEach((char) => {
      const tile = document.createElement('div');
      let extraClass = '';
      if (char.isHorrorTrigger) extraClass = ' is-black-hat';
      if (char.isUnderwaterTrigger) extraClass = ' is-aqua-helmet';
      if (char.isPhonkTrigger) extraClass = ' is-drift-phonk';
      tile.className = 'outfit-tile' + extraClass;
      tile.dataset.charId = char.id;
      tile.title = `${char.name} — ${char.role} (Drag onto a character or click)`;

      const catColor = CATEGORY_COLORS[char.category] || '#ccc';
      tile.innerHTML = `
        <span class="outfit-cat-dot" style="background:${catColor}"></span>
        <div class="outfit-icon-wrap">${renderOutfitIcon(char.id, currentTheme)}</div>
        <span class="outfit-label">${char.name}</span>
      `;

      tile.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        if (isCharacterEquipped(char.id)) return;
        engine.init();
        startDrag(e, {
          charId: char.id,
          sourceType: 'tray',
          sourceSlotIndex: -1,
        });
      });

      trayEl.appendChild(tile);
    });
  }

  /* ------------------------------------------------------------------------
     Slot Assignment & Phase 2 Horror Mode Logic
     ------------------------------------------------------------------------ */
  function isCharacterEquipped(charId) {
    return slots.some((s) => s.charId === charId);
  }

  function equipCharacter(slotIndex, charId, playFx = true) {
    if (slotIndex < 0 || slotIndex >= SLOT_COUNT || !CHAR_MAP[charId]) return;
    engine.init();

    // Prevent duplicate character on stage
    const existingIdx = slots.findIndex((s) => s.charId === charId);
    if (existingIdx !== -1 && existingIdx !== slotIndex) {
      slots[existingIdx].charId = null;
      slots[existingIdx].muted = false;
      slots[existingIdx].solo = false;
      renderSingleSlot(existingIdx, false);
    }

    slots[slotIndex].charId = charId;
    slots[slotIndex].muted = false;
    slots[slotIndex].solo = false;

    const char = CHAR_MAP[charId];
    if (char.isHorrorTrigger) preferredSpecialTheme = 'horror';
    if (char.isUnderwaterTrigger) preferredSpecialTheme = 'underwater';
    if (char.isPhonkTrigger) preferredSpecialTheme = 'phonk';

    const targetTheme = computeActiveTheme();

    if (targetTheme !== currentTheme) {
      setThemePhase(targetTheme);
    } else {
      renderSingleSlot(slotIndex, true);
    }

    if (playFx) {
      const triggerMode = char.isHorrorTrigger
        ? 'horror'
        : char.isUnderwaterTrigger
        ? 'underwater'
        : char.isPhonkTrigger
        ? 'phonk'
        : null;
      engine.playEquipStinger(charId, triggerMode);
      const particleColor =
        currentTheme === 'horror'
          ? '#d91e36'
          : currentTheme === 'underwater'
          ? '#00f0ff'
          : currentTheme === 'phonk'
          ? '#ff2e93'
          : char.color;
      spawnSlotParticles(slotIndex, particleColor);
    }

    if (!engine.isPlaying) {
      setPlayingState(true);
    }

    engine.setSlots(slots);
    updateUIState();
  }

  function computeActiveTheme() {
    const present = [];
    if (slots.some((s) => s.charId === 'black')) present.push('horror');
    if (slots.some((s) => s.charId === 'aqua')) present.push('underwater');
    if (slots.some((s) => s.charId === 'drift')) present.push('phonk');
    if (present.length === 0) return 'normal';
    if (present.includes(preferredSpecialTheme)) return preferredSpecialTheme;
    return present[present.length - 1];
  }

  function swapOrMoveSlot(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const temp = { ...slots[toIndex] };
    slots[toIndex] = { ...slots[fromIndex] };
    slots[fromIndex] = temp;

    renderSingleSlot(fromIndex, !!slots[fromIndex].charId);
    renderSingleSlot(toIndex, !!slots[toIndex].charId);
    engine.setSlots(slots);
    updateUIState();
  }

  function removeCharacterFromSlot(slotIndex) {
    if (!slots[slotIndex].charId) return;
    slots[slotIndex].charId = null;
    slots[slotIndex].muted = false;
    slots[slotIndex].solo = false;

    const targetTheme = computeActiveTheme();
    if (targetTheme !== currentTheme) {
      setThemePhase(targetTheme);
    } else {
      renderSingleSlot(slotIndex, false);
    }

    engine.setSlots(slots);
    updateUIState();
  }

  function toggleMute(slotIndex) {
    if (!slots[slotIndex].charId) return;
    slots[slotIndex].muted = !slots[slotIndex].muted;
    if (slots[slotIndex].muted) slots[slotIndex].solo = false;
    engine.setSlots(slots);
    updateSlotControlVisuals(slotIndex);
  }

  function toggleSolo(slotIndex) {
    if (!slots[slotIndex].charId) return;
    slots[slotIndex].solo = !slots[slotIndex].solo;
    if (slots[slotIndex].solo) slots[slotIndex].muted = false;
    engine.setSlots(slots);
    for (let i = 0; i < SLOT_COUNT; i++) updateSlotControlVisuals(i);
  }

  function setThemePhase(theme) {
    currentTheme = theme;
    engine.setTheme(theme);

    // Transition flash (glitch for horror, aqua wave splash for underwater, neon drift flash for phonk)
    glitchOverlayEl.classList.remove('active', 'splash-active', 'phonk-active');
    void glitchOverlayEl.offsetWidth;
    if (theme === 'underwater') {
      glitchOverlayEl.classList.add('splash-active');
    } else if (theme === 'phonk') {
      glitchOverlayEl.classList.add('phonk-active');
    } else {
      glitchOverlayEl.classList.add('active');
    }

    document.body.classList.toggle('phase-horror', theme === 'horror');
    document.body.classList.toggle('phase-underwater', theme === 'underwater');
    document.body.classList.toggle('phase-phonk', theme === 'phonk');
    document.body.classList.toggle('phase-normal', theme === 'normal');

    phaseLabelEl.textContent =
      theme === 'horror'
        ? 'PHASE 2'
        : theme === 'underwater'
        ? 'DEEP TECHNO'
        : theme === 'phonk'
        ? 'DRIFT PHONK'
        : 'STUDIO';
    bpmValueEl.textContent = String(engine.bpm);
    mysteryHintEl.textContent =
      theme === 'horror'
        ? '👁️ HORROR MODE — Remove Black to return'
        : theme === 'underwater'
        ? '🌊 UNDERWATER TECHNO — Remove Aqua to return'
        : theme === 'phonk'
        ? '🔥 DRIFT PHONK — Remove Drift to return'
        : '👁️ Black · 🌊 Aqua · 🔥 Drift = Theme Modes';

    // Re-render all slots & tray icons in the new theme
    for (let i = 0; i < SLOT_COUNT; i++) {
      renderSingleSlot(i, !!slots[i].charId);
    }
    refreshTrayIcons();

    if (theme === 'horror') {
      showToast('👁️ Welcome to Phase 2...');
    } else if (theme === 'underwater') {
      showToast('🌊 Diving into Underwater Techno (128 BPM)!');
    } else if (theme === 'phonk') {
      showToast('🔥 DRIFT PHONK ENGAGED (136 BPM)!');
    } else {
      showToast('☀️ Back to Sunny Mode!');
    }
  }

  function renderSingleSlot(index, animatePop) {
    const slotEl = stageEl.children[index];
    if (!slotEl) return;
    const slot = slots[index];
    const avatarWrap = slotEl.querySelector('[data-role="avatar"]');
    const namePill = slotEl.querySelector('[data-role="name"]');

    avatarWrap.innerHTML = renderStageCharacter(slot.charId, currentTheme);
    slotEl.classList.toggle('occupied', !!slot.charId);

    if (slot.charId) {
      const c = CHAR_MAP[slot.charId];
      namePill.textContent = `${c.name} · ${c.role}`;
      avatarWrap.title = `${c.name} (${c.role}) — Drag to swap or drag off to remove`;
    } else {
      namePill.textContent = '';
      avatarWrap.title = 'Drag an outfit onto this character';
    }

    if (animatePop) {
      slotEl.classList.remove('just-equipped');
      void slotEl.offsetWidth;
      slotEl.classList.add('just-equipped');
      setTimeout(() => slotEl.classList.remove('just-equipped'), 550);
    }

    updateSlotControlVisuals(index);
  }

  function updateSlotControlVisuals(index) {
    const slotEl = stageEl.children[index];
    if (!slotEl) return;
    const slot = slots[index];
    const anySolo = slots.some((s) => s.charId && s.solo);
    const effectivelyMuted = slot.muted || (anySolo && !slot.solo && !!slot.charId);

    slotEl.classList.toggle('muted', effectivelyMuted);
    slotEl.querySelector('.btn-mute').classList.toggle('active-mute', slot.muted);
    slotEl.querySelector('.btn-solo').classList.toggle('active-solo', slot.solo);
  }

  function refreshTrayIcons() {
    const tiles = trayEl.querySelectorAll('.outfit-tile');
    tiles.forEach((tile) => {
      const charId = tile.dataset.charId;
      tile.querySelector('.outfit-icon-wrap').innerHTML = renderOutfitIcon(charId, currentTheme);
    });
  }

  function updateUIState() {
    const equippedIds = new Set(slots.filter((s) => s.charId).map((s) => s.charId));
    const hasAny = equippedIds.size > 0;

    stageHintEl.classList.toggle('hidden-hint', hasAny);

    trayEl.querySelectorAll('.outfit-tile').forEach((tile) => {
      const inUse = equippedIds.has(tile.dataset.charId);
      tile.classList.toggle('in-use', inUse);
    });
  }

  /* ------------------------------------------------------------------------
     Pointer Drag-and-Drop (Mouse + Touch + Click-to-Equip Fallback)
     ------------------------------------------------------------------------ */
  function startDrag(e, info) {
    e.preventDefault();
    dragState = {
      ...info,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  }

  function bindPointerDragEvents() {
    window.addEventListener('pointermove', (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (!dragState.moved && Math.hypot(dx, dy) > 6) {
        dragState.moved = true;
        dragGhostEl.innerHTML = renderOutfitIcon(dragState.charId, currentTheme);
        dragGhostEl.classList.remove('hidden');
      }

      if (dragState.moved) {
        dragGhostEl.style.left = `${e.clientX}px`;
        dragGhostEl.style.top = `${e.clientY}px`;
        highlightHoveredSlot(e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!dragState) return;
      const currentDrag = dragState;
      dragState = null;

      dragGhostEl.classList.add('hidden');
      clearSlotHighlights();

      // Quick tap / click on a tray outfit -> auto-equip in first open slot!
      if (!currentDrag.moved && currentDrag.sourceType === 'tray') {
        const emptyIndex = slots.findIndex((s) => !s.charId);
        if (emptyIndex !== -1) {
          equipCharacter(emptyIndex, currentDrag.charId, true);
        } else {
          showToast('Stage is full! Drag onto a character to replace them.');
        }
        return;
      }

      if (!currentDrag.moved) return;

      const targetIndex = findSlotAtPoint(e.clientX, e.clientY);

      if (currentDrag.sourceType === 'tray') {
        if (targetIndex !== -1) {
          equipCharacter(targetIndex, currentDrag.charId, true);
        }
      } else if (currentDrag.sourceType === 'slot') {
        if (targetIndex !== -1) {
          swapOrMoveSlot(currentDrag.sourceSlotIndex, targetIndex);
        } else {
          // Dragged off stage -> remove outfit
          removeCharacterFromSlot(currentDrag.sourceSlotIndex);
        }
      }
    });

    window.addEventListener('pointercancel', () => {
      dragState = null;
      dragGhostEl.classList.add('hidden');
      clearSlotHighlights();
    });
  }

  function findSlotAtPoint(x, y) {
    const slotEls = stageEl.querySelectorAll('.char-slot');
    for (let i = 0; i < slotEls.length; i++) {
      const rect = slotEls[i].getBoundingClientRect();
      // Slightly generous drop zone vertically
      if (x >= rect.left - 4 && x <= rect.right + 4 && y >= rect.top - 24 && y <= rect.bottom + 14) {
        return i;
      }
    }
    return -1;
  }

  function highlightHoveredSlot(x, y) {
    const hoveredIdx = findSlotAtPoint(x, y);
    const slotEls = stageEl.querySelectorAll('.char-slot');
    slotEls.forEach((el, idx) => {
      el.classList.toggle('drag-over', idx === hoveredIdx);
    });
  }

  function clearSlotHighlights() {
    stageEl.querySelectorAll('.char-slot.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  /* ------------------------------------------------------------------------
     Audio Beat Clock -> Real-Time Character Animations
     ------------------------------------------------------------------------ */
  function handleAudioStep(step, activeEvents) {
    // Update circular loop clock ring
    const circumference = 94.25;
    const progress = (step + 1) / 64;
    clockProgressEl.style.strokeDashoffset = String(circumference * (1 - progress));
    clockBarNumEl.textContent = String(Math.floor(step / 16) + 1);

    // Trigger per-character synced animations
    for (const ev of activeEvents) {
      const slotEl = stageEl.children[ev.slotIndex];
      if (!slotEl) continue;
      const avatar = slotEl.querySelector('[data-role="avatar"]');
      if (!avatar) continue;

      if (ev.type === 'sing') {
        avatar.classList.add('singing');
        clearTimeout(avatar._singTimer);
        avatar._singTimer = setTimeout(() => avatar.classList.remove('singing'), 210);
      }

      if (currentTheme === 'horror' && Math.random() < 0.25) {
        avatar.classList.remove('horror-twitch');
        void avatar.offsetWidth;
        avatar.classList.add('horror-twitch');
      } else if (ev.type === 'sway') {
        const cls = step % 8 < 4 ? 'beat-sway-left' : 'beat-sway-right';
        avatar.classList.remove('beat-sway-left', 'beat-sway-right');
        void avatar.offsetWidth;
        avatar.classList.add(cls);
      } else {
        avatar.classList.remove('beat-hit');
        void avatar.offsetWidth;
        avatar.classList.add('beat-hit');
      }
    }
  }

  /* ------------------------------------------------------------------------
     Top Bar Controls, Presets, Recording & Keyboard Shortcuts
     ------------------------------------------------------------------------ */
  function setPlayingState(playing) {
    engine.setPlaying(playing);
    playIconEl.textContent = playing ? '❚❚' : '▶';
    playTextEl.textContent = playing ? 'Pause' : 'Play';
  }

  function loadPreset(name) {
    const list = PRESETS[name];
    if (!list) return;
    engine.init();

    // Clear existing silently
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots[i] = { charId: null, muted: false, solo: false };
    }

    const wantTheme = list.includes('black')
      ? 'horror'
      : list.includes('aqua')
      ? 'underwater'
      : list.includes('drift')
      ? 'phonk'
      : 'normal';
    preferredSpecialTheme = wantTheme;
    list.slice(0, SLOT_COUNT).forEach((charId, idx) => {
      slots[idx].charId = charId;
    });

    if (wantTheme !== currentTheme) {
      setThemePhase(wantTheme);
    } else {
      for (let i = 0; i < SLOT_COUNT; i++) renderSingleSlot(i, !!slots[i].charId);
    }

    engine.setSlots(slots);
    setPlayingState(true);
    updateUIState();
    showToast(`Loaded "${name.charAt(0).toUpperCase() + name.slice(1)}" mix!`);
  }

  function randomizeMix() {
    engine.init();
    // Pick balanced mix: 2 beats, 1-2 effects, 2 melodies, 1-2 vocals (preserving current theme)
    const poolByCat = {
      beats: CHARACTERS.filter((c) => c.category === 'beats'),
      effects: CHARACTERS.filter((c) => c.category === 'effects'),
      melodies: CHARACTERS.filter((c) => c.category === 'melodies'),
      vocals: CHARACTERS.filter(
        (c) =>
          c.category === 'vocals' &&
          !c.isHorrorTrigger &&
          !c.isUnderwaterTrigger &&
          !c.isPhonkTrigger
      ),
    };

    const pick = (arr, count) => {
      const copy = [...arr];
      const chosen = [];
      while (chosen.length < count && copy.length) {
        const idx = Math.floor(Math.random() * copy.length);
        chosen.push(copy.splice(idx, 1)[0].id);
      }
      return chosen;
    };

    const chosenIds = [
      ...pick(poolByCat.beats, 2),
      ...pick(poolByCat.effects, 1),
      ...pick(poolByCat.melodies, 2),
      ...pick(poolByCat.vocals, 1),
    ];

    if (currentTheme === 'horror') {
      chosenIds.push('black');
    } else if (currentTheme === 'underwater') {
      chosenIds.push('aqua');
    } else if (currentTheme === 'phonk') {
      chosenIds.push('drift');
    } else {
      chosenIds.push(...pick(poolByCat.effects.filter((c) => !chosenIds.includes(c.id)), 1));
    }

    for (let i = 0; i < SLOT_COUNT; i++) {
      slots[i] = { charId: chosenIds[i] || null, muted: false, solo: false };
      renderSingleSlot(i, !!slots[i].charId);
    }

    engine.setSlots(slots);
    setPlayingState(true);
    updateUIState();
    showToast('🎲 Randomized a fresh mix!');
  }

  function clearAllSlots() {
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots[i] = { charId: null, muted: false, solo: false };
    }
    preferredSpecialTheme = 'normal';
    if (currentTheme !== 'normal') {
      setThemePhase('normal');
    } else {
      for (let i = 0; i < SLOT_COUNT; i++) renderSingleSlot(i, false);
    }
    engine.setSlots(slots);
    updateUIState();
    showToast('Stage cleared!');
  }

  function bindGlobalControls() {
    btnPlayPause.addEventListener('click', () => {
      setPlayingState(!engine.isPlaying);
    });

    btnPresets.addEventListener('click', (e) => {
      e.stopPropagation();
      presetMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      presetMenu.classList.remove('open');
    });

    presetMenu.querySelectorAll('button[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        presetMenu.classList.remove('open');
        loadPreset(btn.dataset.preset);
      });
    });

    btnRandom.addEventListener('click', randomizeMix);
    btnClear.addEventListener('click', clearAllSlots);

    volumeSlider.addEventListener('input', () => {
      engine.init();
      engine.setVolume(Number(volumeSlider.value) / 100);
    });

    btnRecord.addEventListener('click', () => {
      const res = engine.toggleRecording((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sprunki-mix-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        showToast('💾 Mix recording downloaded!');
      });

      if (!res.supported) {
        showToast('Recording is not supported in this browser.');
        return;
      }

      btnRecord.classList.toggle('recording', res.recording);
      recTextEl.textContent = res.recording ? 'Stop' : 'Rec';
      if (res.recording) {
        showToast('🔴 Recording your live mix... click Stop to save!');
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlayingState(!engine.isPlaying);
      } else if (e.key === 'r' || e.key === 'R') {
        randomizeMix();
      } else if (e.key === 'c' || e.key === 'C') {
        clearAllSlots();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Visual FX: Particles, Toast & Real-Time Audio Visualizer
     ------------------------------------------------------------------------ */
  function spawnSlotParticles(slotIndex, color) {
    const slotEl = stageEl.children[slotIndex];
    if (!slotEl) return;
    const stageRect = fxLayerEl.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    const cx = slotRect.left + slotRect.width / 2 - stageRect.left;
    const cy = slotRect.top + slotRect.height * 0.45 - stageRect.top;

    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'fx-particle';
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const dist = 34 + Math.random() * 44;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.background = color;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      fxLayerEl.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.add('hidden'), 2600);
  }

  function startVisualizerLoop() {
    const freqData = new Uint8Array(64);

    function resize() {
      visualizerCanvas.width = visualizerCanvas.clientWidth || window.innerWidth;
      visualizerCanvas.height = visualizerCanvas.clientHeight || 120;
    }
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      requestAnimationFrame(frame);
      const w = visualizerCanvas.width;
      const h = visualizerCanvas.height;
      visCtx.clearRect(0, 0, w, h);

      if (!engine.getFrequencyData(freqData)) return;

      const barCount = 36;
      const gap = 6;
      const barW = Math.max(4, (w - gap * (barCount - 1)) / barCount);

      if (currentTheme === 'underwater') {
        const grad = visCtx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(1, '#ff3ec8');
        visCtx.fillStyle = grad;
      } else if (currentTheme === 'phonk') {
        const grad = visCtx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#9d17ff');
        grad.addColorStop(1, '#ff2e93');
        visCtx.fillStyle = grad;
      } else {
        visCtx.fillStyle = currentTheme === 'horror' ? '#d91e36' : '#ffffff';
      }
      for (let i = 0; i < barCount; i++) {
        const val = freqData[i] / 255;
        const barH = Math.max(3, val * h * 0.9);
        const x = i * (barW + gap);
        visCtx.beginPath();
        visCtx.roundRect(x, h - barH, barW, barH, [6, 6, 0, 0]);
        visCtx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  // Launch!
  init();
})();
