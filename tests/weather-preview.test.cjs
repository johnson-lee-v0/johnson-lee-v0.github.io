/* Run with node --test tests/weather-preview.test.cjs. No browser or packages required. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const { SOURCE, extractReport, makeSvg } = require('../tools/export_weather_preview.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const decode = text => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const metadata = svg => JSON.parse(decode(svg.match(/<metadata id="weather-source">([\s\S]*?)<\/metadata>/)[1]));

// Independently recomputed from the pinned report_data.json's observation panel.
// Each item is the arithmetic mean of target, not a reconstructed figure pixel or forecast.
const means = {
  NYC: [39.14098360655737, 43.62105263157895, 55.669999999999995, 63.767, 70.93606557377046, 81.67999999999999, 86.99870967741936, 82.24032258064516, 76.75099999999999, 66.87645161290322, 55.60400000000001, 41.7983870967742],
  LAX: [65.30590163934426, 63.75263157894737, 63.57548387096774, 65.714, 67.79344262295083, 71.61200000000001, 73.41451612903224, 77.35419354838712, 76.19900000000001, 73.29838709677422, 69.28999999999999, 66.89967741935484],
  DFW: [53.05114754098362, 65.05684210526316, 74.05903225806452, 77.80099999999999, 84.91704918032787, 92.06000000000002, 94.50354838709673, 96.89, 89.72899999999998, 84.73129032258066, 72.842, 63.64806451612904],
};
const counts = [61, 57, 62, 60, 61, 60, 62, 62, 60, 62, 60, 62];

for (const [filename, width, mobile] of [['Weather-preview.svg', 1200, false], ['Weather-mobile.svg', 900, true]]) {
  test(`${filename} preserves actual monthly observations and complete station names`, () => {
    const svg = read(`image/Project_Cover/${filename}`);
    const data = metadata(svg);
    assert.equal(data.source.commit, '8d8b132f5228c4002780c29d6da13ce4c8686af7');
    assert.equal(data.source.sha256, SOURCE.sha256);
    assert.equal(data.source.file, 'data/report_data.json');
    assert.equal(data.source.figure, 'assets/01_data_landscape.png');
    assert.equal(data.unit, '°F');
    assert.equal(data.datesPerStation, 729);
    assert.deepEqual(data.period, ['2024-01-01', '2025-12-31']);
    assert.deepEqual(data.omittedDates, ['2024-01-01', '2025-05-30']);
    assert.deepEqual(data.stations.map(station => station.id), ['NYC', 'LAX', 'DFW']);
    assert.match(svg, new RegExp(`width="${width}" height="1000" viewBox="0 0 ${width} 1000"`));
    for (const station of data.stations) {
      assert.deepEqual(station.months.map(month => month.n), counts);
      assert.deepEqual(station.months.map(month => month.mean), means[station.id]);
      assert.equal(station.months.reduce((sum, month) => sum + month.n, 0), 729);
      assert.ok(svg.includes(`>${station.id}</text>`));
      assert.ok(svg.includes(station.name));
      assert.equal(svg.match(new RegExp(`<title>${station.id} · `, 'g')).length, 12);
    }
    assert.equal(svg, makeSvg(data.stations, mobile), 'Asset remains reproducible by its mechanical exporter.');
  });

  test(`${filename} maps every original monthly point to the shared temperature scale without smoothing`, () => {
    const svg = read(`image/Project_Cover/${filename}`);
    const data = metadata(svg);
    const p = data.plot;
    const round = value => Number(value.toFixed(3));
    const profiles = [...svg.matchAll(/<polyline data-observation-profile="([A-Z]+)" points="([^"]+)"/g)];
    assert.equal(profiles.length, 3);
    for (const [, id, text] of profiles) {
      const points = text.split(' ').map(point => point.split(',').map(Number));
      assert.equal(points.length, 12);
      means[id].forEach((temperature, index) => {
        assert.deepEqual(points[index], [
          round(p.left + index * (p.right - p.left) / 11),
          round(p.bottom - (temperature - p.min) * (p.bottom - p.top) / (p.max - p.min)),
        ]);
      });
    }
    assert.doesNotMatch(svg, /<image\b|<foreignObject\b|<script\b|MAE|R²|FedAvg|prediction performance|accuracy score/i);
    assert.match(svg, /not a forecast or a model-performance chart/);
  });
}

test('the original published landscape figure is preserved byte-for-byte', () => {
  const bytes = fs.readFileSync(path.join(root, 'image/Project_Cover/Max-temperature-landscape.png'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
    '97a84c72eeaa47db30a93202edc4da5a3dbae247be71f04b02177ff7aafbd4cf');
});

const sourcePath = path.resolve(root, '../Max-Temperature-Modeling/data/report_data.json');
test('when the neighboring source checkout is present, recompute all 36 means from its fixed raw panel',
  { skip: !fs.existsSync(sourcePath) }, () => {
    const stations = extractReport(fs.readFileSync(sourcePath));
    for (const station of stations) assert.deepEqual(station.months.map(month => month.mean), means[station.id]);
    assert.equal(read('image/Project_Cover/Weather-preview.svg'), makeSvg(stations));
    assert.equal(read('image/Project_Cover/Weather-mobile.svg'), makeSvg(stations, true));
  });

test('the exporter refuses a changed report snapshot instead of silently changing the evidence', () => {
  assert.throws(() => extractReport(Buffer.from('{"panel": []}')), /exact published report snapshot/);
});
