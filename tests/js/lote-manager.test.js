const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const LoteManager = require('../../assets/js/lote-manager.js');

const ROOT = path.resolve(__dirname, '../..');
const PLANTS_CSV_PATH = path.join(ROOT, '_data/lote_plantas.csv');
const CATEGORIES_CSV_PATH = path.join(ROOT, '_data/lote_categorias.csv');

test('CSV files exist and parse all 87 plant varieties and 10 categories', () => {
  const plantsRaw = fs.readFileSync(PLANTS_CSV_PATH, 'utf8');
  const categoriesRaw = fs.readFileSync(CATEGORIES_CSV_PATH, 'utf8');

  const plants = LoteManager.parseCSV(plantsRaw);
  const categories = LoteManager.parseCSV(categoriesRaw);

  assert.equal(plants.length, 87, 'Should contain all 87 plant entries across the 3 tables');
  assert.equal(categories.length, 10, 'Should contain 10 structured botanical/agronomic categories');

  const categoryIds = new Set(categories.map((c) => c.categoria_id));
  for (const plant of plants) {
    assert.ok(plant.id, 'Plant must have an id');
    assert.ok(plant.nome_popular, `Plant ${plant.id} must have nome_popular`);
    assert.ok(plant.nome_cientifico, `Plant ${plant.id} must have nome_cientifico`);
    assert.ok(plant.familia, `Plant ${plant.id} must have familia`);
    assert.ok(plant.plantio, `Plant ${plant.id} must have plantio`);
    assert.ok(
      categoryIds.has(plant.categoria_id),
      `Plant ${plant.id} has unknown categoria_id: ${plant.categoria_id}`
    );
  }
});

test('formatPlaqueLines formats 4-line identification plaques correctly', () => {
  const plantsRaw = fs.readFileSync(PLANTS_CSV_PATH, 'utf8');
  const plants = LoteManager.parseCSV(plantsRaw);
  const cereja = plants.find((p) => p.id === 'cereja-do-rio-grande');

  const plaque = LoteManager.formatPlaqueLines(cereja);
  assert.equal(plaque.line1, 'CEREJA-DO-RIO-GRANDE');
  assert.equal(plaque.line2, 'Eugenia involucrata • Myrtaceae');
  assert.equal(plaque.line3, 'Nativa do Sul do Brasil');
  assert.equal(plaque.line4, 'Plantio: Jan/2026 e Nov/2026');
});

test('computeLoteStats and filterPlants aggregate and filter accurately', () => {
  const plants = LoteManager.parseCSV(fs.readFileSync(PLANTS_CSV_PATH, 'utf8'));
  const categories = LoteManager.parseCSV(fs.readFileSync(CATEGORIES_CSV_PATH, 'utf8'));

  const stats = LoteManager.computeLoteStats(plants, categories);
  assert.equal(stats.totalVarieties, 87);
  assert.equal(stats.byYear['2022'], 36);
  assert.equal(stats.byYear['2026'], 50);
  assert.equal(stats.pendingConfirmCount, 11);
  assert.equal(stats.pinnedCount, 46);

  const citricas = LoteManager.filterPlants(plants, { categoria_id: 'citricas' });
  assert.equal(citricas.length, 12);

  const viticultura = LoteManager.filterPlants(plants, { familia: 'Vitaceae' });
  assert.equal(viticultura.length, 6);

  const searchMyrtaceae = LoteManager.filterPlants(plants, { query: 'grumixama' });
  assert.equal(searchMyrtaceae.length, 1);
  assert.equal(searchMyrtaceae[0].nome_cientifico, 'Eugenia brasiliensis');
});

test('toCSV round-trips parsed records accurately', () => {
  const sample = [
    { id: 'cereja', nome_popular: 'Cereja-do-Rio-Grande', origem: 'Sul, Brasil' }
  ];
  const csv = LoteManager.toCSV(sample, ['id', 'nome_popular', 'origem']);
  const parsed = LoteManager.parseCSV(csv);
  assert.deepEqual(parsed, sample);
});

test('assets/data CSV copies match _data CSVs', () => {
  const dataPlants = fs.readFileSync(PLANTS_CSV_PATH, 'utf8');
  const assetsPlants = fs.readFileSync(path.join(ROOT, 'assets/data/lote_plantas.csv'), 'utf8');
  assert.equal(dataPlants, assetsPlants);

  const dataCats = fs.readFileSync(CATEGORIES_CSV_PATH, 'utf8');
  const assetsCats = fs.readFileSync(path.join(ROOT, 'assets/data/lote_categorias.csv'), 'utf8');
  assert.equal(dataCats, assetsCats);
});

