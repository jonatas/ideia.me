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
    viewBox: { width: 1190, height: 600 },
    domeReference: {
      cx: 1001.1,
      cy: 191.9,
      r: 30,
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
        cx: 1001.1,
        cy: 191.9,
        r: 30,
        labelX: 1001.1,
        labelY: 156,
        dimensionsMeters: 'Ø 6,0 m',
        areaSqMeters: 28.3,
        description: 'Estufa Geodésica (Greenhouse) de Ø 6,0 m — referência oficial de escala do mapa (60 px = 6,0 m)',
        color: '#22c55e'
      },
      {
        id: 'wip-pond',
        name: 'Lago / Tanque (WIP Pond)',
        shortName: 'Lago (WIP)',
        type: 'polygon',
        points: '978.4,73.0 1032.8,73.0 1032.8,140.4 978.4,140.4',
        labelX: 1005.6,
        labelY: 106.7,
        dimensionsMeters: '5,4 m × 6,8 m',
        areaSqMeters: 36.7,
        description: 'Lago / Tanque em construção (WIP Pond) entre o caminho de pedra norte, o Domo (Estufa) e a Estrutura de Bambu',
        color: '#38bdf8'
      },
      {
        id: 'bamboo-structure',
        name: 'Estrutura de Bambu & Redes (Bamboo Web)',
        shortName: 'Bambu & Redes',
        type: 'polygon',
        points: '1038.3,55.5 1083.5,58.5 1083.5,141.2 1038.3,141.2',
        labelX: 1060.9,
        labelY: 98.5,
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
        points: '891.5,156.2 961.1,162.8 954.4,235.5 949.3,235.0 943.7,294.8 883.9,289.2 889.6,229.4 884.7,228.9',
        aFrame7x6Points: '891.5,156.2 961.1,162.8 954.4,235.5 884.7,228.9',
        aFrame6x6Points: '889.6,229.4 949.3,235.0 943.7,294.8 883.9,289.2',
        ridgeLine: '926.3,159.5 913.8,292.0',
        solarPoints: '920.8,234.8 947.4,237.3 942.4,291.8 915.8,289.3',
        solarUpperPoints: '938.2,205.5 954.2,207.0 951.8,232.5 935.8,231.0',
        labelX: 919.8,
        labelY: 227.2,
        dimensionsMeters: '13,0 m × 6,0–7,0 m (6×6m Solar + 7×6m)',
        areaSqMeters: 84.0,
        description: '2 A-Frames alinhados pela cumeeira central: 6×6m frontal c/ 10 painéis solares + extensão proporcional 7×6m c/ mansardas e 3 painéis',
        color: '#10b981'
      },
      {
        id: 'stone-paths',
        name: 'Caminhos de Pedra & Pátios (Casa, Garagem, Casinha e Domo)',
        shortName: 'Caminhos de Pedra',
        type: 'path',
        labelX: 884.0,
        labelY: 296.0,
        dimensionsMeters: 'Pátios, Curvas Frontais, Garagem e Rampa até a Rua',
        areaSqMeters: 112.0,
        description: 'Caminhos de pedra basalto c/ meio-fio branco unificados: curvas frontais da Casa, contorno da Ilha de Pedras, Garagem e acesso até a Rua',
        color: '#d97706'
      },
      {
        id: 'stone-island-stairs',
        name: 'Ilha de Pedras & Escada (Frente da Casa)',
        shortName: 'Ilha & Escada',
        type: 'polygon',
        points: '910,337 943,340 941,360 908,355',
        labelX: 925.5,
        labelY: 348.5,
        dimensionsMeters: '3,3 m × 2,2 m (c/ Escada de Pedra)',
        areaSqMeters: 7.3,
        description: 'Canteiro elevado em pedra (Ilha de Pedras) com degraus de pedra integrados entre o gramado frontal da Casa e o pátio da Garagem',
        color: '#f59e0b'
      },
      {
        id: 'garage',
        name: 'Garagem & Rampa de Pedra (até a Divisa Jair)',
        shortName: 'Garagem',
        type: 'polygon',
        points: '936,368 982,372 1118,466 1121.5,506 970,404 934,404',
        labelX: 968.0,
        labelY: 389.0,
        dimensionsMeters: '~19,5 m × 3,8 m (até a Divisa Jair)',
        areaSqMeters: 74.0,
        description: 'Garagem coberta por pergolado verde e acesso calçado em pedra estendendo-se no ângulo do Ingá-Banana até a Divisa Jair',
        color: '#38bdf8'
      },
      {
        id: 'wall-slice-triangle',
        name: 'Muro de Pedra & Triângulo do Muro (Canteiro da Rua)',
        shortName: 'Triângulo do Muro',
        type: 'polygon',
        points: '936,424 970,404 1121.5,506 1106,533',
        labelX: 1018.0,
        labelY: 462.0,
        dimensionsMeters: 'Muro ~18,2 m • Fatia Triangular c/ Frutíferas e Agaves',
        areaSqMeters: 45.0,
        description: 'Muro de contenção em blocos de pedra e fatia triangular elevada entre a Garagem/Rampa e a Estrada (Kinkan, Pêssegos e Agaves)',
        color: '#84cc16'
      },
      {
        id: 'casinha',
        name: 'Casinha',
        shortName: 'Casinha',
        type: 'polygon',
        points: '843.9,68.3 839.0,131.9 760.1,126.5 765.0,62.9',
        labelX: 802.0,
        labelY: 94,
        dimensionsMeters: '6,4 m × 7,9 m',
        areaSqMeters: 50.6,
        description: 'Casinha conectada pelos caminhos de pedra frontais e laterais aos pátios da Casa A-Frame e ao Pátio Circular',
        color: '#f59e0b'
      },
      {
        id: 'patio-circle',
        name: 'Área do Fogo & Fogueira (Meia-Lua)',
        shortName: 'Área do Fogo',
        type: 'path',
        cx: 701.5,
        cy: 135.5,
        r: 24,
        labelX: 705.0,
        labelY: 135.5,
        dimensionsMeters: 'Meia-lua ~8,2 m × 4,1 m (Fogueira Ø 1,1 m)',
        areaSqMeters: 26.5,
        description: 'Área do Fogo em formato de meia-lua ao lado do Ateliê com a Fogueira circular (em vermelho) no centro',
        color: '#f97316'
      },
      {
        id: 'atelie',
        name: 'Ateliê',
        shortName: 'Ateliê',
        type: 'polygon',
        points: '695,87.1 656.1,164.1 582.9,126.1 620.9,52.9',
        labelX: 638.5,
        labelY: 106,
        dimensionsMeters: '8,6 m × 8,2 m',
        areaSqMeters: 70.5,
        color: '#a855f7'
      },
      {
        id: 'deposito-madeira',
        name: 'Depósito',
        shortName: 'Depósito',
        type: 'polygon',
        points: '546.1,133.8 528.3,191.2 431,159.8 448.8,102.3',
        overhangPoints: '554.8,106 546.1,133.8 448.8,102.3 457.5,74.6',
        labelX: 488.6,
        labelY: 145,
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
