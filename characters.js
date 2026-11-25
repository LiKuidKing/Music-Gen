/* ==========================================================================
   SPRUNKI STUDIO — Character Catalog & Bespoke SVG Renderer
   20 Characters (Beats, Effects, Melodies, Vocals + Black Hat Horror Trigger)
   ========================================================================== */

(function (global) {
  'use strict';

  const CATEGORY_COLORS = {
    beats: '#ff8a3d',
    effects: '#5cb8ff',
    melodies: '#ffd54a',
    vocals: '#ff7ec3',
  };

  const CHARACTERS = [
    // === ROW 1: BEATS (1-5) & EFFECTS (6-10) ===
    {
      id: 'oren',
      name: 'Oren',
      role: 'Punchy Kick',
      category: 'beats',
      color: '#ff8833',
      horrorColor: '#6e2a14',
      accent: '#232834',
      anim: 'bounce',
    },
    {
      id: 'raddy',
      name: 'Raddy',
      role: 'Snare & Clap',
      category: 'beats',
      color: '#eb3b3b',
      horrorColor: '#590b10',
      accent: '#a81212',
      anim: 'bounce',
    },
    {
      id: 'clukr',
      name: 'Clukr',
      role: 'Cymbal Hats',
      category: 'beats',
      color: '#b6bec9',
      horrorColor: '#484b52',
      accent: '#f0c43d',
      anim: 'bounce',
    },
    {
      id: 'funbot',
      name: 'Fun Bot',
      role: 'Electro Break',
      category: 'beats',
      color: '#9aa4b2',
      horrorColor: '#3b3f47',
      accent: '#f6c844',
      anim: 'bounce',
    },
    {
      id: 'vineria',
      name: 'Vineria',
      role: 'Vine Shakers',
      category: 'beats',
      color: '#46c459',
      horrorColor: '#1d4a26',
      accent: '#ff5e8a',
      anim: 'sway',
    },
    {
      id: 'gray',
      name: 'Gray',
      role: 'Sub Bass',
      category: 'effects',
      color: '#8e939e',
      horrorColor: '#3a3c42',
      accent: '#575c66',
      anim: 'bounce',
    },
    {
      id: 'brud',
      name: 'Brud',
      role: 'Bucket Perc',
      category: 'effects',
      color: '#8f5d38',
      horrorColor: '#3d2414',
      accent: '#7f8a96',
      anim: 'bounce',
    },
    {
      id: 'garnold',
      name: 'Garnold',
      role: 'Funky Synth',
      category: 'effects',
      color: '#e5b938',
      horrorColor: '#664d14',
      accent: '#202632',
      anim: 'sway',
    },
    {
      id: 'owakcx',
      name: 'OWAKCX',
      role: 'Glitch Zap',
      category: 'effects',
      color: '#a3eb38',
      horrorColor: '#3d5717',
      accent: '#579612',
      anim: 'bounce',
    },
    {
      id: 'sky',
      name: 'Sky',
      role: 'Music Box',
      category: 'effects',
      color: '#5ed4f0',
      horrorColor: '#235361',
      accent: '#3098b8',
      anim: 'sway',
    },

    // === ROW 2: MELODIES (11-15) & VOCALS (16-20) ===
    {
      id: 'mrsun',
      name: 'Mr. Sun',
      role: 'Sunny Chords',
      category: 'melodies',
      color: '#ffd93b',
      horrorColor: '#8c2814',
      accent: '#ff961f',
      anim: 'sway',
    },
    {
      id: 'durple',
      name: 'Durple',
      role: 'Horn Brass',
      category: 'melodies',
      color: '#9b59e6',
      horrorColor: '#3d1b63',
      accent: '#6c2eb8',
      anim: 'sing',
    },
    {
      id: 'mrtree',
      name: 'Mr. Tree',
      role: 'Warm Organ',
      category: 'melodies',
      color: '#8a5534',
      horrorColor: '#2b1a14',
      accent: '#38a84b',
      anim: 'sway',
    },
    {
      id: 'simon',
      name: 'Simon',
      role: '8-Bit Arp',
      category: 'melodies',
      color: '#ffe033',
      horrorColor: '#6e5c10',
      accent: '#ffae00',
      anim: 'sing',
    },
    {
      id: 'tunner',
      name: 'Tunner',
      role: 'Whistle Lead',
      category: 'melodies',
      color: '#d4b48c',
      horrorColor: '#5c4938',
      accent: '#7a5230',
      anim: 'sing',
    },
    {
      id: 'funcomputer',
      name: 'Fun Comp',
      role: 'Chiptune Vox',
      category: 'vocals',
      color: '#d7dde6',
      horrorColor: '#2f343d',
      accent: '#28d8a2',
      anim: 'sing',
    },
    {
      id: 'wenda',
      name: 'Wenda',
      role: 'Hey! Chant',
      category: 'vocals',
      color: '#f5f7fa',
      horrorColor: '#756f75',
      accent: '#d9dfe8',
      anim: 'sing',
    },
    {
      id: 'pinki',
      name: 'Pinki',
      role: 'Soprano Choir',
      category: 'vocals',
      color: '#ff94cb',
      horrorColor: '#6b2243',
      accent: '#ff3b8d',
      anim: 'sing',
    },
    {
      id: 'jevin',
      name: 'Jevin',
      role: 'Bass Choir',
      category: 'vocals',
      color: '#254a9e',
      horrorColor: '#101d42',
      accent: '#152d6b',
      anim: 'sing',
    },
    {
      id: 'black',
      name: 'Black',
      role: 'Phase 2 Mode',
      category: 'vocals',
      color: '#18181f',
      horrorColor: '#09070c',
      accent: '#d91e36',
      anim: 'sing',
      isHorrorTrigger: true,
    },

    // === CUSTOM FRIENDS ===
    {
      id: 'connor',
      name: 'Connor',
      role: 'Trap & Toms',
      category: 'beats',
      color: '#2b9df4',
      horrorColor: '#133457',
      accent: '#ffcf33',
      anim: 'bounce',
    },
    {
      id: 'allison',
      name: 'Allison',
      role: 'Dreamy Harp',
      category: 'melodies',
      color: '#c77dff',
      horrorColor: '#3f1b5c',
      accent: '#ffe066',
      anim: 'sway',
    },
    {
      id: 'doug',
      name: 'Doug',
      role: 'Baritone Vox',
      category: 'vocals',
      color: '#e69a45',
      horrorColor: '#4d2c14',
      accent: '#2c6e58',
      anim: 'sing',
    },
  ];

  const CHAR_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

  /* ------------------------------------------------------------------------
     Helper: Outfit Icon SVG (shown in the bottom tray & drag ghost)
     ------------------------------------------------------------------------ */
  function renderOutfitIcon(charId, isHorror) {
    const c = CHAR_MAP[charId];
    if (!c) return '';
    const fill = isHorror ? c.horrorColor : c.color;
    const stroke = isHorror ? '#0b0408' : '#1b2230';

    switch (charId) {
      case 'oren':
        return `<svg viewBox="0 0 64 64">
          <path d="M12 36 C12 16, 52 16, 52 36" fill="none" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>
          <path d="M12 36 C12 16, 52 16, 52 36" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="6" y="30" width="12" height="20" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="46" y="30" width="12" height="20" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <line x1="32" y1="16" x2="26" y2="6" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
          <line x1="32" y1="16" x2="39" y2="7" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
        </svg>`;
      case 'raddy':
        return `<svg viewBox="0 0 64 64">
          <path d="M14 48 L6 14 L26 30 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M50 48 L58 14 L38 30 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M22 44 L32 10 L42 44 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="32" cy="48" rx="22" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'clukr':
        return `<svg viewBox="0 0 64 64">
          <line x1="32" y1="46" x2="32" y2="22" stroke="${stroke}" stroke-width="4"/>
          <ellipse cx="32" cy="24" rx="26" ry="9" fill="${isHorror ? '#6e5c24' : '#f2c744'}" stroke="${stroke}" stroke-width="3"/>
          <ellipse cx="32" cy="21" rx="9" ry="4" fill="${isHorror ? '#8c7732' : '#ffe680'}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="32" cy="48" r="7" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'funbot':
        return `<svg viewBox="0 0 64 64">
          <rect x="10" y="18" width="44" height="30" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="16" y="25" width="32" height="14" rx="5" fill="#18202c" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="25" cy="32" r="3.5" fill="${isHorror ? '#ff2942' : '#40f2ff'}"/>
          <circle cx="39" cy="32" r="3.5" fill="${isHorror ? '#ff2942' : '#40f2ff'}"/>
          <line x1="20" y1="18" x2="15" y2="8" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="15" cy="8" r="4" fill="#f6c844" stroke="${stroke}" stroke-width="2.5"/>
          <line x1="44" y1="18" x2="49" y2="8" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="49" cy="8" r="4" fill="#f6c844" stroke="${stroke}" stroke-width="2.5"/>
        </svg>`;
      case 'vineria':
        return `<svg viewBox="0 0 64 64">
          <path d="M12 48 C10 20, 54 20, 52 48 C46 38, 18 38, 12 48 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <path d="M16 32 C8 16, 26 10, 32 22 C38 10, 56 16, 48 32" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="32" cy="18" r="6" fill="${isHorror ? '#751026' : '#ff6699'}" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="32" cy="18" r="2.2" fill="#ffe259"/>
        </svg>`;
      case 'gray':
        return `<svg viewBox="0 0 64 64">
          <path d="M14 48 L12 16 L30 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M50 48 L52 16 L34 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M16 44 Q32 34 48 44 L44 52 L20 52 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'brud':
        return `<svg viewBox="0 0 64 64">
          <path d="M14 14 L50 14 L44 50 L20 50 Z" fill="#8f9aa6" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="32" cy="14" rx="18" ry="5" fill="#b4bec9" stroke="${stroke}" stroke-width="3"/>
          <path d="M16 20 Q32 36 48 20" fill="none" stroke="${stroke}" stroke-width="2.5"/>
          <circle cx="46" cy="40" r="5" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        </svg>`;
      case 'garnold':
        return `<svg viewBox="0 0 64 64">
          <path d="M10 24 Q32 10 54 24 L50 48 Q32 54 14 48 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="14" y="26" width="36" height="13" rx="6" fill="#18202c" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M19 31 L45 31" stroke="${isHorror ? '#ff243c' : '#52f7ff'}" stroke-width="3" stroke-linecap="round"/>
        </svg>`;
      case 'owakcx':
        return `<svg viewBox="0 0 64 64">
          <polygon points="32,6 39,24 56,16 46,34 58,46 38,44 32,56 26,44 6,46 18,34 8,16 25,24" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        </svg>`;
      case 'sky':
        return `<svg viewBox="0 0 64 64">
          <circle cx="18" cy="24" r="11" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="46" cy="24" r="11" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="18" cy="24" r="5" fill="#a6ecff"/>
          <circle cx="46" cy="24" r="5" fill="#a6ecff"/>
          <ellipse cx="32" cy="42" rx="18" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'mrsun':
        return `<svg viewBox="0 0 64 64">
          <g stroke="${isHorror ? '#b81629' : '#ff9119'}" stroke-width="4" stroke-linecap="round">
            <line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/>
            <line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/>
            <line x1="13" y1="13" x2="19" y2="19"/><line x1="45" y1="45" x2="51" y2="51"/>
            <line x1="51" y1="13" x2="45" y2="19"/><line x1="19" y1="45" x2="13" y2="51"/>
          </g>
          <circle cx="32" cy="32" r="15" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'durple':
        return `<svg viewBox="0 0 64 64">
          <path d="M18 46 C8 30, 10 14, 24 12 C18 22, 22 30, 28 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M46 46 C56 30, 54 14, 40 12 C46 22, 42 30, 36 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="32" cy="46" rx="16" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'mrtree':
        return `<svg viewBox="0 0 64 64">
          <rect x="26" y="38" width="12" height="18" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="22" cy="30" r="12" fill="${isHorror ? '#1b3822' : '#3db852'}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="42" cy="30" r="12" fill="${isHorror ? '#1b3822' : '#3db852'}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="32" cy="20" r="13" fill="${isHorror ? '#22452a' : '#52d468'}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'simon':
        return `<svg viewBox="0 0 64 64">
          <path d="M22 46 Q18 22 10 12" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
          <path d="M22 46 Q18 22 10 12" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>
          <path d="M42 46 Q46 22 54 12" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
          <path d="M42 46 Q46 22 54 12" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>
          <path d="M14 48 L32 22 L50 48 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        </svg>`;
      case 'tunner':
        return `<svg viewBox="0 0 64 64">
          <path d="M18 38 L22 16 Q32 21 42 16 L46 38 Z" fill="${c.accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="32" cy="40" rx="26" ry="8" fill="${c.accent}" stroke="${stroke}" stroke-width="3"/>
          <rect x="20" y="32" width="24" height="5" fill="#d9a13b" stroke="${stroke}" stroke-width="2"/>
        </svg>`;
      case 'funcomputer':
        return `<svg viewBox="0 0 64 64">
          <rect x="10" y="14" width="44" height="34" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="16" y="20" width="32" height="22" rx="3" fill="${isHorror ? '#1f050b' : '#172e36'}" stroke="${stroke}" stroke-width="2.5"/>
          <text x="32" y="35" text-anchor="middle" font-size="13" font-weight="900" fill="${isHorror ? '#ff2942' : '#40ffa8'}">${isHorror ? 'ERR' : '^_^'}</text>
          <rect x="22" y="48" width="20" height="6" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        </svg>`;
      case 'wenda':
        return `<svg viewBox="0 0 64 64">
          <path d="M14 44 L10 12 L30 28 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M50 44 L54 12 L34 28 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="32" cy="42" rx="20" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="24" cy="41" r="2.5" fill="${stroke}"/>
          <circle cx="40" cy="41" r="2.5" fill="${stroke}"/>
          <path d="M29 45 Q32 48 35 45" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;
      case 'pinki':
        return `<svg viewBox="0 0 64 64">
          <path d="M32 32 L10 18 Q6 32 12 46 Z" fill="${c.accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M32 32 L54 18 Q58 32 52 46 Z" fill="${c.accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="32" cy="32" r="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'jevin':
        return `<svg viewBox="0 0 64 64">
          <path d="M12 52 C12 18, 22 10, 32 10 C42 10, 52 18, 52 52 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M21 48 C21 26, 26 20, 32 20 C38 20, 43 26, 43 48 Z" fill="#0d152b" stroke="${stroke}" stroke-width="2.5"/>
        </svg>`;
      case 'black':
        return `<svg viewBox="0 0 64 64">
          <rect x="18" y="10" width="28" height="30" rx="3" fill="#14131c" stroke="#000" stroke-width="3"/>
          <rect x="18" y="31" width="28" height="6" fill="#d91e36"/>
          <ellipse cx="32" cy="41" rx="25" ry="7" fill="#14131c" stroke="#000" stroke-width="3"/>
          <polygon points="32,46 27,57 32,61 37,57" fill="#fff" stroke="#000" stroke-width="2"/>
        </svg>`;
      case 'connor':
        return `<svg viewBox="0 0 64 64">
          <!-- Backwards Baseball Cap + Shades -->
          <path d="M12 34 C12 14, 48 14, 48 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M44 28 L59 31 Q60 36 45 36 Z" fill="${isHorror ? '#382c10' : c.accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <polygon points="28,19 30,24 35,24 31,27 32,32 28,29 24,32 25,27 21,24 26,24" fill="${isHorror ? '#ff2942' : c.accent}" stroke="${stroke}" stroke-width="1.5"/>
          <rect x="12" y="40" width="17" height="11" rx="3" fill="#18202c" stroke="${stroke}" stroke-width="2.5"/>
          <rect x="35" y="40" width="17" height="11" rx="3" fill="#18202c" stroke="${stroke}" stroke-width="2.5"/>
          <line x1="29" y1="45" x2="35" y2="45" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      case 'allison':
        return `<svg viewBox="0 0 64 64">
          <!-- Starry Tiara / Crown -->
          <path d="M10 46 L14 20 L25 32 L32 14 L39 32 L50 20 L54 46 Z" fill="${isHorror ? '#6e4e18' : c.accent}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
          <rect x="10" y="44" width="44" height="7" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="32" cy="31" r="4.5" fill="${isHorror ? '#ff2942' : '#ff66b2'}" stroke="${stroke}" stroke-width="2"/>
          <circle cx="19" cy="37" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          <circle cx="45" cy="37" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        </svg>`;
      case 'doug':
        return `<svg viewBox="0 0 64 64">
          <!-- Cozy Knit Beanie + Glasses -->
          <circle cx="32" cy="11" r="6" fill="${isHorror ? '#1b362b' : c.accent}" stroke="${stroke}" stroke-width="2.5"/>
          <path d="M12 36 C12 14, 52 14, 52 36 Z" fill="${isHorror ? '#1b362b' : c.accent}" stroke="${stroke}" stroke-width="3"/>
          <rect x="10" y="32" width="44" height="9" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <circle cx="22" cy="50" r="7.5" fill="rgba(255,255,255,0.65)" stroke="${stroke}" stroke-width="3"/>
          <circle cx="42" cy="50" r="7.5" fill="rgba(255,255,255,0.65)" stroke="${stroke}" stroke-width="3"/>
          <line x1="29.5" y1="50" x2="34.5" y2="50" stroke="${stroke}" stroke-width="3"/>
        </svg>`;
      default:
        return '';
    }
  }

  /* ------------------------------------------------------------------------
     Helper: Full Stage Character SVG (Blank Polo OR Dressed Character)
     ViewBox: 0 0 140 215
     ------------------------------------------------------------------------ */
  function renderStageCharacter(charId, isHorror) {
    // Blank Polo Silhouette
    if (!charId) {
      const bodyFill = isHorror ? '#382c32' : '#c7cdd6';
      const shadeFill = isHorror ? '#261c22' : '#aeb6c2';
      const outline = isHorror ? '#12080d' : '#262d3a';
      return `<svg class="char-svg" viewBox="0 0 140 215">
        <!-- Blank Polo Torso -->
        <path d="M40 202 C42 152, 48 134, 70 134 C92 134, 98 152, 100 202 Z" fill="${bodyFill}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M70 134 C92 134, 98 152, 100 202 L82 202 C82 162, 78 142, 70 134 Z" fill="${shadeFill}" opacity="0.5"/>
        <!-- Blank Polo Head -->
        <g class="char-head-group">
          <circle cx="70" cy="96" r="37" fill="${bodyFill}" stroke="${outline}" stroke-width="4"/>
          <!-- Neutral sleepy eyes -->
          <ellipse cx="56" cy="94" rx="5.5" ry="6.5" fill="#fff" stroke="${outline}" stroke-width="2.5"/>
          <ellipse cx="84" cy="94" rx="5.5" ry="6.5" fill="#fff" stroke="${outline}" stroke-width="2.5"/>
          <circle cx="56" cy="95" r="2.6" fill="${outline}"/>
          <circle cx="84" cy="95" r="2.6" fill="${outline}"/>
          <line x1="63" y1="112" x2="77" y2="112" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    const c = CHAR_MAP[charId];
    const bodyColor = isHorror ? c.horrorColor : c.color;
    const outline = isHorror ? '#0d0408' : '#1b2230';
    const eyeBg = isHorror ? '#170409' : '#ffffff';
    const pupilColor = isHorror ? '#ff2942' : '#151a24';

    // Special silhouette characters: Mr. Sun, Mr. Tree, Mr. Fun Computer
    if (charId === 'mrsun') {
      return renderMrSun(bodyColor, outline, isHorror);
    }
    if (charId === 'mrtree') {
      return renderMrTree(bodyColor, outline, isHorror);
    }
    if (charId === 'funcomputer') {
      return renderFunComputer(bodyColor, outline, isHorror);
    }

    // Standard Sprunki humanoid base + unique accessories
    const accessoryBack = getAccessoryBack(charId, bodyColor, c.accent, outline, isHorror);
    const accessoryFront = getAccessoryFront(charId, bodyColor, c.accent, outline, isHorror);
    const face = getCharacterFace(charId, outline, eyeBg, pupilColor, isHorror);
    const torsoExtra = getTorsoExtra(charId, bodyColor, c.accent, outline, isHorror);

    return `<svg class="char-svg" viewBox="0 0 140 215">
      <!-- Torso -->
      <path d="M36 204 C39 150, 47 132, 70 132 C93 132, 101 150, 104 204 Z" fill="${bodyColor}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M70 132 C93 132, 101 150, 104 204 L85 204 C84 162, 79 140, 70 132 Z" fill="#000" opacity="0.14"/>
      ${torsoExtra}

      <!-- Animated Head Group -->
      <g class="char-head-group">
        ${accessoryBack}
        <circle cx="70" cy="96" r="39" fill="${bodyColor}" stroke="${outline}" stroke-width="4"/>
        <!-- Subtle highlight -->
        <path d="M46 76 Q58 64 74 66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="${isHorror ? '0.08' : '0.32'}"/>
        ${face}
        ${accessoryFront}
        ${isHorror ? renderHorrorOverlay(charId) : ''}
      </g>
    </svg>`;
  }

  function getCharacterFace(charId, outline, eyeBg, pupilColor, isHorror) {
    // Visor characters (Fun Bot, Garnold)
    if (charId === 'funbot' || charId === 'garnold') {
      const glow = isHorror ? '#ff2942' : charId === 'funbot' ? '#4cf7ff' : '#ffe45e';
      return `
        <rect x="38" y="79" width="64" height="26" rx="11" fill="#171f2b" stroke="${outline}" stroke-width="3.5"/>
        <circle cx="55" cy="92" r="${isHorror ? 4 : 6}" fill="${glow}"/>
        <circle cx="85" cy="92" r="${isHorror ? 4 : 6}" fill="${glow}"/>
        <path class="mouth-rest" d="M58 115 Q70 120 82 115" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>
        <rect class="mouth-sing" x="58" y="111" width="24" height="11" rx="4" fill="#171f2b" stroke="${outline}" stroke-width="2.5"/>
      `;
    }

    // Black (mysterious glowing/shadowed face)
    if (charId === 'black') {
      return `
        <ellipse cx="56" cy="93" rx="8" ry="10" fill="#ffffff" stroke="#000" stroke-width="2.5"/>
        <ellipse cx="84" cy="93" rx="8" ry="10" fill="#ffffff" stroke="#000" stroke-width="2.5"/>
        <circle cx="56" cy="93" r="3.2" fill="#000"/>
        <circle cx="84" cy="93" r="3.2" fill="#000"/>
        <circle cx="56" cy="93" r="1.2" fill="#ff2942"/>
        <circle cx="84" cy="93" r="1.2" fill="#ff2942"/>
        <path class="mouth-rest" d="M56 115 Q70 112 84 115" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
        <ellipse class="mouth-sing" cx="70" cy="116" rx="12" ry="9" fill="#000" stroke="#d91e36" stroke-width="2.5"/>
      `;
    }

    // Jevin (hooded shadowed eyes)
    if (charId === 'jevin') {
      return `
        <circle cx="70" cy="98" r="28" fill="#0a1024"/>
        <ellipse cx="58" cy="96" rx="5.5" ry="6.5" fill="${isHorror ? '#ff2942' : '#d6e7ff'}"/>
        <ellipse cx="82" cy="96" rx="5.5" ry="6.5" fill="${isHorror ? '#ff2942' : '#d6e7ff'}"/>
        <circle cx="58" cy="96" r="2.2" fill="#0a1024"/>
        <circle cx="82" cy="96" r="2.2" fill="#0a1024"/>
        <path class="mouth-rest" d="M62 114 Q70 112 78 114" fill="none" stroke="#8ab2ff" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse class="mouth-sing" cx="70" cy="115" rx="9" ry="7" fill="#000" stroke="#8ab2ff" stroke-width="2"/>
      `;
    }

    // Expressive standard eyes
    const angryBrows =
      charId === 'raddy'
        ? `<line x1="45" y1="78" x2="64" y2="85" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>
           <line x1="95" y1="78" x2="76" y2="85" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>`
        : '';

    const lashes =
      charId === 'pinki' || charId === 'vineria' || charId === 'allison'
        ? `<line x1="44" y1="86" x2="49" y2="89" stroke="${outline}" stroke-width="2.5" stroke-linecap="round"/>
           <line x1="96" y1="86" x2="91" y2="89" stroke="${outline}" stroke-width="2.5" stroke-linecap="round"/>`
        : '';

    const weirdPupils =
      charId === 'owakcx'
        ? `<circle cx="53" cy="91" r="4.5" fill="${pupilColor}"/>
           <circle cx="87" cy="96" r="2.6" fill="${pupilColor}"/>`
        : isHorror
        ? `<circle cx="56" cy="94" r="3" fill="${pupilColor}"/>
           <circle cx="84" cy="94" r="3" fill="${pupilColor}"/>`
        : `<circle cx="57" cy="93" r="4.4" fill="${pupilColor}"/>
           <circle cx="85" cy="93" r="4.4" fill="${pupilColor}"/>
           <circle cx="58.5" cy="91.5" r="1.5" fill="#fff"/>
           <circle cx="86.5" cy="91.5" r="1.5" fill="#fff"/>`;

    const restMouth = isHorror
      ? `<path class="mouth-rest" d="M55 117 Q70 107 85 117" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>`
      : charId === 'tunner'
      ? `<circle class="mouth-rest" cx="70" cy="114" r="4" fill="${outline}"/>`
      : charId === 'raddy' || charId === 'gray'
      ? `<path class="mouth-rest" d="M58 116 Q70 111 82 116" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>`
      : `<path class="mouth-rest" d="M57 112 Q70 122 83 112" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>`;

    const singMouth =
      charId === 'tunner'
        ? `<circle class="mouth-sing" cx="70" cy="114" r="6.5" fill="#3a1919" stroke="${outline}" stroke-width="3"/>`
        : `<ellipse class="mouth-sing" cx="70" cy="115" rx="11" ry="9" fill="${isHorror ? '#1c0308' : '#571825'}" stroke="${outline}" stroke-width="3"/>`;

    return `
      <ellipse cx="56" cy="93" rx="${isHorror ? 8.5 : 8}" ry="${isHorror ? 10 : 9}" fill="${eyeBg}" stroke="${outline}" stroke-width="3"/>
      <ellipse cx="84" cy="93" rx="${isHorror ? 8.5 : 8}" ry="${isHorror ? 10 : 9}" fill="${eyeBg}" stroke="${outline}" stroke-width="3"/>
      ${weirdPupils}
      ${angryBrows}
      ${lashes}
      ${restMouth}
      ${singMouth}
    `;
  }

  function getAccessoryBack(charId, color, accent, outline, isHorror) {
    switch (charId) {
      case 'oren':
        return `
          <path d="M68 58 Q60 36 52 38" fill="none" stroke="${outline}" stroke-width="7" stroke-linecap="round"/>
          <path d="M68 58 Q60 36 52 38" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M74 58 Q84 36 92 40" fill="none" stroke="${outline}" stroke-width="7" stroke-linecap="round"/>
          <path d="M74 58 Q84 36 92 40" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M27 96 C27 42, 113 42, 113 96" fill="none" stroke="${outline}" stroke-width="11" stroke-linecap="round"/>
          <path d="M27 96 C27 42, 113 42, 113 96" fill="none" stroke="${color}" stroke-width="5.5" stroke-linecap="round"/>
        `;
      case 'raddy':
        return `
          <polygon points="44,70 22,36 56,58" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="96,70 118,36 84,58" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="58,60 70,28 82,60" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'clukr':
        return `
          <line x1="70" y1="58" x2="70" y2="34" stroke="${outline}" stroke-width="5"/>
          <ellipse cx="70" cy="36" rx="38" ry="11" fill="${isHorror ? '#69571e' : '#f2c744'}" stroke="${outline}" stroke-width="4"/>
          <ellipse cx="70" cy="32" rx="13" ry="5" fill="${isHorror ? '#87722c' : '#ffe885'}" stroke="${outline}" stroke-width="3"/>
        `;
      case 'funbot':
        return `
          <line x1="48" y1="62" x2="36" y2="38" stroke="${outline}" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="36" cy="38" r="6" fill="#f6c844" stroke="${outline}" stroke-width="3"/>
          <line x1="92" y1="62" x2="104" y2="38" stroke="${outline}" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="104" cy="38" r="6" fill="#f6c844" stroke="${outline}" stroke-width="3"/>
        `;
      case 'gray':
      case 'wenda':
        return `
          <polygon points="36,80 30,36 62,62" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="104,80 110,36 78,62" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'owakcx':
        return `
          <polygon points="36,74 20,44 50,62 56,30 70,56 84,28 90,62 120,44 104,74" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'sky':
        return `
          <circle cx="40" cy="64" r="15" fill="${color}" stroke="${outline}" stroke-width="4"/>
          <circle cx="100" cy="64" r="15" fill="${color}" stroke="${outline}" stroke-width="4"/>
          <circle cx="40" cy="64" r="7" fill="#a8edff" opacity="${isHorror ? 0.3 : 1}"/>
          <circle cx="100" cy="64" r="7" fill="#a8edff" opacity="${isHorror ? 0.3 : 1}"/>
        `;
      case 'durple':
        return `
          <path d="M44 68 C22 52, 22 24, 46 22 C36 38, 42 50, 54 60 Z" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M96 68 C118 52, 118 24, 94 22 C104 38, 98 50, 86 60 Z" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'simon':
        return `
          <path d="M52 60 Q40 28 24 22" fill="none" stroke="${outline}" stroke-width="9" stroke-linecap="round"/>
          <path d="M52 60 Q40 28 24 22" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M88 60 Q100 28 116 22" fill="none" stroke="${outline}" stroke-width="9" stroke-linecap="round"/>
          <path d="M88 60 Q100 28 116 22" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
          <polygon points="60,60 70,32 80,60" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'pinki':
        return `
          <ellipse cx="46" cy="48" rx="10" ry="26" transform="rotate(-18 46 48)" fill="${color}" stroke="${outline}" stroke-width="4"/>
          <ellipse cx="94" cy="48" rx="10" ry="26" transform="rotate(18 94 48)" fill="${color}" stroke="${outline}" stroke-width="4"/>
        `;
      case 'allison':
        return `
          <!-- Twin fluffy lavender hair puffs -->
          <circle cx="30" cy="84" r="18" fill="${isHorror ? '#29103d' : '#a855f7'}" stroke="${outline}" stroke-width="4"/>
          <circle cx="110" cy="84" r="18" fill="${isHorror ? '#29103d' : '#a855f7'}" stroke="${outline}" stroke-width="4"/>
          <circle cx="34" cy="112" r="13" fill="${isHorror ? '#29103d' : '#a855f7'}" stroke="${outline}" stroke-width="4"/>
          <circle cx="106" cy="112" r="13" fill="${isHorror ? '#29103d' : '#a855f7'}" stroke="${outline}" stroke-width="4"/>
        `;
      default:
        return '';
    }
  }

  function getAccessoryFront(charId, color, accent, outline, isHorror) {
    switch (charId) {
      case 'oren':
        return `
          <rect x="19" y="80" width="16" height="32" rx="7" fill="${color}" stroke="${outline}" stroke-width="3.5"/>
          <rect x="105" y="80" width="16" height="32" rx="7" fill="${color}" stroke="${outline}" stroke-width="3.5"/>
        `;
      case 'vineria':
        return `
          <path d="M30 88 C28 46, 112 46, 110 88 C98 72, 82 68, 70 72 C58 68, 42 72, 30 88 Z" fill="${isHorror ? '#1b4722' : '#2fb044'}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M32 86 C22 104, 24 128, 36 138" fill="none" stroke="${isHorror ? '#1b4722' : '#2fb044'}" stroke-width="8" stroke-linecap="round"/>
          <path d="M108 86 C118 104, 116 128, 104 138" fill="none" stroke="${isHorror ? '#1b4722' : '#2fb044'}" stroke-width="8" stroke-linecap="round"/>
          <circle cx="88" cy="60" r="9" fill="${isHorror ? '#751026' : '#ff5e8a'}" stroke="${outline}" stroke-width="3"/>
          <circle cx="88" cy="60" r="3.5" fill="#ffe259"/>
        `;
      case 'brud':
        return `
          <g transform="rotate(-11 70 54)">
            <path d="M40 24 L100 24 L94 74 L46 74 Z" fill="#8f9aa6" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
            <ellipse cx="70" cy="24" rx="30" ry="7" fill="#b4bec9" stroke="${outline}" stroke-width="4"/>
          </g>
        `;
      case 'tunner':
        return `
          <path d="M42 64 L48 30 Q70 38 92 30 L98 64 Z" fill="${accent}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <ellipse cx="70" cy="65" rx="44" ry="11" fill="${accent}" stroke="${outline}" stroke-width="4"/>
          <rect x="44" y="54" width="52" height="8" fill="#d9a13b" stroke="${outline}" stroke-width="2.5"/>
        `;
      case 'pinki':
        return `
          <path d="M70 58 L46 42 Q42 56 48 68 Z" fill="${accent}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M70 58 L94 42 Q98 56 92 68 Z" fill="${accent}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
          <circle cx="70" cy="58" r="7.5" fill="${color}" stroke="${outline}" stroke-width="3"/>
        `;
      case 'jevin':
        return `
          <path d="M26 122 C24 62, 42 46, 70 46 C98 46, 116 62, 114 122 C102 128, 96 128, 94 122 C96 82, 88 64, 70 64 C52 64, 44 82, 46 122 C44 128, 38 128, 26 122 Z" fill="${color}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        `;
      case 'black':
        return `
          <rect x="45" y="16" width="50" height="44" rx="4" fill="#121118" stroke="#000" stroke-width="4"/>
          <rect x="45" y="47" width="50" height="9" fill="#d91e36"/>
          <ellipse cx="70" cy="60" rx="42" ry="10" fill="#121118" stroke="#000" stroke-width="4"/>
        `;
      case 'connor':
        return `
          <!-- Backwards Baseball Cap -->
          <path d="M31 74 C31 40, 105 40, 105 74 Z" fill="${isHorror ? '#0f2842' : '#1b78d4'}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M98 63 L124 68 Q126 76 99 76 Z" fill="${isHorror ? '#574212' : accent}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="64,47 67,54 74,54 68,58 70,65 64,61 58,65 60,58 54,54 61,54" fill="${isHorror ? '#ff2942' : accent}" stroke="${outline}" stroke-width="2"/>
          <!-- Sporty Shades -->
          <rect x="36" y="83" width="29" height="18" rx="5" fill="#151b26" stroke="${outline}" stroke-width="3.5"/>
          <rect x="75" y="83" width="29" height="18" rx="5" fill="#151b26" stroke="${outline}" stroke-width="3.5"/>
          <line x1="65" y1="90" x2="75" y2="90" stroke="${outline}" stroke-width="4"/>
          ${
            isHorror
              ? `<line x1="42" y1="92" x2="58" y2="92" stroke="#ff2942" stroke-width="3" stroke-linecap="round"/>
                 <line x1="82" y1="92" x2="98" y2="92" stroke="#ff2942" stroke-width="3" stroke-linecap="round"/>`
              : `<line x1="42" y1="88" x2="50" y2="96" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
                 <line x1="81" y1="88" x2="89" y2="96" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>`
          }
        `;
      case 'allison':
        return `
          <!-- Swept Bangs + Starry Crown -->
          <path d="M35 80 Q54 62 70 72 Q86 62 105 80 Q94 56 70 55 Q46 56 35 80 Z" fill="${isHorror ? '#29103d' : '#a855f7'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M44 60 L48 34 L60 48 L70 28 L80 48 L92 34 L96 60 Z" fill="${isHorror ? '#6e4e18' : accent}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
          <circle cx="70" cy="48" r="5" fill="${isHorror ? '#ff2942' : '#ff66b2'}" stroke="${outline}" stroke-width="2.5"/>
        `;
      case 'doug':
        return `
          <!-- Cozy Knit Beanie -->
          <circle cx="70" cy="31" r="10" fill="${isHorror ? '#1b362b' : accent}" stroke="${outline}" stroke-width="3.5"/>
          <path d="M31 74 C31 36, 109 36, 109 74 Z" fill="${isHorror ? '#1b362b' : accent}" stroke="${outline}" stroke-width="4"/>
          <rect x="28" y="64" width="84" height="14" rx="6" fill="${isHorror ? '#2b4f40' : '#3d9477'}" stroke="${outline}" stroke-width="3.5"/>
          <!-- Round Glasses -->
          <circle cx="56" cy="93" r="12" fill="rgba(255,255,255,0.22)" stroke="${outline}" stroke-width="3.5"/>
          <circle cx="84" cy="93" r="12" fill="rgba(255,255,255,0.22)" stroke="${outline}" stroke-width="3.5"/>
          <line x1="68" y1="93" x2="72" y2="93" stroke="${outline}" stroke-width="3.5"/>
          <!-- Friendly Mustache -->
          <path d="M52 108 Q61 102 70 107 Q79 102 88 108 Q79 114 70 110 Q61 114 52 108 Z" fill="${isHorror ? '#261409' : '#6e3f1d'}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>
        `;
      default:
        return '';
    }
  }

  function getTorsoExtra(charId, color, accent, outline, isHorror) {
    if (charId === 'black') {
      return `
        <polygon points="70,136 62,150 70,186 78,150" fill="#ffffff" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="56,134 70,152 84,134" fill="#ffffff" stroke="#000" stroke-width="2.5"/>
      `;
    }
    if (charId === 'funbot' || charId === 'garnold') {
      return `<rect x="52" y="152" width="36" height="22" rx="6" fill="#202836" stroke="${outline}" stroke-width="3"/>
              <circle cx="62" cy="163" r="4" fill="${isHorror ? '#ff2942' : '#40f2ff'}"/>
              <rect x="70" y="159" width="12" height="8" rx="2" fill="${accent}"/>`;
    }
    if (charId === 'tunner') {
      return `<path d="M50 138 Q70 156 90 138 L86 152 Q70 166 54 152 Z" fill="${accent}" stroke="${outline}" stroke-width="3"/>`;
    }
    if (charId === 'connor') {
      return `<path d="M52 135 L70 154 L88 135" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
              <line x1="62" y1="146" x2="62" y2="170" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
              <line x1="78" y1="146" x2="78" y2="170" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    }
    if (charId === 'allison') {
      return `<polygon points="70,150 74,159 84,159 76,165 79,174 70,168 61,174 64,165 56,159 66,159" fill="${isHorror ? '#70182b' : accent}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>`;
    }
    if (charId === 'doug') {
      return `<path d="M48 136 Q70 148 92 136 L94 154 Q70 164 46 154 Z" fill="${isHorror ? '#1b362b' : accent}" stroke="${outline}" stroke-width="3"/>`;
    }
    return '';
  }

  function renderMrSun(bodyColor, outline, isHorror) {
    const rayColor = isHorror ? '#a81224' : '#ff9119';
    return `<svg class="char-svg" viewBox="0 0 140 215">
      <g class="char-head-group">
        <g stroke="${rayColor}" stroke-width="9" stroke-linecap="round">
          <line x1="70" y1="42" x2="70" y2="62"/>
          <line x1="70" y1="168" x2="70" y2="188"/>
          <line x1="12" y1="115" x2="32" y2="115"/>
          <line x1="108" y1="115" x2="128" y2="115"/>
          <line x1="28" y1="72" x2="42" y2="86"/>
          <line x1="98" y1="144" x2="112" y2="158"/>
          <line x1="112" y1="72" x2="98" y2="86"/>
          <line x1="42" y1="144" x2="28" y2="158"/>
        </g>
        <circle cx="70" cy="115" r="44" fill="${bodyColor}" stroke="${outline}" stroke-width="4.5"/>
        ${
          isHorror
            ? `<circle cx="70" cy="115" r="24" fill="#170409" stroke="${outline}" stroke-width="3.5"/>
               <circle cx="70" cy="115" r="10" fill="#ff2942"/>
               <circle cx="70" cy="115" r="4" fill="#000"/>`
            : `<ellipse cx="55" cy="108" rx="6.5" ry="8" fill="#fff" stroke="${outline}" stroke-width="3"/>
               <ellipse cx="85" cy="108" rx="6.5" ry="8" fill="#fff" stroke="${outline}" stroke-width="3"/>
               <circle cx="56" cy="108" r="3.5" fill="${outline}"/>
               <circle cx="86" cy="108" r="3.5" fill="${outline}"/>
               <path class="mouth-rest" d="M55 128 Q70 140 85 128" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>
               <ellipse class="mouth-sing" cx="70" cy="131" rx="11" ry="8" fill="#701f1f" stroke="${outline}" stroke-width="3"/>`
        }
      </g>
    </svg>`;
  }

  function renderMrTree(bodyColor, outline, isHorror) {
    const leaf1 = isHorror ? '#1b3620' : '#32ad47';
    const leaf2 = isHorror ? '#254a2b' : '#4dd162';
    return `<svg class="char-svg" viewBox="0 0 140 215">
      <rect x="46" y="102" width="48" height="102" rx="10" fill="${bodyColor}" stroke="${outline}" stroke-width="4"/>
      <g class="char-head-group">
        <circle cx="40" cy="78" r="30" fill="${leaf1}" stroke="${outline}" stroke-width="4"/>
        <circle cx="100" cy="78" r="30" fill="${leaf1}" stroke="${outline}" stroke-width="4"/>
        <circle cx="70" cy="56" r="36" fill="${leaf2}" stroke="${outline}" stroke-width="4"/>
        <ellipse cx="58" cy="130" rx="6" ry="7.5" fill="${isHorror ? '#170409' : '#fff'}" stroke="${outline}" stroke-width="3"/>
        <ellipse cx="82" cy="130" rx="6" ry="7.5" fill="${isHorror ? '#170409' : '#fff'}" stroke="${outline}" stroke-width="3"/>
        <circle cx="58" cy="130" r="3" fill="${isHorror ? '#ff2942' : outline}"/>
        <circle cx="82" cy="130" r="3" fill="${isHorror ? '#ff2942' : outline}"/>
        <path class="mouth-rest" d="M58 148 Q70 156 82 148" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse class="mouth-sing" cx="70" cy="150" rx="10" ry="8" fill="#2b120e" stroke="${outline}" stroke-width="3"/>
      </g>
    </svg>`;
  }

  function renderFunComputer(bodyColor, outline, isHorror) {
    const screenBg = isHorror ? '#1f040b' : '#132f38';
    const screenText = isHorror ? '#ff2942' : '#40ffa8';
    return `<svg class="char-svg" viewBox="0 0 140 215">
      <!-- Stand & Desk Base -->
      <rect x="54" y="160" width="32" height="24" fill="#8b96a6" stroke="${outline}" stroke-width="3.5"/>
      <rect x="28" y="180" width="84" height="22" rx="6" fill="${bodyColor}" stroke="${outline}" stroke-width="4"/>
      <g class="char-head-group">
        <!-- Propeller Hat -->
        <path d="M50 74 Q70 50 90 74 Z" fill="${isHorror ? '#57111e' : '#ff4757'}" stroke="${outline}" stroke-width="3.5"/>
        <line x1="70" y1="62" x2="70" y2="50" stroke="${outline}" stroke-width="4"/>
        <ellipse cx="70" cy="50" rx="22" ry="4.5" fill="#ffd93b" stroke="${outline}" stroke-width="3"/>
        <!-- CRT Monitor -->
        <rect x="20" y="72" width="100" height="88" rx="14" fill="${bodyColor}" stroke="${outline}" stroke-width="4"/>
        <rect x="30" y="84" width="80" height="62" rx="8" fill="${screenBg}" stroke="${outline}" stroke-width="3"/>
        <text class="mouth-rest" x="70" y="122" text-anchor="middle" font-family="monospace" font-size="22" font-weight="900" fill="${screenText}">${isHorror ? 'RUN' : '^ _ ^'}</text>
        <text class="mouth-sing" x="70" y="124" text-anchor="middle" font-family="monospace" font-size="24" font-weight="900" fill="${screenText}">${isHorror ? '!!!' : '^ O ^'}</text>
      </g>
    </svg>`;
  }

  function renderHorrorOverlay(charId) {
    if (charId === 'black') return '';
    return `
      <g opacity="0.55" pointer-events="none">
        <path d="M46 72 L52 84 L48 92" fill="none" stroke="#1a0308" stroke-width="2"/>
        <path d="M88 104 L94 118" fill="none" stroke="#b30e24" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `;
  }

  global.SPRUNKI_DATA = {
    CHARACTERS,
    CHAR_MAP,
    CATEGORY_COLORS,
    renderOutfitIcon,
    renderStageCharacter,
  };
})(window);
