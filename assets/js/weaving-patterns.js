/**
 * Waimiri Atroari (Kinja) Weaving Patterns & Primitive Loom Engine
 * Zero-dependency Vanilla JS module compatible with browser and Node.js testing.
 *
 * Matrix convention:
 *   0 = Weft OVER Warp (Light / Natural Aruma or Terracotta Urucum splint visible on top)
 *   1 = Weft UNDER Warp (Dark / Black Jenipapo-dyed vertical warp splint visible on top)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WeavingPatterns = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function createGrid(rows, cols, fillValue) {
    const val = fillValue ? 1 : 0;
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(val);
      }
      grid.push(row);
    }
    return grid;
  }

  function cloneGrid(grid) {
    return grid.map(function (row) {
      return row.slice();
    });
  }

  function fillRow(grid, r, val) {
    if (r < 0 || r >= grid.length) return;
    for (let c = 0; c < grid[r].length; c++) {
      grid[r][c] = val;
    }
  }

  function setPoints(grid, r, cols, val) {
    if (r < 0 || r >= grid.length) return;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (c >= 0 && c < grid[r].length) {
        grid[r][c] = val;
      }
    }
  }

  function setRanges(grid, r, ranges, val) {
    if (r < 0 || r >= grid.length) return;
    for (let i = 0; i < ranges.length; i++) {
      const start = ranges[i][0];
      const end = ranges[i][1];
      for (let c = start; c <= end; c++) {
        if (c >= 0 && c < grid[r].length) {
          grid[r][c] = val;
        }
      }
    }
  }

  /**
   * Standard even-row twill cadence used across Waimiri Atroari patterns:
   * Phase A (shift=0): Over 1, (Under 3, Over 1) repeated -> 1 at 1..3, 5..7, 9..11...
   * Phase B (shift=2): Under 2, Over 1, (Under 3, Over 1)..., Under 2 -> 1 at 0..1, 3..5, 7..9...
   */
  function applyTwillRow(grid, r, phase) {
    if (r < 0 || r >= grid.length) return;
    const cols = grid[r].length;
    for (let c = 0; c < cols; c++) {
      if (phase === 0) {
        grid[r][c] = (c % 4 !== 0) ? 1 : 0;
      } else {
        grid[r][c] = ((c + 2) % 4 !== 0) ? 1 : 0;
      }
    }
  }

  function mirrorVertical(grid) {
    const R = grid.length;
    const half = Math.floor(R / 2);
    for (let r = 0; r < half; r++) {
      grid[R - 1 - r] = grid[r].slice();
    }
    return grid;
  }

  function mirrorHorizontal(grid) {
    const R = grid.length;
    const C = grid[0].length;
    const half = Math.floor(C / 2);
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < half; c++) {
        grid[r][C - 1 - c] = grid[r][c];
      }
    }
    return grid;
  }

  /**
   * 1. WARAKI BENRY - Desenho do aracu (Aracu fish design) - 19x33
   */
  function buildWarakiSteps() {
    const R = 19, C = 33;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    [2, 6, 12, 16].forEach(function (r) { applyTwillRow(s2, r, 0); });
    [4, 8, 10, 14].forEach(function (r) { applyTwillRow(s2, r, 2); });

    const s3 = cloneGrid(s2);
    // Core Aracu double-bar eye & inner diamond connectors
    setPoints(s3, 7, [13, 19], 1);
    setPoints(s3, 11, [13, 19], 1);
    setPoints(s3, 9, [11, 21], 1);
    setPoints(s3, 5, [15, 17], 1);
    setPoints(s3, 13, [15, 17], 1);

    const s4 = cloneGrid(s3);
    // Concentric diamond stepped ribs
    setPoints(s4, 1, [7, 11, 15, 17, 21, 25], 1);
    setPoints(s4, 17, [7, 11, 15, 17, 21, 25], 1);
    setPoints(s4, 3, [5, 9, 13, 19, 23, 27], 1);
    setPoints(s4, 15, [5, 9, 13, 19, 23, 27], 1);
    setPoints(s4, 5, [7, 11, 15, 17, 21, 25], 1);
    setPoints(s4, 13, [7, 11, 15, 17, 21, 25], 1);
    setPoints(s4, 7, [5, 9, 13, 19, 23, 27], 1);
    setPoints(s4, 11, [5, 9, 13, 19, 23, 27], 1);
    setPoints(s4, 9, [7, 11, 21, 25], 1);

    const s5 = cloneGrid(s4);
    // Outer side hooks (leaving r=1,17 at c=1,3,29,31 open so corner 3-bars float as fish scales)
    setPoints(s5, 5, [1, 3, 29, 31], 1);
    setPoints(s5, 13, [1, 3, 29, 31], 1);
    setPoints(s5, 9, [1, 3, 29, 31], 1);

    return [
      {
        title: '1. Urdidura & Moldura (Border Frame)',
        primitiveId: 'border',
        description: 'Prepare 33 vertical black arumã warp splints and anchor Row 0 and Row 18 with solid under-all bands.',
        formula: 'Row 0, 18: ▼33 (Under all 33 warp strips)',
        grid: s1
      },
      {
        title: '2. Cadência de Sarja 3×1 (Twill Skeleton)',
        primitiveId: 'twill-3-1',
        description: 'Weave all even rows (2, 4, 6, 8, 10, 12, 14, 16) with the fundamental [▲1 ▼3] twill rhythm, alternating phase by 2 columns every 2 rows.',
        formula: 'Rows 2,6,12,16: (▲1 ▼3)×8 ▲1 | Rows 4,8,10,14: ▼2 (▲1 ▼3)×7 ▲1 ▼2',
        grid: s2
      },
      {
        title: '3. Centro do Aracu (Double-Bar Core)',
        primitiveId: 'aracu-core',
        description: 'Leave c=15,17 open (▲ Over) on center Row 9 so the two central 3-unit black bars float inside a diamond chamber.',
        formula: 'Row 9 center: ▲9 (c=12..20) framing two floating ▼3 bars on Rows 8 & 10',
        grid: s3
      },
      {
        title: '4. Escamas Diagonais (Stepped Diamond Ribs)',
        primitiveId: 'step-diagonal',
        description: 'Connect the even-row bars along 45° diagonal channels by picking up single ▼1 warp splints on odd rows.',
        formula: 'Odd rows r=1,3,5,7: shift ▼1 pickups outward by ±2 columns per row',
        grid: s4
      },
      {
        title: '5. Ganchos Laterais & Escamas Soltas (Corner Scales)',
        primitiveId: 'hook-bracket',
        description: 'Close the outer [ ] hooks at c=1,3 and c=29,31 on rows 5, 9, 13 while leaving rows 1 & 17 open so the 4 corner bars float.',
        formula: 'Rows 5,9,13: add ▼1 at c=1,3,29,31 (4-quadrant dihedral symmetry complete)',
        grid: s5
      }
    ];
  }

  /**
   * 2. TEBAKA BENRY - Desenho com olho (Eye design) - 17x29
   */
  function buildTebakaSteps() {
    const R = 17, C = 29;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    [2, 6, 8, 12].forEach(function (r) { applyTwillRow(s2, r, 0); });
    [4, 10, 14].forEach(function (r) { applyTwillRow(s2, r, 2); });

    const s3 = cloneGrid(s2);
    // Central Tebaka (Eye): close c=13, 15 at r=7 so (r=6..8, c=13..15) forms a 3x3 black box with white X eye at (7, 14)
    setPoints(s3, 7, [13, 15], 1);
    setPoints(s3, 5, [11, 17], 1);
    setPoints(s3, 9, [11, 17], 1);

    const s4 = cloneGrid(s3);
    [1, 5, 9, 13].forEach(function (r) {
      setPoints(s4, r, [3, 7, 11, 17, 21, 25], 1);
    });
    [3, 7, 11].forEach(function (r) {
      setPoints(s4, r, [1, 5, 9, 13, 15, 19, 23, 27], 1);
    });

    const s5 = cloneGrid(s4);
    // Bottom row r=15 completes the lower diamond eye rings and forms the two bottom corner eyes at c=0 and c=28
    setPoints(s5, 15, [1, 5, 9, 13, 15, 19, 23, 27], 1);

    return [
      {
        title: '1. Urdidura & Moldura (17×29 Loom Frame)',
        primitiveId: 'border',
        description: 'Prepare 29 vertical warp splints and weave the solid top and bottom borders.',
        formula: 'Row 0, 16: ▼29',
        grid: s1
      },
      {
        title: '2. Campo de Sarja (Modulated Twill Field)',
        primitiveId: 'twill-3-1',
        description: 'Weave Phase A [▲1 ▼3] on Rows 2, 6, 8, 12 and Phase B on Rows 4, 10, 14 so Rows 6 and 8 mirror each other around Row 7.',
        formula: 'Rows 2,6,8,12: Phase A | Rows 4,10,14: Phase B',
        grid: s2
      },
      {
        title: '3. Olho Central (Tebaka Core Primitive)',
        primitiveId: 'eye-tebaka',
        description: 'Pick up ▼1 at c=13 and c=15 on Row 7 to seal the central 3×3 black box around a single 1×1 white pupil (X) at (7, 14).',
        formula: 'Row 7 center: ▼1 at c=13, ▲1 at c=14 (pupil), ▼1 at c=15',
        grid: s3
      },
      {
        title: '4. Losangos Concêntricos (Concentric Eye Rings)',
        primitiveId: 'step-diagonal',
        description: 'Propagate four concentric stepped diamond rings around the central Tebaka eye across odd rows 1–13.',
        formula: 'Rows 1,5,9,13: ▼1 at c=3,7,11,17,21,25 | Rows 3,7,11: ▼1 at c=1,5,9,13,15,19,23,27',
        grid: s4
      },
      {
        title: '5. Olhos Inferiores & Fechamento (Lower Corner Eyes)',
        primitiveId: 'eye-tebaka',
        description: 'Complete Row 15 with ▼1 at c=1,5,9,13,15,19,23,27, enclosing the bottom-left and bottom-right corner eyes.',
        formula: 'Row 15: ▼1 at c=1,5,9,13,15,19,23,27',
        grid: s5
      }
    ];
  }

  /**
   * 3. AXIWI SE'ME BENRY - Desenho do joelho da cutia (Agouti's knee design) - 19x33
   */
  function buildAxiwiSemeSteps() {
    const R = 19, C = 33;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    [2, 6, 12, 16].forEach(function (r) { applyTwillRow(s2, r, 2); });
    [4, 14].forEach(function (r) { applyTwillRow(s2, r, 0); });
    // Rows 8 and 10 have vertical agouti-shin columns at c=5,7 and c=25,27 instead of horizontal 3-bars
    [8, 10].forEach(function (r) {
      applyTwillRow(s2, r, 0);
      s2[r][6] = 0;
      s2[r][26] = 0;
    });

    const s3 = cloneGrid(s2);
    // Central white cross (+) & diamond core
    setPoints(s3, 7, [11, 15, 17, 21], 1);
    setPoints(s3, 11, [11, 15, 17, 21], 1);
    setPoints(s3, 9, [9, 13, 19, 23], 1);
    setPoints(s3, 5, [13, 19], 1);
    setPoints(s3, 13, [13, 19], 1);

    const s4 = cloneGrid(s3);
    // Vertical Agouti Shins (straight vertical black columns from r=6..12 at c=5,7 and c=25,27)
    [7, 9, 11].forEach(function (r) {
      setPoints(s4, r, [5, 7, 25, 27], 1);
    });
    setPoints(s4, 9, [3, 29], 1);
    setPoints(s4, 7, [1, 31], 1);
    setPoints(s4, 11, [1, 31], 1);

    const s5 = cloneGrid(s4);
    // Interlocking T-Hooks (Joelho da Cutia / Agouti's Knees) in top & bottom registers (r=1..5 and r=13..17)
    [1, 5, 13, 17].forEach(function (r) {
      setPoints(s5, r, [3, 9, 13, 19, 23, 29], 1);
    });
    [3, 15].forEach(function (r) {
      setPoints(s5, r, [1, 5, 7, 11, 15, 17, 21, 25, 27, 31], 1);
    });

    return [
      {
        title: '1. Urdidura & Moldura (Border Frame)',
        primitiveId: 'border',
        description: 'Anchor the 33 vertical warp splints with solid top and bottom borders.',
        formula: 'Row 0, 18: ▼33',
        grid: s1
      },
      {
        title: '2. Base de Sarja Modulada (Modulated Twill)',
        primitiveId: 'twill-3-1',
        description: 'Weave the even rows with [▲1 ▼3], opening c=6 and c=26 on Rows 8 & 10 to make room for the vertical agouti leg columns.',
        formula: 'Rows 8, 10: open ▲1 at c=6, 26 to split ▼3 into twin ▼1 vertical struts (c=5,7 & c=25,27)',
        grid: s2
      },
      {
        title: '3. Cruz Central em Losango (Hollow Cross Core)',
        primitiveId: 'cross-hollow',
        description: 'Form the central white cross (+) surrounded by a stepped black diamond frame.',
        formula: 'Row 9 center: ▲5 (c=14..18) with vertical arms at c=16 on Rows 7..11',
        grid: s3
      },
      {
        title: '4. Pernas da Cutia (Vertical Twin Columns)',
        primitiveId: 'twin-pillars',
        description: 'Lock c=5,7 on the left and c=25,27 on the right continuously from Row 6 to Row 12 to create the straight vertical agouti legs.',
        formula: 'Rows 6..12: continuous ▼1 at c=5, 7 and c=25, 27',
        grid: s4
      },
      {
        title: '5. Joelhos da Cutia (Interlocking T-Hooks)',
        primitiveId: 'knee-hook',
        description: 'Complete the upper and lower T-shaped knee joints (Axiwi Se\'me) on Rows 1–5 and 13–17.',
        formula: 'Rows 1,5,13,17: ▼1 stems at c=3,9,13,19,23,29 | Rows 3,15: ▼1 at c=1,5,7,11,15,17,21,25,27,31',
        grid: s5
      }
    ];
  }

  /**
   * 4. WERI NAHPY BENRY - Desenho feito pela mulher (Woman's design) - 19x33
   * Pure 2D wallpaper lattice with period (8 rows x 8 cols)
   */
  function buildWeriNahpySteps() {
    const R = 19, C = 33;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    // Double-step paired twill cadence: Phase A on rows 2, 8, 10, 16; Phase B on rows 4, 6, 12, 14
    // Pairing (4,6) and (8,10) and (12,14) opens symmetric vertical cross arms above and below rows 5, 9, 13!
    [2, 8, 10, 16].forEach(function (r) { applyTwillRow(s2, r, 0); });
    [4, 6, 12, 14].forEach(function (r) { applyTwillRow(s2, r, 2); });

    const s3 = cloneGrid(s2);
    // Single unit cell primitive in top-left (rows 1..5, cols 1..11)
    setPoints(s3, 1, [5], 1);
    setPoints(s3, 5, [5], 1);
    setPoints(s3, 3, [1, 3, 7, 9, 11], 1);

    const s4 = cloneGrid(s3);
    // Tile horizontal cross centers across rows 1, 5, 9, 13, 17 (every 8 columns: c=5, 13, 21, 29)
    [1, 5, 9, 13, 17].forEach(function (r) {
      setPoints(s4, r, [5, 13, 21, 29], 1);
    });

    const s5 = cloneGrid(s4);
    // Tile vertical triplet necks across rows 3, 7, 11, 15 (every 8 columns: c-2, c, c+2 around c=1, 9, 17, 25, 33)
    [3, 7, 11, 15].forEach(function (r) {
      setPoints(s5, r, [1, 3, 7, 9, 11, 15, 17, 19, 23, 25, 27, 31], 1);
    });

    return [
      {
        title: '1. Urdidura & Moldura (Border Frame)',
        primitiveId: 'border',
        description: 'Set up the 19×33 loom frame with solid top and bottom borders.',
        formula: 'Row 0, 18: ▼33',
        grid: s1
      },
      {
        title: '2. Grade de Sarja Pareada (Paired Twill Grid)',
        primitiveId: 'twill-3-1',
        description: 'Weave Phase A on rows 2, 8, 10, 16 and Phase B on rows 4, 6, 12, 14 so each cross row (5, 9, 13) is flanked by identical even rows.',
        formula: 'Rows 2,8,10,16: Phase A [▲1 ▼3] | Rows 4,6,12,14: Phase B [▼2 ▲1 ▼3...]',
        grid: s2
      },
      {
        title: '3. Célula Primitiva (Single Woman\'s Cross Tile)',
        primitiveId: 'woman-tile',
        description: 'Construct one unit primitive: a white cross (+) centered on Row 5 (c=2) with a 3-tooth vertical comb neck on Row 3 (c=7,9,11).',
        formula: 'Unit Tile: r=1,5 has ▼1 at c=5; r=3 has ▼1 triplet at c=7,9,11',
        grid: s3
      },
      {
        title: '4. Translação dos Centros (Horizontal Cross Lattice)',
        primitiveId: 'woman-tile',
        description: 'Repeat the single ▼1 divider every 8 columns (c=5, 13, 21, 29) on rows 1, 5, 9, 13, 17 to open the staggered lattice of white crosses.',
        formula: 'Rows 1,5,9,13,17: ▼1 at c ≡ 5 (mod 8) -> long ▲7 white crossbars!',
        grid: s4
      },
      {
        title: '5. Pentes Triplos (Triplet Comb Connectors)',
        primitiveId: 'twin-pillars',
        description: 'Complete the wallpaper tessellation by placing the 3-tooth ▼1 comb connectors on rows 3, 7, 11, 15.',
        formula: 'Rows 3,7,11,15: ▼1 at c = 1,3, 7,9,11, 15,17,19, 23,25,27, 31',
        grid: s5
      }
    ];
  }

  /**
   * 5. MANJIKI PRENY BENRY - Desenho da aba do peixe (Fish fin design) - 17x29
   */
  function buildManjikiPrenySteps() {
    const R = 17, C = 29;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    // 3 vertical fish fin spines at c = 6 (left), 14 (center), 22 (right)
    for (let r = 2; r <= 14; r++) {
      setPoints(s2, r, [6, 14, 22], 1);
    }

    const s3 = cloneGrid(s2);
    // Horizontal fish-fin crossbars (5 units wide) along the 3 vertical spines:
    // Outer spines (c=6, 22) have 5-wide crossbars (c=4..8 and c=20..24) on rows 2, 8, 10
    [2, 8, 10].forEach(function (r) {
      setRanges(s3, r, [[4, 8], [20, 24]], 1);
    });
    // Center spine (c=14) has 5-wide crossbars (c=12..16) on rows 4, 6, 12, 14
    [4, 6, 12, 14].forEach(function (r) {
      setRanges(s3, r, [[12, 16]], 1);
    });

    const s4 = cloneGrid(s3);
    // Stepped 3-wide bars and border teeth on even rows
    [2, 8, 10].forEach(function (r) {
      setRanges(s4, r, [[0, 2], [10, 12], [16, 18], [26, 28]], 1);
    });
    [4, 6, 12, 14].forEach(function (r) {
      setRanges(s4, r, [[0, 0], [2, 4], [8, 10], [18, 20], [24, 26], [28, 28]], 1);
    });

    const s5 = cloneGrid(s4);
    // Odd-row vertical connectors completing the interlocking C-hooks and fin tips
    setPoints(s5, 1, [0, 12, 16, 28], 1);
    [3, 7, 11].forEach(function (r) {
      setPoints(s5, r, [2, 6, 10, 14, 18, 22, 26], 1);
    });
    [5, 13].forEach(function (r) {
      setPoints(s5, r, [4, 6, 8, 14, 20, 22, 24], 1);
    });
    setPoints(s5, 9, [0, 6, 12, 14, 16, 22, 28], 1);
    setPoints(s5, 15, [2, 10, 18, 26], 1);

    return [
      {
        title: '1. Urdidura & Moldura (17×29 Loom Frame)',
        primitiveId: 'border',
        description: 'Anchor 29 vertical warp strips with top and bottom borders.',
        formula: 'Row 0, 16: ▼29',
        grid: s1
      },
      {
        title: '2. Espinhas Dorsais (Three Fish-Fin Spines)',
        primitiveId: 'fin-spine',
        description: 'Raise three vertical black spines spaced 8 columns apart at c=6 (left fin), c=14 (center dorsal spine), and c=22 (right fin).',
        formula: 'Cols c=6, 14, 22: continuous ▼1 vertical axes across rows 2..14',
        grid: s2
      },
      {
        title: '3. Abas do Peixe (5-Wide Horizontal Fin Bars)',
        primitiveId: 'fin-spine',
        description: 'Branch 5-column horizontal fin bars off the outer spines on rows 2, 8, 10 and off the center spine on rows 4, 6, 12, 14.',
        formula: 'Outer fins (c=4..8, 20..24) on r=2,8,10 | Center fin (c=12..16) on r=4,6,12,14',
        grid: s3
      },
      {
        title: '4. Escadas Intercaladas (Interlocking Step Bars)',
        primitiveId: 'twill-3-1',
        description: 'Fill the channels between the three fish-fin spines with 3-unit horizontal step bars and border teeth.',
        formula: 'Rows 2,8,10: ▲1 at c=3,9,13,15,19,25 | Rows 4,6,12,14: ▲1 at c=1,5,7,11,17,21,23,27',
        grid: s4
      },
      {
        title: '5. Fechamento das Abas (Odd-Row Connectors & Edge Hooks)',
        primitiveId: 'hook-bracket',
        description: 'Link the stepped C-brackets on odd rows 1..15 to complete Manjiki Preny Benry.',
        formula: 'Rows 3,7,11: ▼1 at c=2,6,10,14,18,22,26 | Rows 5,13: ▼1 at c=4,6,8,14,20,22,24',
        grid: s5
      }
    ];
  }

  /**
   * 6. DJA BENRY - Desenho da semente (Seed design) - 21x37
   * Staggered checkerboard of Seed Crosses (each cross encloses white X seeds at c=6, 12, 18, 24, 30)
   */
  function buildDjaSteps() {
    const R = 21, C = 37;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    // Vertical stems at c = 3, 9, 15, 21, 27, 33 on channel rows 1, 7, 13, 19
    [1, 7, 13, 19].forEach(function (r) {
      setPoints(s2, r, [3, 9, 15, 21, 27, 33], 1);
    });

    const s3 = cloneGrid(s2);
    // Single Seed Cross (Dja) primitive centered at (r=4, c=12)
    setRanges(s3, 2, [[11, 13]], 1);
    setPoints(s3, 3, [11, 13], 1); // encloses white X seed at (3, 12)!
    setRanges(s3, 4, [[9, 15]], 1);
    setPoints(s3, 5, [11, 13], 1); // encloses white X seed at (5, 12)!
    setRanges(s3, 6, [[11, 13]], 1);

    const s4 = cloneGrid(s3);
    // Even-row caps: Phase B on rows 2, 6, 14, 18 and Phase A on rows 8, 12
    [2, 6, 14, 18].forEach(function (r) { applyTwillRow(s4, r, 2); });
    [8, 12].forEach(function (r) { applyTwillRow(s4, r, 0); });
    // All 6 seed rows (3, 5, 9, 11, 15, 17) place ▼1 walls at c = 1, 5,7, 11,13, 17,19, 23,25, 29,31, 35
    // enclosing the 5 columns of white X seeds at c = 6, 12, 18, 24, 30!
    [3, 5, 9, 11, 15, 17].forEach(function (r) {
      setPoints(s4, r, [1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35], 1);
    });

    const s5 = cloneGrid(s4);
    // Staggered horizontal crossbars:
    // Rows 4 & 16 have 7-wide crossbars at c=9..15 and c=21..27 (plus half-crossbars at 0..3 and 33..36)
    [4, 16].forEach(function (r) {
      fillRow(s5, r, 1);
      setPoints(s5, r, [4, 8, 16, 20, 28, 32], 0);
    });
    // Row 10 shifts by 6 columns: 7-wide crossbars at c=3..9, c=15..21, and c=27..33!
    fillRow(s5, 10, 1);
    setPoints(s5, 10, [2, 10, 14, 22, 26, 34], 0);

    return [
      {
        title: '1. Urdidura & Moldura (21×37 Loom Frame)',
        primitiveId: 'border',
        description: 'Set up 37 vertical warp strips and weave the top and bottom borders.',
        formula: 'Row 0, 20: ▼37',
        grid: s1
      },
      {
        title: '2. Eixos das Sementes (6-Column Vertical Stems)',
        primitiveId: 'twin-pillars',
        description: 'Place vertical ▼1 stems every 6 columns (c=3, 9, 15, 21, 27, 33) on the channel rows 1, 7, 13, 19.',
        formula: 'Rows 1, 7, 13, 19: ▼1 at c = 3, 9, 15, 21, 27, 33',
        grid: s2
      },
      {
        title: '3. Primitiva Semente (Single Dja Seed Cross)',
        primitiveId: 'seed-dja',
        description: 'Weave one Dja Seed Cross around center (r=4, c=12): a 7-unit horizontal crossbar with vertical chambers enclosing white X-seeds at (3,12) and (5,12).',
        formula: 'Seed Chamber (r=3,5): ▼1 at c=11, 13 -> isolates ▲1 white X-seed at c=12!',
        grid: s3
      },
      {
        title: '4. Câmaras das Sementes (6×5 Seed Chamber Lattice)',
        primitiveId: 'seed-dja',
        description: 'Weave the twill caps (rows 2,6,8,12,14,18) and the ▼1 chamber walls on rows 3, 5, 9, 11, 15, 17 to enclose 30 white X-seeds across c=6, 12, 18, 24, 30.',
        formula: 'Rows 3,5,9,11,15,17: ▼1 at c=1, 5,7, 11,13, 17,19, 23,25, 29,31, 35',
        grid: s4
      },
      {
        title: '5. Cruzes Alternadas (Staggered Crossbars)',
        primitiveId: 'hook-bracket',
        description: 'Lock the staggered 7-unit horizontal crossbars on Rows 4 & 16 (centered at c=12, 24) and Row 10 (centered at c=6, 18, 30).',
        formula: 'Rows 4, 16: ▲1 at c=4,8,16,20,28,32 | Row 10: ▲1 at c=2,10,14,22,26,34',
        grid: s5
      }
    ];
  }

  /**
   * 7. WERI BIXI BENRY - Desenho da pele da mulher (Woman's skin design) - 21x37
   */
  function buildWeriBixiSteps() {
    const R = 21, C = 37;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    [2, 6, 12, 16].forEach(function (r) { applyTwillRow(s2, r, 0); });
    [4, 8, 10, 14].forEach(function (r) { applyTwillRow(s2, r, 2); });
    // Rows 8 and 10 form the central 7-wide medallion bars (c=15..21), 5-wide bracket caps (c=3..7, 29..33),
    // and open 3-wide white channels at c=8..10 and c=26..28!
    [8, 10].forEach(function (r) {
      setPoints(s2, r, [6, 18, 30], 1);
      setPoints(s2, r, [8, 9, 27, 28], 0);
    });
    // Row 18 forms the bottom triple-seed border bar
    fillRow(s2, 18, 1);
    setPoints(s2, 18, [2, 10, 14, 22, 26, 34], 0);

    const s3 = cloneGrid(s2);
    // Central 5-Seed Cross Medallion (centered at r=9, c=18):
    // 1 top X-seed at (7, 18), 3 middle X-seeds at (9, 16), (9, 18), (9, 20), 1 bottom X-seed at (11, 18)
    setPoints(s3, 7, [13, 17, 19, 23], 1);
    setPoints(s3, 9, [15, 17, 19, 21], 1);
    setPoints(s3, 11, [13, 17, 19, 23], 1);

    const s4 = cloneGrid(s3);
    // 45-degree stepped diagonal chevrons radiating from the central 5-X medallion to the left & right edges
    [1, 5, 13, 17].forEach(function (r) {
      setPoints(s4, r, [1, 5, 7, 11, 15, 21, 25, 29, 31, 35], 1);
    });
    [3, 7, 11, 15].forEach(function (r) {
      setPoints(s4, r, [3, 9, 13, 17, 19, 23, 27, 33], 1);
    });
    setPoints(s4, 9, [1, 5, 7, 11, 15, 17, 19, 21, 25, 29, 31, 35], 1);

    const s5 = cloneGrid(s4);
    // Bottom border triple-seed clusters on Row 19 (enclosing 3 white X-seeds at c=4,6,8 and c=28,30,32)
    setPoints(s5, 19, [3, 5, 7, 9, 13, 23, 27, 29, 31, 33], 1);

    return [
      {
        title: '1. Urdidura & Moldura (21×37 Loom Frame)',
        primitiveId: 'border',
        description: 'Prepare 37 vertical warp splints and weave the top and bottom borders.',
        formula: 'Row 0, 20: ▼37',
        grid: s1
      },
      {
        title: '2. Campo de Sarja & Barras Centrais (Twill & Medallion Bars)',
        primitiveId: 'twill-3-1',
        description: 'Establish Phase A twill on rows 2, 6, 12, 16, Phase B on rows 4, 14, the 7-unit central medallion bars on rows 8, 10, and the bottom seed-cluster bar on row 18.',
        formula: 'Rows 8, 10: ▼7 center bar (c=15..21) | Row 18: ▼7 corner bars (c=3..9, 27..33)',
        grid: s2
      },
      {
        title: '3. Medalhão de 5 Sementes (5-Seed Cross Core)',
        primitiveId: 'pineapple-5x',
        description: 'Weave the central 5-seed cross medallion around (r=9, c=18): 3 horizontal white X-seeds on Row 9 (c=16,18,20) and 1 X-seed each on Rows 7 & 11 (c=18).',
        formula: 'Center (r=7..11): ▲1 seeds at (7,18), (9,16), (9,18), (9,20), (11,18)',
        grid: s3
      },
      {
        title: '4. Chevrons Diagonais da Pele (Stepped Diagonal Chevrons)',
        primitiveId: 'step-diagonal',
        description: 'Propagate 45° stepped diagonal chevrons (< and >) from the central medallion out to the left and right borders.',
        formula: 'Rows 1,5,13,17: ▼1 at c=1,5,7,11,15,21,25,29,31,35 | Rows 3,7,11,15: ▼1 at c=3,9,13,17,19,23,27,33',
        grid: s4
      },
      {
        title: '5. Sementes Triplas da Base (Bottom Triple-Seed Clusters)',
        primitiveId: 'seed-dja',
        description: 'Enclose groups of three white X-seeds (c=4,6,8 and c=28,30,32) along the bottom border on Row 19.',
        formula: 'Row 19: ▼1 walls at c=3,5,7,9 & 27,29,31,33 -> 3 white X-seeds in each lower corner!',
        grid: s5
      }
    ];
  }

  /**
   * 8. NANA BIXI BENRY - Desenho da casca do abacaxi (Pineapple peel design) - 21x37
   * Staggered checkerboard lattice of the 5-X Pineapple Peel medallion!
   */
  function buildNanaBixiSteps() {
    const R = 21, C = 37;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    [4, 10, 16].forEach(function (r) {
      applyTwillRow(s2, r, 0);
    });
    [2, 12, 14].forEach(function (r) {
      fillRow(s2, r, 1);
      setPoints(s2, r, [2, 6, 14, 18, 22, 30, 34], 0);
    });
    [6, 8, 18].forEach(function (r) {
      fillRow(s2, r, 1);
      setPoints(s2, r, [6, 10, 14, 22, 26, 30], 0);
    });

    const s3 = cloneGrid(s2);
    // Stamp central 5-X Pineapple Peel scales at (c=10, 26):
    // 3 horizontal X-seeds at r=1,13 (c=8,10,12 & c=24,26,28) and 1 vertical X-seed at r=3,7,11,15,19 (c=10, 26)
    [1, 13].forEach(function (r) {
      setPoints(s3, r, [7, 9, 11, 13, 23, 25, 27, 29], 1);
    });
    [3, 11, 15].forEach(function (r) {
      setPoints(s3, r, [5, 9, 11, 15, 21, 25, 27, 31], 1);
    });

    const s4 = cloneGrid(s3);
    // Staggered Pineapple Scales centered at c=2, 18, 34 on rows 5, 7, 9, 17, 19
    [5, 9, 17].forEach(function (r) {
      setPoints(s4, r, [1, 3, 7, 13, 17, 19, 23, 29, 33, 35], 1);
    });
    [7, 19].forEach(function (r) {
      setPoints(s4, r, [1, 3, 5, 9, 11, 15, 17, 19, 21, 25, 27, 31, 33, 35], 1);
    });

    const s5 = cloneGrid(s4);
    // Complete upper/middle X-seeds at c=2, 18, 34 on rows 1, 13
    [1, 13].forEach(function (r) {
      setPoints(s5, r, [1, 3, 7, 9, 11, 13, 17, 19, 23, 25, 27, 29, 33, 35], 1);
    });

    return [
      {
        title: '1. Urdidura & Moldura (21×37 Loom Frame)',
        primitiveId: 'border',
        description: 'Anchor 37 vertical warp splints with solid top and bottom borders.',
        formula: 'Row 0, 20: ▼37',
        grid: s1
      },
      {
        title: '2. Grade Diagonal de Sarja (Diagonal Scale Mesh)',
        primitiveId: 'twill-3-1',
        description: 'Weave the even-row horizontal scale bands (rows 2..18) with extended ▼7 black caps over each pineapple medallion.',
        formula: 'Rows 4,10,16: [▲1 ▼3] | Rows 2,12,14 & 6,8,18: ▼7 scale caps',
        grid: s2
      },
      {
        title: '3. Escama de Abacaxi (5-X Pineapple Medallions at c=10, 26)',
        primitiveId: 'pineapple-5x',
        description: 'Construct the 5-X Pineapple Peel medallions centered at c=10 and c=26: 3 horizontal X-seeds (c=8,10,12 & 24,26,28) and 1 X-seed above and below.',
        formula: '5-X Medallion: 3 horizontal X-seeds on rows 1,13 + vertical X-seeds on rows 3,11,15',
        grid: s3
      },
      {
        title: '4. Mosaico Alternado (Staggered Scales at c=2, 18, 34)',
        primitiveId: 'pineapple-5x',
        description: 'Tile the staggered 5-X Pineapple medallions at c=2, 18, 34 across rows 5, 7, 9, 17, 19.',
        formula: 'Row 7, 19: 3 X-seeds at c=16,18,20 and 2 border X-seeds at c=2,4 & c=32,34',
        grid: s4
      },
      {
        title: '5. Canais da Casca (Complete Nana Bixi Lattice)',
        primitiveId: 'step-diagonal',
        description: 'Lock the remaining seed chambers on rows 1 and 13 at c=2, 18, 34 to complete the 21×37 pineapple peel tessellation.',
        formula: 'Full 21×37 Nana Bixi Benry tessellation',
        grid: s5
      }
    ];
  }

  /**
   * 9. PANAPNA BENRY - Desenho da borboleta grande (Butterfly design) - 23x31
   */
  function buildPanapnaSteps() {
    const R = 23, C = 31;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    // Even-row wing frames and central row 11 bridge
    [3, 8, 14, 19].forEach(function (r) {
      fillRow(s2, r, 1);
      setPoints(s2, r, [2, 6, 8, 12, 18, 22, 24, 28], 0);
    });
    [6, 16].forEach(function (r) {
      fillRow(s2, r, 1);
      setPoints(s2, r, [4, 10, 14, 16, 20, 26], 0);
    });
    fillRow(s2, 11, 1);
    setPoints(s2, 11, [0, 4, 10, 14, 16, 20, 26, 30], 0);

    const s3 = cloneGrid(s2);
    // Central Giant Butterfly (Panapna) at (r=9..13, c=13..17):
    // Black 5-column wing block (c=13..17 on rows 10,12) with twin vertical white diamonds at (r=9,13; c=14,16)
    [9, 13].forEach(function (r) {
      setPoints(s3, r, [1, 5, 9, 13, 15, 17, 21, 25, 29], 1);
    });
    [10, 12].forEach(function (r) {
      setPoints(s3, r, [0, 1, 5, 9, 13, 14, 15, 16, 17, 21, 25, 29, 30], 1);
    });

    const s4 = cloneGrid(s3);
    // 4 Quadrant Butterfly Medallions at (r=1..5 and r=17..21, c=5..9 and c=21..25):
    // Twin vertical white wing diamonds at c=6, 8 and c=22, 24 on rows 1, 5, 17, 21
    [1, 5, 17, 21].forEach(function (r) {
      setPoints(s4, r, [1, 5, 7, 9, 13, 17, 21, 23, 25, 29], 1);
    });
    [2, 4, 18, 20].forEach(function (r) {
      setPoints(s4, r, [1, 5, 6, 7, 8, 9, 13, 17, 21, 22, 23, 24, 25, 29], 1);
    });

    const s5 = cloneGrid(s4);
    // Diagonal wing connectors on rows 7 and 15
    [7, 15].forEach(function (r) {
      setPoints(s5, r, [3, 7, 11, 15, 19, 23, 27], 1);
    });

    return [
      {
        title: '1. Urdidura & Moldura (23×31 Loom Frame)',
        primitiveId: 'border',
        description: 'Prepare 31 vertical warp splints and weave the top and bottom borders (Rows 0 and 22).',
        formula: 'Row 0, 22: ▼31',
        grid: s1
      },
      {
        title: '2. Moldura Zig-Zag das Asas (Wing Zig-Zag Frame)',
        primitiveId: 'twill-3-1',
        description: 'Weave the horizontal wing-frame bars on rows 3, 6, 8, 11, 14, 16, 19.',
        formula: 'Rows 3,6,8,11,14,16,19: horizontal ▼3 and ▼5 wing-frame bars',
        grid: s2
      },
      {
        title: '3. Borboleta Central (Central Panapna Medallion)',
        primitiveId: 'butterfly-wing',
        description: 'Weave the central Butterfly body at (r=9..13, c=13..17): a 5-column black wing block bisected by a body spine (c=15) with twin vertical white wing diamonds at c=14, 16.',
        formula: 'Center (r=9..13, c=13..17): body spine ▼1 at c=15 flanked by twin ♦♦ wing spots',
        grid: s3
      },
      {
        title: '4. Quatro Borboletas nos Quadrantes (Quadrant Butterflies)',
        primitiveId: 'butterfly-wing',
        description: 'Replicate the Panapna butterfly medallion in all four quadrants at (r=1..5, 17..21; c=5..9, 21..25).',
        formula: 'Quadrant wings (c=5..9 & 21..25): twin ♦♦ spots at c=6,8 & c=22,24 on rows 1,5,17,21',
        grid: s4
      },
      {
        title: '5. Antenas & Pontes das Asas (Diagonal Wing Connectors)',
        primitiveId: 'fin-spine',
        description: 'Connect the 5 butterflies across rows 7 and 15 at c=3, 7, 11, 15, 19, 23, 27.',
        formula: 'Rows 7, 15: ▼1 at c=3, 7, 11, 15, 19, 23, 27',
        grid: s5
      }
    ];
  }

  /**
   * 10. XIRMINJA NAHPY BENRY - Entidade mitológica da água (Water mythologic entity) - 21x23
   * Dual cosmological register:
   *   Rows 0..6: Upper Fret Register with Twin-Eye boxes of Xirminja
   *   Rows 6..20: Lower River Meander Register
   */
  function buildXirminjaSteps() {
    const R = 21, C = 23;
    const s1 = createGrid(R, C, 0);
    fillRow(s1, 0, 1);
    fillRow(s1, 6, 1); // Cosmological waterline dividing upper & lower registers!
    fillRow(s1, R - 1, 1);

    const s2 = cloneGrid(s1);
    // Upper Register (Rows 1..5): Fret pillars at c=3, 11, 19 + twin-eye boxes at c=5..9 and c=13..17
    setPoints(s2, 1, [3, 11, 19], 1);
    [2, 4].forEach(function (r) {
      setPoints(s2, r, [0, 1, 3, 5, 6, 7, 8, 9, 11, 13, 14, 15, 16, 17, 19, 22], 1);
    });
    // Row 3: Twin white X-eyes inside each box at c=6,8 and c=14,16 (plus half-box eye at c=0)
    setPoints(s2, 3, [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 22], 1);
    setPoints(s2, 5, [3, 7, 11, 19], 1);

    const s3 = cloneGrid(s2);
    // Lower Register (Rows 7..19): Outer river meander bars on rows 8, 10, 12, 14, 16, 18
    [8, 18].forEach(function (r) {
      fillRow(s3, r, 1);
      setPoints(s3, r, [3, 7, 11, 15, 16, 20], 0);
    });
    [10, 16].forEach(function (r) {
      setPoints(s3, r, [2, 3, 4, 6, 7, 8, 10, 11, 12, 15, 16, 19, 20, 21], 1);
    });
    [12, 14].forEach(function (r) {
      setPoints(s3, r, [0, 1, 4, 5, 6, 8, 9, 10, 13, 14, 16, 17, 18, 21, 22], 1);
    });

    const s4 = cloneGrid(s3);
    // Central River Cross & Meander Core (rows 11, 13, 15)
    [11, 15].forEach(function (r) {
      setPoints(s4, r, [4, 10, 14, 15, 16, 21], 1);
    });
    setPoints(s4, 13, [6, 8, 22], 1);

    const s5 = cloneGrid(s4);
    // Odd-row river wave connectors (rows 7, 9, 17, 19)
    [7, 19].forEach(function (r) {
      setPoints(s5, r, [14, 16], 1);
    });
    [9, 17].forEach(function (r) {
      setPoints(s5, r, [2, 6, 8, 12, 18], 1);
    });

    return [
      {
        title: '1. Horizonte da Água (Dual Register Waterline)',
        primitiveId: 'border',
        description: 'Weave three solid horizontal black lines: Top border (Row 0), Bottom border (Row 20), and the Waterline (Row 6) separating Xirminja\'s eyes above from the river currents below.',
        formula: 'Rows 0, 6, 20: ▼23 (divides canvas into Upper & Lower registers)',
        grid: s1
      },
      {
        title: '2. Olhos de Xirminja (Upper Twin-Eye Fret Boxes)',
        primitiveId: 'xirminja-box',
        description: 'In the Upper Register (Rows 1–5), erect vertical fret walls (c=3, 11, 19) and weave rectangular black boxes enclosing twin white X-eyes at (r=3; c=6,8 & c=14,16).',
        formula: 'Row 3 boxes: ▼1 ▲1 (eye) ▼1 ▲1 (eye) ▼1 inside white fret frame',
        grid: s2
      },
      {
        title: '3. Corredeiras do Rio (Lower Meander Bars)',
        primitiveId: 'twill-3-1',
        description: 'In the Lower Register (Rows 8, 10, 12, 14, 16, 18), weave the stepped horizontal wave bars.',
        formula: 'Even rows 8..18: stepped ▼3 horizontal river wave bars',
        grid: s3
      },
      {
        title: '4. Vórtice Central da Água (River Cross Vortex)',
        primitiveId: 'cross-hollow',
        description: 'Form the central water vortex and vertical river hooks on rows 11, 13, 15.',
        formula: 'Row 13 center: ▼1 at c=6, 8, 22 | Rows 11, 15: ▼3 bar at c=14..16',
        grid: s4
      },
      {
        title: '5. Meandros Completos (Connected River Currents)',
        primitiveId: 'step-diagonal',
        description: 'Connect the undulating water meanders across rows 7, 9, 17, 19 to complete Xirminja Nahpy Benry.',
        formula: 'Rows 7,19: ▼1 at c=14,16 | Rows 9,17: ▼1 at c=2,6,8,12,18',
        grid: s5
      }
    ];
  }

  /**
   * 11. JAMAXI TRICOLOR (URUCUM & ARUMÃ) - Physical Cargo Basket Weave (Photo 11) - 19x33
   * Uses Axiwi Se'me / Waraki diamond geometry with a terracotta Urucum weft band in rows 4..14!
   */
  function buildJamaxiUrucumSteps() {
    const steps = buildAxiwiSemeSteps();
    return steps.map(function (st, idx) {
      if (idx === 0) {
        return {
          title: '1. Urdidura Preta & Trama Bicolor (Urucum + Natural)',
          primitiveId: st.primitiveId,
          description: 'Set up 33 black-dyed vertical arumã warp splints. Rows 0–3 and 15–18 use natural cream weft splints; middle Rows 4–14 switch to terracotta Urucum-dyed weft splints!',
          formula: 'Rows 4..14: terracotta Urucum weft | Rows 0..3, 15..18: natural cream weft',
          grid: st.grid
        };
      }
      return st;
    });
  }

  /**
   * 12. BALAIO DE ARUMÃ (TRAMA FÍSICA) - Physical Twill Basket Weave (Photo 12) - 17x29
   */
  function buildBalaioNaturalSteps() {
    const steps = buildManjikiPrenySteps();
    return steps.map(function (st, idx) {
      if (idx === 0) {
        return {
          title: '1. Talas de Arumã (Physical Orthogonal Splints)',
          primitiveId: st.primitiveId,
          description: 'In the physical cylinder basket, vertical black warp splints stay rigid while flexible horizontal natural arumã splints float OVER 1, 3, or 5 warp splints.',
          formula: 'Orthogonal weave: consecutive ▲ Over cells merge into smooth horizontal cane floats',
          grid: st.grid
        };
      }
      return st;
    });
  }

  /**
   * Reusable Primitive Stamps for Interactive Playground Mode
   * Each primitive has a small 2D matrix where:
   *   0 = Over (Light weft)
   *   1 = Under (Dark warp)
   *   null = transparent (do not overwrite)
   */
  const PRIMITIVES = [
    {
      id: 'single-cell',
      name: 'Tala 1×1 (Single Crossing)',
      kinjaName: 'Tala Individual',
      category: 'Básico',
      description: 'Toggle a single warp/weft intersection between ▲ Over (0) and ▼ Under (1).',
      matrix: [[1]]
    },
    {
      id: 'twill-3-1',
      name: 'Passo de Sarja (▼3 ▲1 Twill)',
      kinjaName: 'Escada 3×1',
      category: 'Cadência',
      description: 'The fundamental 4-column building block of Kinja basketry: Under 3 black warp strips, Over 1 light weft strip.',
      matrix: [
        [1, 1, 1, 0]
      ]
    },
    {
      id: 'eye-tebaka',
      name: 'Olho (Tebaka 3×3)',
      kinjaName: 'Tebaka',
      category: 'Motivo Central',
      description: 'A 3×3 black box enclosing a single 1×1 white X-pupil in the center, framed by a 5×5 white channel.',
      matrix: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'seed-dja',
      name: 'Semente em Cruz (Dja 5×7)',
      kinjaName: 'Dja',
      category: 'Motivo Central',
      description: 'A central black cross (+) enclosing 4 white 1×1 X-seeds in its four quadrants.',
      matrix: [
        [0, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 0]
      ]
    },
    {
      id: 'pineapple-5x',
      name: 'Casca de Abacaxi (Nana 5-X)',
      kinjaName: 'Nana Bixi',
      category: 'Medalhão',
      description: 'Stepped diamond scale containing 5 white X-seeds: 3 across the middle and 1 above and below.',
      matrix: [
        [null, 0, 1, 1, 1, 0, null],
        [0, 1, 1, 0, 1, 1, 0],
        [1, 1, 0, 1, 0, 1, 1],
        [0, 1, 1, 0, 1, 1, 0],
        [null, 0, 1, 1, 1, 0, null]
      ]
    },
    {
      id: 'butterfly-wing',
      name: 'Borboleta (Panapna 5×7)',
      kinjaName: 'Panapna',
      category: 'Medalhão',
      description: 'Butterfly body spine (c=center) flanked by symmetrical pairs of white wing spots.',
      matrix: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
      ]
    },
    {
      id: 'knee-hook',
      name: 'Gancho da Cutia (Axiwi T-Hook)',
      kinjaName: 'Axiwi Se\'me',
      category: 'Borda & Gancho',
      description: 'Interlocking T-shaped hook used along borders and agouti knee transitions.',
      matrix: [
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 0, 1, 1]
      ]
    },
    {
      id: 'xirminja-box',
      name: 'Olhos da Água (Xirminja Twin-Eye)',
      kinjaName: 'Xirminja',
      category: 'Cosmologia',
      description: 'Rectangular Amazonian fret box enclosing twin white X-eyes of the water entity.',
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0]
      ]
    }
  ];

  function buildCatalog() {
    const raw = [
      {
        id: 'waraki',
        kinjaName: 'WARAKI BENRY',
        ptName: 'Desenho do aracu',
        enName: 'Aracu design (Aracu fish)',
        image: '/images/patterns/waraki.jpg',
        category: 'Medallion (4Q Symmetry)',
        difficulty: 'Beginner',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Represents the scales and double-bar eye of the Aracu fish (Leporinus), woven with 4-quadrant dihedral symmetry and four floating corner scales.',
        steps: buildWarakiSteps()
      },
      {
        id: 'tebaka',
        kinjaName: 'TEBAKA BENRY',
        ptName: 'Desenho com olho',
        enName: 'Eye design',
        image: '/images/patterns/tebaka.jpg',
        category: 'Medallion (4Q Symmetry)',
        difficulty: 'Beginner',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Transforms the open center and corners of Waraki Benry into closed 3×3 Tebaka eyes, each guarding a 1×1 X-shaped pupil.',
        steps: buildTebakaSteps()
      },
      {
        id: 'weri-nahpy',
        kinjaName: 'WERI NAHPY BENRY',
        ptName: 'Desenho feito pela mulher',
        enName: "Woman's design",
        image: '/images/patterns/weri-nahpy.jpg',
        category: '2D Repeating Lattice',
        difficulty: 'Beginner',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: 'tile',
        tilePeriod: [8, 8],
        culturalNote: 'A pure mathematical wallpaper tessellation (period 8 rows × 8 columns) of interlocking white crosses with paired double-row twill bands.',
        steps: buildWeriNahpySteps()
      },
      {
        id: 'dja',
        kinjaName: 'DJA BENRY',
        ptName: 'Desenho da semente',
        enName: 'Seed design',
        image: '/images/patterns/dja.jpg',
        category: '2D Repeating Lattice',
        difficulty: 'Intermediate',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: 'tile',
        tilePeriod: [6, 12],
        culturalNote: 'Each Dja cross shelters four white X-seeds in its quadrants, tiled in a 3×3 matrix linked by T-shaped meander spines.',
        steps: buildDjaSteps()
      },
      {
        id: 'manjiki-preny',
        kinjaName: 'MANJIKI PRENY BENRY',
        ptName: 'Desenho da aba do peixe',
        enName: 'Fish fin design',
        image: '/images/patterns/manjiki-preny.jpg',
        category: 'Vertical Spines',
        difficulty: 'Intermediate',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Built around three continuous vertical dorsal spines (c=5, 14, 23) with 5-unit horizontal pectoral fin bars and interlocking stepped C-hooks.',
        steps: buildManjikiPrenySteps()
      },
      {
        id: 'axiwi-seme',
        kinjaName: "AXIWI SE'ME BENRY",
        ptName: 'Desenho do joelho da cutia',
        enName: "Agouti's knee design",
        image: '/images/patterns/axiwi-seme.jpg',
        category: 'Medallion & Columns',
        difficulty: 'Intermediate',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Combines a central cross medallion with straight vertical twin columns (the shins of the forest agouti) and interlocking T-shaped knee hooks.',
        steps: buildAxiwiSemeSteps()
      },
      {
        id: 'weri-bixi',
        kinjaName: 'WERI BIXI BENRY',
        ptName: 'Desenho da pele da mulher',
        enName: "Woman's skin design",
        image: '/images/patterns/weri-bixi.jpg',
        category: 'Seed Medallion (4Q)',
        difficulty: 'Intermediate',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Honors traditional body painting with a central 5-seed cross medallion surrounded by stepped diamond waves and triple-seed border clusters.',
        steps: buildWeriBixiSteps()
      },
      {
        id: 'nana-bixi',
        kinjaName: 'NANA BIXI BENRY',
        ptName: 'Desenho da casca do abacaxi',
        enName: 'Pineapple peel design',
        image: '/images/patterns/nana-bixi.jpg',
        category: 'Staggered Lattice',
        difficulty: 'Advanced',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Tiles the 5-seed diamond medallion on a staggered diagonal checkerboard, reproducing the armored hexagonal scales of the Amazonian pineapple.',
        steps: buildNanaBixiSteps()
      },
      {
        id: 'panapna',
        kinjaName: 'PANAPNA BENRY',
        ptName: 'Desenho da borboleta grande',
        enName: 'Butterfly design',
        image: '/images/patterns/panapna.jpg',
        category: '5-Medallion Quincunx',
        difficulty: 'Advanced',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Arranges five giant Amazonian Morpho butterflies in a quincunx (1 central body + 4 quadrant wings), each with symmetrical white wing spots.',
        steps: buildPanapnaSteps()
      },
      {
        id: 'xirminja',
        kinjaName: 'XIRMINJA NAHPY BENRY',
        ptName: 'Desenho feito pela entidade mitológica da água',
        enName: 'Design made by the water mythologic entity',
        image: '/images/patterns/xirminja.jpg',
        category: 'Dual Register Cosmology',
        difficulty: 'Advanced',
        defaultRenderMode: 'kinja',
        palette: 'natural',
        symmetry: 'none',
        culturalNote: 'Divided by a solid waterline at Row 6: above, twin-eyed fret boxes peer out like Xirminja above the river surface; below, undulating water currents swirl around a central vortex.',
        steps: buildXirminjaSteps()
      },
      {
        id: 'jamaxi-urucum',
        kinjaName: 'JAMAXI TRICOLOR (URUCUM)',
        ptName: 'Cesto cargueiro em arumã e urucum',
        enName: '3-Color Urucum & Arumã Cargo Basket',
        image: '/images/patterns/basket-urucum.jpg',
        category: 'Physical Basket Weave',
        difficulty: 'Master',
        defaultRenderMode: 'basket',
        palette: 'urucum',
        symmetry: '4q',
        culturalNote: 'Real woven cargo basket (jamaxi) demonstrating how Axiwi Se\'me Benry translates to physical orthogonal splints using natural cream arumã at the borders and terracotta urucum in the central register.',
        steps: buildJamaxiUrucumSteps()
      },
      {
        id: 'balaio-manjiki',
        kinjaName: 'TRAMA DE ARUMÃ (MANJIKI)',
        ptName: 'Tecelagem física da aba do peixe',
        enName: 'Physical Twill Weave of Fish Fin Design',
        image: '/images/patterns/basket-natural.jpg',
        category: 'Physical Basket Weave',
        difficulty: 'Master',
        defaultRenderMode: 'basket',
        palette: 'natural',
        symmetry: '4q',
        culturalNote: 'Close-up of a physical cylindrical basket weaving Manjiki Preny Benry: notice how horizontal cream weft splints float OVER 3 or 5 vertical black warp splints.',
        steps: buildBalaioNaturalSteps()
      }
    ];

    return raw.map(function (item) {
      const finalGrid = item.steps[item.steps.length - 1].grid;
      item.rows = finalGrid.length;
      item.cols = finalGrid[0].length;
      item.grid = cloneGrid(finalGrid);
      return item;
    });
  }

  /**
   * Compute run-length weaving instructions for a single row:
   * Returns array of { type: 'under' | 'over', count: number, startCol: number, endCol: number }
   * where value 1 = 'under' (Weft goes UNDER dark warp -> dark warp visible)
   * and value 0 = 'over' (Weft goes OVER dark warp -> light weft float visible)
   */
  function encodeRowRuns(rowArray) {
    if (!rowArray || rowArray.length === 0) return [];
    const runs = [];
    let currentVal = rowArray[0];
    let count = 1;
    let startCol = 0;

    for (let c = 1; c < rowArray.length; c++) {
      if (rowArray[c] === currentVal) {
        count++;
      } else {
        runs.push({
          type: currentVal === 1 ? 'under' : 'over',
          val: currentVal,
          count: count,
          startCol: startCol,
          endCol: c - 1
        });
        currentVal = rowArray[c];
        count = 1;
        startCol = c;
      }
    }
    runs.push({
      type: currentVal === 1 ? 'under' : 'over',
      val: currentVal,
      count: count,
      startCol: startCol,
      endCol: rowArray.length - 1
    });
    return runs;
  }

  function formatRowInstruction(rowArray) {
    const runs = encodeRowRuns(rowArray);
    return runs.map(function (r) {
      return (r.type === 'under' ? '▼' : '▲') + r.count;
    }).join(' ');
  }

  /**
   * Apply a primitive matrix onto a target grid centered at (centerR, centerC),
   * respecting the active symmetry mode ('none' | 'h' | 'v' | '4q' | 'tile').
   */
  function applyPrimitiveWithSymmetry(grid, primitiveMatrix, centerR, centerC, symmetryMode, invertValue, tilePeriod) {
    const R = grid.length;
    const C = grid[0].length;
    const next = cloneGrid(grid);
    const pR = primitiveMatrix.length;
    const pC = primitiveMatrix[0].length;
    const halfPR = Math.floor(pR / 2);
    const halfPC = Math.floor(pC / 2);

    function setCellWithSymmetry(r, c, val) {
      const targets = [[r, c]];
      if (symmetryMode === 'h' || symmetryMode === '4q') {
        targets.push([r, C - 1 - c]);
      }
      if (symmetryMode === 'v' || symmetryMode === '4q') {
        targets.push([R - 1 - r, c]);
      }
      if (symmetryMode === '4q') {
        targets.push([R - 1 - r, C - 1 - c]);
      }
      if (symmetryMode === 'tile') {
        const tr = (tilePeriod && tilePeriod[0]) ? tilePeriod[0] : 4;
        const tc = (tilePeriod && tilePeriod[1]) ? tilePeriod[1] : 8;
        const modR = ((r % tr) + tr) % tr;
        const modC = ((c % tc) + tc) % tc;
        for (let rr = 1; rr < R - 1; rr++) {
          if (rr % tr === modR) {
            for (let cc = 0; cc < C; cc++) {
              if (cc % tc === modC) {
                targets.push([rr, cc]);
              }
            }
          }
        }
      }
      for (let i = 0; i < targets.length; i++) {
        const tr = targets[i][0];
        const tc = targets[i][1];
        if (tr >= 0 && tr < R && tc >= 0 && tc < C) {
          next[tr][tc] = val;
        }
      }
    }

    for (let dr = 0; dr < pR; dr++) {
      for (let dc = 0; dc < pC; dc++) {
        const cell = primitiveMatrix[dr][dc];
        if (cell === null || typeof cell === 'undefined') continue;
        const r = centerR + (dr - halfPR);
        const c = centerC + (dc - halfPC);
        let finalVal = cell;
        if (pR === 1 && pC === 1 && typeof invertValue === 'number') {
          finalVal = invertValue;
        } else if (invertValue === true) {
          finalVal = cell === 1 ? 0 : 1;
        }
        setCellWithSymmetry(r, c, finalVal);
      }
    }

    return next;
  }

  /**
   * Compare user grid against a target pattern grid and return accuracy metrics
   */
  function computeGridMatch(userGrid, targetGrid) {
    if (!userGrid || !targetGrid || userGrid.length !== targetGrid.length) {
      return { matchingCells: 0, totalCells: 0, percentage: 0 };
    }
    const R = targetGrid.length;
    const C = targetGrid[0].length;
    let match = 0;
    const total = R * C;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (userGrid[r][c] === targetGrid[r][c]) match++;
      }
    }
    return {
      matchingCells: match,
      totalCells: total,
      percentage: Math.round((match / total) * 100)
    };
  }

  /**
   * Unroll / expand a base weaving grid onto a larger tapestry surface.
   * Modes:
   *   - 'seamless': Strips internal selvedge borders and joins tiles with continuous twill phase
   *                 (or exact translational period for lattice patterns like Weri Nahpy & Dja).
   *   - 'mirror':   Dihedral 4-way mirror reflection across tile seams (Kinja kaleidoscope).
   *   - 'concentric': Propagates the pattern's core medallion and stepped diagonal diamond waves
   *                   outward across a giant unified frame.
   *   - 'framed':   Stacks full framed panels with traditional selvedge borders between registers.
   */
  function generateExpandedGrid(baseGrid, options) {
    const opts = options || {};
    const repeatsX = Math.max(1, Math.min(8, parseInt(opts.repeatsX, 10) || 3));
    const repeatsY = Math.max(1, Math.min(6, parseInt(opts.repeatsY, 10) || 2));
    const mode = opts.unrollMode || 'seamless';
    const tilePeriod = opts.tilePeriod || null;
    const patternId = opts.patternId || '';

    const R = baseGrid.length;
    const C = baseGrid[0].length;

    if (repeatsX === 1 && repeatsY === 1) {
      return {
        grid: cloneGrid(baseGrid),
        rows: R,
        cols: C,
        tileBounds: [{ tx: 0, ty: 0, r0: 0, c0: 0, r1: R - 1, c1: C - 1 }]
      };
    }

    if (mode === 'framed') {
      const outR = R * repeatsY - (repeatsY - 1);
      const outC = C * repeatsX - (repeatsX - 1);
      const out = createGrid(outR, outC, 0);
      const bounds = [];
      for (let ty = 0; ty < repeatsY; ty++) {
        for (let tx = 0; tx < repeatsX; tx++) {
          const rOffset = ty * (R - 1);
          const cOffset = tx * (C - 1);
          bounds.push({ tx: tx, ty: ty, r0: rOffset, c0: cOffset, r1: rOffset + R - 1, c1: cOffset + C - 1 });
          for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
              out[rOffset + r][cOffset + c] = baseGrid[r][c];
            }
          }
        }
      }
      return { grid: out, rows: outR, cols: outC, tileBounds: bounds };
    }

    if (mode === 'concentric') {
      // Grow a giant unified frame and propagate the pattern's core medallion and stepped waves outward
      const strideR = R - 1;
      const strideC = C - 1;
      const outR = strideR * repeatsY + 1;
      const outC = strideC * repeatsX + 1;
      const out = createGrid(outR, outC, 0);
      fillRow(out, 0, 1);
      fillRow(out, outR - 1, 1);

      const midR = Math.floor(outR / 2);
      const midC = Math.floor(outC / 2);
      const baseMidR = Math.floor(R / 2);
      const baseMidC = Math.floor(C / 2);

      for (let r = 1; r < outR - 1; r++) {
        for (let c = 0; c < outC; c++) {
          const dr = r - midR;
          const dc = c - midC;
          if (Math.abs(dr) <= baseMidR - 1 && Math.abs(dc) <= baseMidC) {
            out[r][c] = baseGrid[baseMidR + dr][baseMidC + dc];
          } else if (r % 2 === 0) {
            const phase = (r % 4 === 2) ? 0 : 2;
            out[r][c] = ((c + phase) % 4 !== 0) ? 1 : 0;
          } else {
            const ringDist = Math.abs(dr) + Math.abs(dc);
            const isOddCol = (c % 2 === 1);
            out[r][c] = (isOddCol && (ringDist % 4 === 1 || ringDist % 4 === 2)) ? 1 : 0;
          }
        }
      }
      return {
        grid: out,
        rows: outR,
        cols: outC,
        tileBounds: [{
          tx: 0,
          ty: 0,
          r0: midR - baseMidR,
          c0: midC - baseMidC,
          r1: midR + baseMidR,
          c1: midC + baseMidC
        }]
      };
    }

    if (mode === 'mirror') {
      // Dihedral mirror unrolling: each interior tile (1..R-2, 0..C-1) reflects at seams
      const bodyR = R - 2;
      const strideR = bodyR + 1; // +1 for the shared even twill seam row between vertical tiles
      const strideC = C - 1;
      const outR = strideR * repeatsY + 1;
      const outC = strideC * repeatsX + 1;
      const out = createGrid(outR, outC, 0);
      fillRow(out, 0, 1);
      fillRow(out, outR - 1, 1);

      const bounds = [];
      for (let ty = 0; ty < repeatsY; ty++) {
        const rStart = ty * strideR;
        if (ty > 0) {
          for (let tx = 0; tx < repeatsX; tx++) {
            const cStart = tx * strideC;
            for (let c = 0; c < C; c++) {
              const srcC = (tx % 2 === 1) ? (C - 1 - c) : c;
              out[rStart][cStart + c] = baseGrid[2][srcC];
            }
          }
        }
        for (let tx = 0; tx < repeatsX; tx++) {
          const cStart = tx * strideC;
          bounds.push({ tx: tx, ty: ty, r0: rStart, c0: cStart, r1: rStart + strideR, c1: cStart + strideC });
          for (let br = 1; br <= bodyR; br++) {
            const srcR = (ty % 2 === 1) ? (R - 1 - br) : br;
            for (let c = 0; c < C; c++) {
              const srcC = (tx % 2 === 1) ? (C - 1 - c) : c;
              out[rStart + br][cStart + c] = baseGrid[srcR][srcC];
            }
          }
        }
      }
      return { grid: out, rows: outR, cols: outC, tileBounds: bounds };
    }

    // Default: 'seamless' continuous unrolling
    if (tilePeriod && tilePeriod.length === 2 && (patternId === 'weri-nahpy' || patternId === 'dja')) {
      const pR = tilePeriod[0];
      const pC = tilePeriod[1];
      const baseInteriorR = R - 2;
      const baseInteriorC = C - 1;
      const outR = baseInteriorR * repeatsY + 2;
      const outC = baseInteriorC * repeatsX + 1;
      const out = createGrid(outR, outC, 0);
      fillRow(out, 0, 1);
      fillRow(out, outR - 1, 1);

      for (let r = 1; r < outR - 1; r++) {
        const srcR = 1 + ((r - 1) % pR);
        for (let c = 0; c < outC; c++) {
          const srcC = c % pC;
          out[r][c] = baseGrid[srcR][srcC];
        }
      }
      const bounds = [];
      for (let ty = 0; ty < repeatsY; ty++) {
        for (let tx = 0; tx < repeatsX; tx++) {
          bounds.push({
            tx: tx,
            ty: ty,
            r0: ty * baseInteriorR,
            c0: tx * baseInteriorC,
            r1: (ty + 1) * baseInteriorR + 1,
            c1: (tx + 1) * baseInteriorC
          });
        }
      }
      return { grid: out, rows: outR, cols: outC, tileBounds: bounds };
    }

    // Seamless medallion unrolling: internal borders become twill bridge rows
    const strideR = R - 1;
    const strideC = C - 1;
    const outR = strideR * repeatsY + 1;
    const outC = strideC * repeatsX + 1;
    const out = createGrid(outR, outC, 0);
    fillRow(out, 0, 1);
    fillRow(out, outR - 1, 1);

    const bounds = [];
    for (let ty = 0; ty < repeatsY; ty++) {
      const rStart = ty * strideR;
      for (let tx = 0; tx < repeatsX; tx++) {
        const cStart = tx * strideC;
        bounds.push({ tx: tx, ty: ty, r0: rStart, c0: cStart, r1: rStart + strideR, c1: cStart + strideC });

        // Seam row between vertical tiles uses row 2 twill instead of solid black border
        if (ty > 0) {
          for (let c = 0; c < C; c++) {
            out[rStart][cStart + c] = baseGrid[2][c];
          }
        }
        // Interior rows 1..R-2
        for (let r = 1; r < R - 1; r++) {
          for (let c = 0; c < C; c++) {
            out[rStart + r][cStart + c] = baseGrid[r][c];
          }
        }
      }
    }
    return { grid: out, rows: outR, cols: outC, tileBounds: bounds };
  }

  const DIFF_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

  /**
   * Encode cell-level differences between a baseGrid and currentGrid into a compact
   * URL-safe diff patch string (pairs of base64url chars per flipped cell index).
   */
  function encodeGridDiff(baseGrid, currentGrid) {
    if (!baseGrid || !currentGrid || baseGrid.length !== currentGrid.length) return '';
    const R = baseGrid.length;
    const C = baseGrid[0].length;
    let patch = '';
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if ((baseGrid[r][c] ? 1 : 0) !== (currentGrid[r][c] ? 1 : 0)) {
          const idx = r * C + c;
          if (idx >= 0 && idx < 4096) {
            const hi = (idx >> 6) & 63;
            const lo = idx & 63;
            patch += DIFF_ALPHABET.charAt(hi) + DIFF_ALPHABET.charAt(lo);
          }
        }
      }
    }
    return patch;
  }

  /**
   * Apply a compact URL diff patch string onto a cloned copy of baseGrid.
   * Also supports comma-separated "r.c" coordinates as a human-readable fallback.
   */
  function applyGridDiff(baseGrid, patchStr) {
    const out = cloneGrid(baseGrid);
    if (!patchStr || typeof patchStr !== 'string') return out;
    const R = out.length;
    const C = out[0].length;
    const total = R * C;

    if (patchStr.indexOf('.') !== -1) {
      const parts = patchStr.split(',');
      for (let i = 0; i < parts.length; i++) {
        const rc = parts[i].split('.');
        if (rc.length === 2) {
          const r = parseInt(rc[0], 10);
          const c = parseInt(rc[1], 10);
          if (!isNaN(r) && !isNaN(c) && r >= 0 && r < R && c >= 0 && c < C) {
            out[r][c] = out[r][c] === 1 ? 0 : 1;
          }
        }
      }
      return out;
    }

    for (let i = 0; i + 1 < patchStr.length; i += 2) {
      const hi = DIFF_ALPHABET.indexOf(patchStr.charAt(i));
      const lo = DIFF_ALPHABET.indexOf(patchStr.charAt(i + 1));
      if (hi === -1 || lo === -1) continue;
      const idx = (hi << 6) | lo;
      if (idx >= 0 && idx < total) {
        const r = Math.floor(idx / C);
        const c = idx % C;
        out[r][c] = out[r][c] === 1 ? 0 : 1;
      }
    }
    return out;
  }

  const CATALOG = buildCatalog();

  return {
    CATALOG: CATALOG,
    PRIMITIVES: PRIMITIVES,
    createGrid: createGrid,
    cloneGrid: cloneGrid,
    applyTwillRow: applyTwillRow,
    mirrorVertical: mirrorVertical,
    mirrorHorizontal: mirrorHorizontal,
    encodeRowRuns: encodeRowRuns,
    formatRowInstruction: formatRowInstruction,
    applyPrimitiveWithSymmetry: applyPrimitiveWithSymmetry,
    computeGridMatch: computeGridMatch,
    generateExpandedGrid: generateExpandedGrid,
    encodeGridDiff: encodeGridDiff,
    applyGridDiff: applyGridDiff
  };
});
