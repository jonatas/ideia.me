/**
 * Lote Botanical & Agroforestry Manager (/lote)
 *
 * Zero-backend, offline-capable inventory, category organizer, proportional
 * horizontal lot map (rotated +103.4132 deg so Limite Oeste is parallel to top
 * horizontal, calibrated to the 6m Geodesic Dome = 60px -> 10px/m), smart angular
 * label de-overlapping, and 4-line botanical plaque generator.
 * Compatible with both browser (window.LoteManager) and Node.js testing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LoteManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY_PLANTS = 'ideiame_lote_plantas_v6';

  var ROTATION_DEG = 103.4132;
  var ROTATION_RAD = (ROTATION_DEG * Math.PI) / 180;
  var PIVOT_S_PX = { x: 283, y: 1178 };
  var ORIGIN_ROTATED_PX = { x: 60, y: 60 };

  /**
   * Transform unrotated image pixel (x, y) into rotated horizontal map pixel (rx, ry)
   * where Limite Oeste runs horizontally along the top (y = 60).
   */
  function rotateImagePx(x, y) {
    var dx = Number(x) - PIVOT_S_PX.x;
    var dy = Number(y) - PIVOT_S_PX.y;
    var cosA = Math.cos(ROTATION_RAD);
    var sinA = Math.sin(ROTATION_RAD);
    var rx = ORIGIN_ROTATED_PX.x + (dx * cosA - dy * sinA);
    var ry = ORIGIN_ROTATED_PX.y + (dx * sinA + dy * cosA);
    return {
      x: Math.round(rx * 10) / 10,
      y: Math.round(ry * 10) / 10
    };
  }

  /**
   * Calibrated proportions of the Home Land Triangle in the rotated horizontal view
   * (Limite Oeste parallel to the top horizontal, Divisa Jair on the right).
   * Reference: Geodesic Dome has 6.0m diameter = 60px -> 10.0 px = 1.0 m.
   */
  var LOTE_GEOMETRY = {
    scalePxPerMeter: 10.0,
    rotationDeg: ROTATION_DEG,
    viewBox: { minX: -30, minY: -30, width: 1280, height: 680 },
    domeReference: {
      cx: 1001.5,
      cy: 188.5,
      r: 29.8,
      diameterMeters: 6.0,
      areaSqMeters: 28.3
    },
    triangleVerticesPx: [
      { id: 'S', label: 'Vértice Oeste (Encontro das Linhas Azuis)', x: 60, y: 60 },
      { id: 'NW', label: 'Vértice Superior Direito (Divisa Jair / Limite Oeste)', x: 1086, y: 60 },
      { id: 'NE', label: 'Vértice Inferior Direito (Divisa Jair / Estrada)', x: 1127.9, y: 548 }
    ],
    surveyPolygonPx: [
      [1086, 60],
      [1127.9, 548],
      [846.5, 365.8],
      [742.6, 310.2],
      [450.4, 164.4],
      [192.7, 81.4],
      [60, 60],
      [227.1, 40.2],
      [359.5, 36.9],
      [539.5, 32.5],
      [613, 34.6],
      [865.8, 43.5],
      [1048.1, 55.1]
    ],
    boundaryMetrics: {
      divisaJairMeters: 49.1,
      northBlackLineMeters: 49.1,
      westBlueLineMeters: 102.6,
      eastBlueLineMeters: 117.4,
      perimeterMeters: 269.1,
      areaSqMeters: 2509
    },
    structures: [
      {
        id: 'dome',
        name: 'Domo • Estufa (Ref. Ø 6m)',
        shortName: 'Domo (Estufa 6m)',
        type: 'circle',
        cx: 1001.5,
        cy: 188.5,
        r: 29.8,
        labelX: 1001.5,
        labelY: 154.5,
        dimensionsMeters: 'Ø 6,0 m',
        areaSqMeters: 28.3,
        description: 'Estufa Geodésica (Greenhouse) de Ø 6,0 m c/ portal oeste — referência oficial de escala do mapa (60 px = 6,0 m)',
        color: '#22c55e'
      },
      {
        id: 'wip-pond',
        name: 'Lago / Tanque (WIP Pond)',
        shortName: 'Lago (WIP)',
        type: 'polygon',
        points: '952.0,58.0 1014.0,62.0 1010.0,142.0 948.0,138.0',
        labelX: 981.0,
        labelY: 101.0,
        dimensionsMeters: '5,4 m × 6,8 m',
        areaSqMeters: 36.7,
        description: 'Lago / Tanque em construção (WIP Pond) entre o Limite Oeste, a Casa A-Frame, o Domo e a Estrutura de Bambu',
        color: '#38bdf8'
      },
      {
        id: 'bamboo-structure',
        name: 'Estrutura de Bambu & Redes (Bamboo Web)',
        shortName: 'Bambu & Redes',
        type: 'polygon',
        points: '1018.0,50.0 1084.0,54.0 1082.0,150.0 1015.0,146.0',
        labelX: 1050.0,
        labelY: 100.0,
        dimensionsMeters: '4,5 m × 8,6 m',
        areaSqMeters: 38.7,
        url: '/bamboo-web-structure-project',
        description: 'Estrutura de Bambu & Redes (~600 ripas de 9m e ~280 arcos construídos c/ Edegar) • Clique p/ abrir o artigo do projeto',
        color: '#84cc16'
      },
      {
        id: 'main-house',
        name: 'Casa (2 A-Frames Unidos: 6×6m + 7×6m)',
        shortName: 'Casa',
        type: 'polygon',
        points: '882.5,154.0 965.5,161.5 959.0,239.5 953.5,239.0 948.5,301.0 877.5,294.5 881.5,232.5 876.0,232.0',
        aFrame7x6Points: '882.5,154.0 965.5,161.5 959.0,239.5 876.0,232.0',
        aFrame6x6Points: '881.5,232.5 953.5,239.0 948.5,301.0 877.5,294.5',
        ridgeLine: '924.0,157.8 913.0,297.8',
        solarPoints: '917.8,250.2 950.2,253.0 946.2,300.2 913.8,297.4',
        solarUpperPoints: '945.2,204.0 961.0,205.4 958.4,238.4 942.6,237.0',
        labelX: 918.5,
        labelY: 227.5,
        dimensionsMeters: '13,0 m × 6,0–7,0 m (6×6m c/ 10 Painéis + 7×6m c/ 3 Painéis)',
        areaSqMeters: 84.0,
        description: '2 A-Frames alinhados pela cumeeira central: 6×6m frontal c/ matriz 2×5 de 10 painéis solares + extensão 7×6m c/ 2 mansardas e 3 painéis solares',
        color: '#10b981'
      },
      {
        id: 'stone-paths',
        name: 'Caminhos de Pedra & Pátios (Casa, Garagem, Casinha e Domo)',
        shortName: 'Caminhos de Pedra',
        type: 'path',
        labelX: 960.0,
        labelY: 300.0,
        dimensionsMeters: 'Caminho Reto e Curvo da Casinha, Bifurcação em Y do Domo e Acesso à Garagem',
        areaSqMeters: 112.0,
        description: 'Caminhos de pedra basalto c/ meio-fio branco calibrados na ortofoto: ligação reta e curva c/ a Casinha, corredor e bifurcação em Y ao sul do Domo, e integração c/ a Garagem',
        color: '#d97706'
      },
      {
        id: 'stone-island-stairs',
        name: 'Ilha de Pedras & Escada (Transição Casa / Domo / Garagem)',
        shortName: 'Ilha & Escada',
        type: 'polygon',
        points: '938,332 976,335 974,355 936,351',
        labelX: 954.0,
        labelY: 345.0,
        dimensionsMeters: '3,8 m × 2,2 m (c/ Escada de Pedra)',
        areaSqMeters: 8.4,
        description: 'Ilha de Pedras e degraus integrados na confluência entre o terraço frontal da Casa, o caminho em Y do Domo e a entrada da Garagem',
        color: '#f59e0b'
      },
      {
        id: 'garage',
        name: 'Garagem & Pátio de Acesso (até a Divisa Jair)',
        shortName: 'Garagem',
        type: 'polygon',
        points: '938,352 978,356 1114,388 1119,448 972,418 934,410',
        labelX: 1024.0,
        labelY: 398.0,
        dimensionsMeters: '~18,5 m × 5,8 m (até a Divisa Jair)',
        areaSqMeters: 96.0,
        description: 'Garagem e pátio de manobra/acesso perfeitamente alinhados à ortofoto e ao muro de contenção inferior até a Divisa Jair',
        color: '#38bdf8'
      },
      {
        id: 'wall-slice-triangle',
        name: 'Muro de Contenção em Pedra & Talude Sul (Canteiro da Estrada)',
        shortName: 'Muro & Talude Sul',
        type: 'polygon',
        points: '934,410 972,418 1119,448 1127.9,548 936,428',
        labelX: 1030.0,
        labelY: 465.0,
        dimensionsMeters: 'Muro ~18,8 m • Fatia Triangular c/ Frutíferas entre a Garagem e a Estrada',
        areaSqMeters: 85.0,
        description: 'Muro de contenção em blocos de pedra na borda sul da Garagem e talude triangular arborizado até o vértice da Estrada Municipal',
        color: '#84cc16'
      },
      {
        id: 'casinha',
        name: 'Casinha',
        shortName: 'Casinha',
        type: 'polygon',
        points: '841.5,67.5 836.5,131.5 753.0,126.0 757.5,62.0',
        labelX: 797.0,
        labelY: 98.0,
        dimensionsMeters: '6,4 m × 7,9 m',
        areaSqMeters: 50.6,
        description: 'Casinha conectada pelo caminho reto diagonal ao canto norte da Casa 7×6m, pelo caminho curvo oeste ao terraço 6×6m e à Área do Fogo',
        color: '#f59e0b'
      },
      {
        id: 'patio-circle',
        name: 'Área do Fogo & Fogueira (Meia-Lua)',
        shortName: 'Área do Fogo',
        type: 'path',
        cx: 699.5,
        cy: 135.5,
        r: 24,
        labelX: 700.0,
        labelY: 135.5,
        dimensionsMeters: 'Meia-lua ~8,2 m × 4,1 m (Fogueira Ø 1,1 m)',
        areaSqMeters: 26.5,
        description: 'Área do Fogo em meia-lua com mureta curva de pedra entre a Casinha e o Ateliê, com a Fogueira circular e cadeiras ao centro',
        color: '#f97316'
      },
      {
        id: 'atelie',
        name: 'Ateliê',
        shortName: 'Ateliê',
        type: 'polygon',
        points: '622.0,55.0 692.0,91.0 653.0,163.0 585.0,127.0 598.0,104.0 563.0,73.0 568.0,61.0',
        labelX: 636.0,
        labelY: 112.0,
        dimensionsMeters: '8,6 m × 8,2 m (+ Ala Noroeste)',
        areaSqMeters: 70.5,
        color: '#a855f7'
      },
      {
        id: 'deposito-madeira',
        name: 'Depósito',
        shortName: 'Depósito',
        type: 'polygon',
        points: '538.5,139.5 520.0,189.5 435.0,159.5 453.5,110.5',
        overhangPoints: '547.5,108.5 538.5,139.5 453.5,110.5 462.5,80.0',
        labelX: 486.8,
        labelY: 150.0,
        dimensionsMeters: '6,0 m × 10,2 m (+2,9 m aba)',
        areaSqMeters: 61.2,
        color: '#f97316'
      }
    ]
  };

  function pxToMeters(px) {
    return Math.round((Number(px) / LOTE_GEOMETRY.scalePxPerMeter) * 10) / 10;
  }

  function metersToPx(m) {
    return Math.round(Number(m) * LOTE_GEOMETRY.scalePxPerMeter * 10) / 10;
  }

  /**
   * Detect if a coordinate pair (mx, my) in meters was saved in the unrotated portrait system
   */
  function isUnrotatedPortraitCoord(mx, my) {
    var nx = Number(mx);
    var ny = Number(my);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return false;
    // In the unrotated 56m x 121m portrait map, all x were <= 52m and either lay below the road line
    // or in the upper portrait strip (x <= 46, y <= 20) where the horizontal triangle is narrower.
    var roadY = 6.0 + 0.457 * (nx - 6.0);
    if (nx <= 52 && ny > roadY + 1.5) return true;
    return false;
  }

  /**
   * Convert a legacy portrait-mode meter coordinate (from v3/v4/v5 storage) into the rotated horizontal system
   */
  function rotateLegacyPointMeters(mx, my) {
    var oldPxX = metersToPx(mx);
    var oldPxY = metersToPx(my);
    var rotated = rotateImagePx(oldPxX, oldPxY);
    return {
      mapa_x: String(pxToMeters(rotated.x)),
      mapa_y: String(pxToMeters(rotated.y))
    };
  }

  /**
   * Parse all map pins for a plant. Supports single "88.5" or multi-pin "88.5;90.1" coordinates.
   * Returns Array<{ index: number, x: number, y: number }>
   */
  function parsePlantPins(p) {
    if (!p || p.mapa_x === null || p.mapa_x === undefined || p.mapa_y === null || p.mapa_y === undefined) {
      return [];
    }
    var sx = String(p.mapa_x).trim();
    var sy = String(p.mapa_y).trim();
    if (!sx || !sy || sx === 'null' || sy === 'null') return [];

    var xParts = sx.split(';');
    var yParts = sy.split(';');
    var count = Math.min(xParts.length, yParts.length);
    var pins = [];
    for (var i = 0; i < count; i++) {
      var nx = Number(xParts[i].trim());
      var ny = Number(yParts[i].trim());
      if (Number.isFinite(nx) && Number.isFinite(ny)) {
        pins.push({
          index: pins.length,
          x: Math.round(nx * 10) / 10,
          y: Math.round(ny * 10) / 10
        });
      }
    }
    return pins;
  }

  /**
   * Save an array of {x, y} pins back into plant.mapa_x and plant.mapa_y (semicolon-separated)
   * and automatically update plant.quantidade when more pins are added.
   */
  function setPlantPins(p, pinsArray, updateQuantityOnChange) {
    if (!p) return;
    var valid = Array.isArray(pinsArray) ? pinsArray : [];
    if (valid.length === 0) {
      p.mapa_x = '';
      p.mapa_y = '';
      return;
    }
    p.mapa_x = valid.map(function (pt) { return String(Math.round(Number(pt.x) * 10) / 10); }).join(';');
    p.mapa_y = valid.map(function (pt) { return String(Math.round(Number(pt.y) * 10) / 10); }).join(';');

    var currentQty = parseNumericQuantity(p.quantidade);
    if (valid.length > currentQty) {
      p.quantidade = String(valid.length);
    } else if (updateQuantityOnChange && currentQty > 1 && valid.length >= 1) {
      p.quantidade = String(valid.length);
    }
  }

  /**
   * Check whether a plant record has at least one valid numeric map coordinate
   */
  function hasValidCoords(p) {
    return parsePlantPins(p).length > 0;
  }

  /**
   * Compute an SVG transform string that normalizes a lot element label (single or multi-line)
   * by inverse zoom scale around its anchor pivot (px, py), preserving optional base rotation.
   */
  function computeElementLabelTransform(px, py, zoomScale, rotateDeg) {
    var x = Number(px) || 0;
    var y = Number(py) || 0;
    var z = Math.max(1, Number(zoomScale) || 1);
    var rot = Number(rotateDeg) || 0;
    if (Math.abs(z - 1) < 0.001) {
      return rot !== 0 ? 'rotate(' + rot + ', ' + x + ', ' + y + ')' : '';
    }
    var invZ = Math.round((1 / z) * 1000) / 1000;
    var rotPart = rot !== 0 ? ' rotate(' + rot + ')' : '';
    return 'translate(' + x + ', ' + y + ')' + rotPart + ' scale(' + invZ + ') translate(' + (-x) + ', ' + (-y) + ')';
  }

  /**
   * Smart angular label placement & rotation solver for close pins.
   * Prevents overlapping labels by rotating and fanning labels around crowded pins.
   * Supports zoomScale so offsets and collision thresholds stay constant in screen space.
   */
  function computePinLabelPlacements(items, zoomScale) {
    if (!Array.isArray(items) || items.length === 0) return {};
    var z = Math.max(1, Number(zoomScale) || 1);
    var invZ = 1 / z;

    var CANDIDATES = [
      { dirDeg: 0, rotDeg: 0, anchor: 'start', dist: 8.5 },
      { dirDeg: -32, rotDeg: -32, anchor: 'start', dist: 9.5 },
      { dirDeg: 32, rotDeg: 32, anchor: 'start', dist: 9.5 },
      { dirDeg: 180, rotDeg: 0, anchor: 'end', dist: 8.5 },
      { dirDeg: -58, rotDeg: -58, anchor: 'start', dist: 10 },
      { dirDeg: 58, rotDeg: 58, anchor: 'start', dist: 10 },
      { dirDeg: -148, rotDeg: 32, anchor: 'end', dist: 9.5 },
      { dirDeg: 148, rotDeg: -32, anchor: 'end', dist: 9.5 },
      { dirDeg: -82, rotDeg: -82, anchor: 'start', dist: 10 },
      { dirDeg: 82, rotDeg: 82, anchor: 'start', dist: 10 }
    ];

    var sorted = items.slice().sort(function (a, b) {
      if (Math.abs(a.cy - b.cy) > 2 * invZ) return a.cy - b.cy;
      return a.cx - b.cx;
    });

    var hasCloseNeighbor = {};
    for (var i = 0; i < sorted.length; i++) {
      for (var j = i + 1; j < sorted.length; j++) {
        var dx = sorted[i].cx - sorted[j].cx;
        var dy = sorted[i].cy - sorted[j].cy;
        if (Math.hypot(dx, dy) < 36 * invZ) {
          hasCloseNeighbor[sorted[i].id] = true;
          hasCloseNeighbor[sorted[j].id] = true;
        }
      }
    }

    function buildLabelSamples(item, cand) {
      var rad = (cand.dirDeg * Math.PI) / 180;
      var localLx = Math.cos(rad) * cand.dist;
      var localLy = Math.sin(rad) * cand.dist;
      var lx = item.cx + localLx * invZ;
      var ly = item.cy + localLy * invZ;
      var textLen = Math.max(30, Math.min(115, ((item.text || '').length) * 4.6)) * invZ;
      var textRad = (cand.rotDeg * Math.PI) / 180;
      var sign = cand.anchor === 'end' ? -1 : 1;
      var ux = Math.cos(textRad) * sign;
      var uy = Math.sin(textRad) * sign;

      var samples = [];
      var fractions = [0.1, 0.38, 0.68, 0.96];
      for (var f = 0; f < fractions.length; f++) {
        var d = textLen * fractions[f];
        samples.push({
          x: lx + ux * d,
          y: ly + uy * d
        });
      }
      return {
        localLx: localLx,
        localLy: localLy,
        localLineX2: Math.cos(rad) * (cand.dist - 2),
        localLineY2: Math.sin(rad) * (cand.dist - 2),
        lx: lx,
        ly: ly,
        lineX2: item.cx + Math.cos(rad) * (cand.dist - 2) * invZ,
        lineY2: item.cy + Math.sin(rad) * (cand.dist - 2) * invZ,
        samples: samples
      };
    }

    var placedSamples = [];
    var placements = {};

    for (var idx = 0; idx < sorted.length; idx++) {
      var item = sorted[idx];
      var crowded = Boolean(hasCloseNeighbor[item.id]);

      var order = crowded
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
        : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      var bestCand = CANDIDATES[order[0]];
      var bestGeom = buildLabelSamples(item, bestCand);
      var bestPenalty = Infinity;

      for (var c = 0; c < order.length; c++) {
        var cand = CANDIDATES[order[c]];
        var geom = buildLabelSamples(item, cand);
        var penalty = c * 1.5;

        for (var p = 0; p < sorted.length; p++) {
          if (sorted[p].id === item.id) continue;
          for (var s = 0; s < geom.samples.length; s++) {
            var distPin = Math.hypot(geom.samples[s].x - sorted[p].cx, geom.samples[s].y - sorted[p].cy);
            if (distPin < 11 * invZ) {
              penalty += (11 * invZ - distPin) * 25 * z;
            }
          }
        }

        for (var pl = 0; pl < placedSamples.length; pl++) {
          var otherSamples = placedSamples[pl];
          for (var s1 = 0; s1 < geom.samples.length; s1++) {
            for (var s2 = 0; s2 < otherSamples.length; s2++) {
              var dxL = Math.abs(geom.samples[s1].x - otherSamples[s2].x);
              var dyL = Math.abs(geom.samples[s1].y - otherSamples[s2].y);
              if (dxL < 18 * invZ && dyL < 10 * invZ) {
                penalty += (18 * invZ - dxL) * (10 * invZ - dyL) * 4 * z * z;
              }
            }
          }
        }

        for (var sb = 0; sb < geom.samples.length; sb++) {
          if (geom.samples[sb].x < 10 || geom.samples[sb].x > 1180 || geom.samples[sb].y < 10 || geom.samples[sb].y > 590) {
            penalty += 150;
          }
        }

        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestCand = cand;
          bestGeom = geom;
          if (penalty < 2) break;
        }
      }

      placedSamples.push(bestGeom.samples);
      placements[item.id] = {
        angleDeg: bestCand.rotDeg,
        anchor: bestCand.anchor,
        localLabelX: Math.round(bestGeom.localLx * 10) / 10,
        localLabelY: Math.round(bestGeom.localLy * 10) / 10,
        localLineX2: Math.round(bestGeom.localLineX2 * 10) / 10,
        localLineY2: Math.round(bestGeom.localLineY2 * 10) / 10,
        labelX: Math.round(bestGeom.lx * 10) / 10,
        labelY: Math.round(bestGeom.ly * 10) / 10,
        lineX2: Math.round(bestGeom.lineX2 * 10) / 10,
        lineY2: Math.round(bestGeom.lineY2 * 10) / 10,
        isRotated: bestCand.rotDeg !== 0 || bestCand.anchor === 'end'
      };
    }

    return placements;
  }

  /**
   * Parse RFC-4180 compatible CSV string into array of objects
   */
  function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];
    var lines = [];
    var currentRow = [];
    var currentField = '';
    var inQuotes = false;

    for (var i = 0; i < csvText.length; i++) {
      var ch = csvText[i];
      var nextCh = csvText[i + 1];

      if (inQuotes) {
        if (ch === '"' && nextCh === '"') {
          currentField += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentField += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (ch === '\r' && nextCh === '\n') {
          currentRow.push(currentField);
          lines.push(currentRow);
          currentRow = [];
          currentField = '';
          i++;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentField);
          lines.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += ch;
        }
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      lines.push(currentRow);
    }

    if (lines.length < 2) return [];
    var headers = lines[0].map(function (h) { return h.trim(); });
    var result = [];

    for (var r = 1; r < lines.length; r++) {
      var row = lines[r];
      if (row.length === 1 && row[0].trim() === '') continue;
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = row[c] !== undefined ? row[c].trim() : '';
      }
      result.push(obj);
    }
    return result;
  }

  /**
   * Serialize array of objects into CSV string
   */
  function toCSV(rows, columns) {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    var headers = columns || Object.keys(rows[0]);
    var escapeCell = function (val) {
      var str = val === null || val === undefined ? '' : String(val);
      if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    var out = [headers.join(',')];
    for (var i = 0; i < rows.length; i++) {
      var line = [];
      for (var j = 0; j < headers.length; j++) {
        line.push(escapeCell(rows[i][headers[j]]));
      }
      out.push(line.join(','));
    }
    return out.join('\n') + '\n';
  }

  /**
   * Parse numeric quantity from strings like "1", "3", "1+", "Sementes"
   */
  function parseNumericQuantity(qtdStr) {
    if (!qtdStr) return 1;
    var str = String(qtdStr).trim();
    var match = str.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Convert planting date string ("Set/2022", "Jan/2026", "Nov/2026") to sortable numeric YYYYMM
   */
  function plantingSortValue(plantioStr) {
    if (!plantioStr) return 0;
    var months = {
      jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
      jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
    };
    var clean = String(plantioStr).toLowerCase().trim();
    var m = clean.match(/([a-z]{3})\/(\d{4})/);
    if (!m) return 0;
    var mon = months[m[1]] || 0;
    var yr = parseInt(m[2], 10) || 0;
    return yr * 100 + mon;
  }

  /**
   * Format the 4-line identification plaque according to the standard:
   * Line 1: NOME POPULAR (uppercase)
   * Line 2: Nome Científico • Família
   * Line 3: Origem / Destaque (placa_linha_3 or origem)
   * Line 4: Plantio: <Mês/Ano>
   */
  function formatPlaqueLines(plant) {
    if (!plant) {
      return { line1: '', line2: '', line3: '', line4: '', scientific: '', family: '' };
    }
    var popular = (plant.nome_popular || '').trim();
    var scientific = (plant.nome_cientifico || '').trim();
    var family = (plant.familia || '').trim();
    var line3 = (plant.placa_linha_3 || plant.origem || '').trim();
    var plantio = (plant.plantio || '').trim();

    return {
      line1: popular.toUpperCase(),
      scientific: scientific,
      family: family,
      line2: scientific + ' • ' + family,
      line3: line3,
      line4: 'Plantio: ' + plantio
    };
  }

  /**
   * Compute statistics across all plants and categories
   */
  function computeLoteStats(plants, categories) {
    var list = Array.isArray(plants) ? plants : [];
    var cats = Array.isArray(categories) ? categories : [];

    var totalVarieties = list.length;
    var totalIndividuals = 0;
    var seedLots = 0;
    var familiesSet = {};
    var byCategory = {};
    var byYear = { '2022': 0, '2026': 0, outros: 0 };
    var pendingConfirmCount = 0;
    var pinnedCount = 0;

    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var n = parseNumericQuantity(p.quantidade);
      if (n > 0) {
        totalIndividuals += n;
      } else {
        seedLots += 1;
      }

      if (p.familia) {
        familiesSet[p.familia.trim()] = (familiesSet[p.familia.trim()] || 0) + 1;
      }

      var catId = p.categoria_id || 'sem-categoria';
      if (!byCategory[catId]) {
        byCategory[catId] = { varieties: 0, individuals: 0 };
      }
      byCategory[catId].varieties += 1;
      byCategory[catId].individuals += (n > 0 ? n : 1);

      var yr = String(p.ano_base || '').trim();
      if (yr === '2022') byYear['2022'] += 1;
      else if (yr === '2026') byYear['2026'] += 1;
      else byYear.outros += 1;

      if (p.status_cultivar && p.status_cultivar.indexOf('Sugestão') !== -1) {
        pendingConfirmCount += 1;
      }

      var pins = parsePlantPins(p);
      if (pins.length > 0) {
        pinnedCount += 1;
      }
    }

    return {
      totalVarieties: totalVarieties,
      totalIndividuals: totalIndividuals,
      seedLots: seedLots,
      totalFamilies: Object.keys(familiesSet).length,
      totalCategories: cats.length,
      familiesBreakdown: familiesSet,
      byCategory: byCategory,
      byYear: byYear,
      pendingConfirmCount: pendingConfirmCount,
      pinnedCount: pinnedCount
    };
  }

  /**
   * Filter plants with SQL-like predicate logic
   */
  function filterPlants(plants, filters) {
    if (!Array.isArray(plants)) return [];
    if (!filters) return plants.slice();

    var q = (filters.query || '').toLowerCase().trim();
    var cat = filters.categoria_id || 'all';
    var plantio = filters.plantio || 'all';
    var familia = filters.familia || 'all';
    var secao = filters.secao_lote || 'all';
    var status = filters.status_cultivar || 'all';

    return plants.filter(function (p) {
      if (cat !== 'all' && p.categoria_id !== cat) return false;
      if (familia !== 'all' && p.familia !== familia) return false;
      if (secao !== 'all' && p.secao_lote !== secao) return false;

      if (plantio !== 'all') {
        if (plantio === '2022' || plantio === '2026') {
          if (String(p.ano_base) !== plantio) return false;
        } else if ((p.plantio || '').indexOf(plantio) === -1) {
          return false;
        }
      }

      if (status !== 'all') {
        if (status === 'pendente' && (p.status_cultivar || '').indexOf('Sugestão') === -1) return false;
        if (status === 'confirmado' && (p.status_cultivar || '').indexOf('Sugestão') !== -1) return false;
      }

      if (q) {
        var haystack = [
          p.nome_popular,
          p.nota_variedade,
          p.nome_cientifico,
          p.familia,
          p.origem,
          p.placa_linha_3,
          p.plantio,
          p.secao_lote
        ].join(' ').toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }

      return true;
    });
  }

  return {
    STORAGE_KEY_PLANTS: STORAGE_KEY_PLANTS,
    LOTE_GEOMETRY: LOTE_GEOMETRY,
    rotateImagePx: rotateImagePx,
    isUnrotatedPortraitCoord: isUnrotatedPortraitCoord,
    rotateLegacyPointMeters: rotateLegacyPointMeters,
    pxToMeters: pxToMeters,
    metersToPx: metersToPx,
    parsePlantPins: parsePlantPins,
    setPlantPins: setPlantPins,
    hasValidCoords: hasValidCoords,
    computeElementLabelTransform: computeElementLabelTransform,
    computePinLabelPlacements: computePinLabelPlacements,
    parseCSV: parseCSV,
    toCSV: toCSV,
    parseNumericQuantity: parseNumericQuantity,
    plantingSortValue: plantingSortValue,
    formatPlaqueLines: formatPlaqueLines,
    computeLoteStats: computeLoteStats,
    filterPlants: filterPlants
  };
});