test('LOTE_GEOMETRY calibrates proportions from 6m Dome (10px = 1m) and maps key structures', () => {
  assert.equal(LoteManager.LOTE_GEOMETRY.scalePxPerMeter, 10.0);
  assert.equal(LoteManager.LOTE_GEOMETRY.domeReference.diameterMeters, 6.0);
  assert.equal(LoteManager.pxToMeters(60), 6.0);
  assert.equal(LoteManager.metersToPx(6.0), 60);

  const ids = LoteManager.LOTE_GEOMETRY.structures.map((s) => s.id);
  assert.ok(ids.includes('dome'));
  assert.ok(ids.includes('wip-pond'));
  assert.ok(ids.includes('bamboo-structure'));
  assert.ok(ids.includes('main-house'));
  assert.ok(ids.includes('stone-paths'));
  assert.ok(ids.includes('casinha'));
  assert.ok(ids.includes('atelie'));
  assert.ok(ids.includes('deposito-madeira'));
  const dome = LoteManager.LOTE_GEOMETRY.structures.find((s) => s.id === 'dome');
  assert.equal(dome.color, '#22c55e', 'Dome (Greenhouse) should use green color');
  const pond = LoteManager.LOTE_GEOMETRY.structures.find((s) => s.id === 'wip-pond');
  assert.equal(pond.color, '#38bdf8', 'WIP Pond should use blue color');
  const bamboo = LoteManager.LOTE_GEOMETRY.structures.find((s) => s.id === 'bamboo-structure');
  assert.equal(bamboo.url, '/bamboo-web-structure-project');
  const mainHouse = LoteManager.LOTE_GEOMETRY.structures.find((s) => s.id === 'main-house');
  assert.ok(mainHouse.aFrame6x6Points, 'Main house must define the 6x6m A-frame section');
  assert.ok(mainHouse.aFrame7x6Points, 'Main house must define the 7x6m A-frame extension');
  assert.ok(mainHouse.solarPoints, 'Main house must define the 6x6m solar panel array');
  assert.ok(mainHouse.solarUpperPoints, 'Main house must define the 7x6m upper solar panel array');
  assert.equal(LoteManager.LOTE_GEOMETRY.boundaryMetrics.divisaJairMeters, 49.1);

  // Verify Limite Oeste endpoints (S -> NW) lie horizontally at y = 60 in the rotated coordinate system
  const rotS = LoteManager.rotateImagePx(283, 1178);
  const rotNW = LoteManager.rotateImagePx(45, 180);
  assert.equal(rotS.y, 60);
  assert.equal(rotNW.y, 60);
});

test('hasValidCoords rejects null/empty and computePinLabelPlacements rotates close labels to prevent overlap', () => {
  assert.equal(LoteManager.hasValidCoords({ mapa_x: null, mapa_y: null }), false);
  assert.equal(LoteManager.hasValidCoords({ mapa_x: '', mapa_y: '' }), false);
  assert.equal(LoteManager.hasValidCoords({ mapa_x: '26.0', mapa_y: '33.5' }), true);

  const closePins = [
    { id: 'limao-taiti', cx: 233, cy: 339, text: 'Limão Taiti' },
    { id: 'tangerina-ponkan', cx: 260, cy: 335, text: 'Tangerina Ponkan' }
  ];
  const placements = LoteManager.computePinLabelPlacements(closePins);
  assert.ok(placements['limao-taiti']);
  assert.ok(placements['tangerina-ponkan']);
  assert.notEqual(
    placements['limao-taiti'].angleDeg,
    placements['tangerina-ponkan'].angleDeg,
    'Close pins must be assigned distinct rotation angles so their labels fan out without overlapping'
  );
});

test('parsePlantPins and setPlantPins support multiple pins per plant and auto-update quantidade', () => {
  const plant = {
    id: 'tangerina-ponkan',
    nome_popular: 'Tangerina Ponkan',
    quantidade: '1',
    mapa_x: '88.5',
    mapa_y: '23.3'
  };

  const pins = LoteManager.parsePlantPins(plant);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].x, 88.5);
  assert.equal(pins[0].y, 23.3);

  pins.push({ index: 1, x: 90.2, y: 24.1 });
  LoteManager.setPlantPins(plant, pins, true);

  assert.equal(plant.quantidade, '2', 'Adding a 2nd pin must auto-increment quantidade from 1 to 2');
  assert.equal(plant.mapa_x, '88.5;90.2');
  assert.equal(plant.mapa_y, '23.3;24.1');

  const reparsed = LoteManager.parsePlantPins(plant);
  assert.equal(reparsed.length, 2);
});




