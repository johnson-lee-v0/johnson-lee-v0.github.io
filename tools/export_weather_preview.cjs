#!/usr/bin/env node
'use strict';

// Redraw the original observation panel, not model results. No fetching or fitting.
// Usage: node tools/export_weather_preview.cjs /path/to/Max-Temperature-Modeling/data/report_data.json
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const SOURCE = {
  repository: 'https://github.com/johnson-lee-v0/Max-Temperature-Modeling',
  commit: '8d8b132f5228c4002780c29d6da13ce4c8686af7',
  file: 'data/report_data.json',
  sha256: '412a70964876267653d76d20ec42ee594d7cac983f2c274705471e03589fad11',
  figure: 'assets/01_data_landscape.png',
  figureRecipe: 'build_report.py: figures → dev.groupby(month).target.mean()',
};
const STATIONS = [
  { id: 'NYC', name: 'Central Park', color: '#3e5541', noaa: 'USW00094728' },
  { id: 'LAX', name: 'Los Angeles', color: '#aa7b26', noaa: 'USW00023174' },
  { id: 'DFW', name: 'Dallas–Fort Worth', color: '#b26246', noaa: 'USW00003927' },
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const XML = value => String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
const number = value => Number(value.toFixed(3));

function extractReport(bytes) {
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), SOURCE.sha256,
    'Use the exact published report snapshot, not a newer or edited series.');
  const report = JSON.parse(bytes);
  const panel = report.panel.filter(row => row.date >= '2024-01-01' && row.date < '2026-01-01');
  let matchedDates;
  return STATIONS.map(station => {
    const rows = panel.filter(row => row.region === station.id);
    const dates = rows.map(row => row.date).sort();
    assert.equal(new Set(dates).size, 729, `${station.id}: unique matched-date count`);
    assert.equal(rows.length, 729, `${station.id}: original development-period count`);
    if (matchedDates) assert.deepEqual(dates, matchedDates, 'Station dates must remain matched.');
    matchedDates = dates;
    const months = MONTHS.map((_, index) => {
      const values = rows.filter(row => Number(row.date.slice(5, 7)) === index + 1).map(row => row.target);
      assert.ok(values.length > 0 && values.every(Number.isFinite));
      return { month: index + 1, n: values.length, mean: values.reduce((sum, value) => sum + value, 0) / values.length };
    });
    return { ...station, months };
  });
}

function makeSvg(stations, mobile = false) {
  const width = mobile ? 900 : 1200;
  const height = 1000;
  const plot = { left: mobile ? 101 : 128, right: mobile ? 834 : 1118, top: 356, bottom: 792, min: 35, max: 100 };
  const x = month => plot.left + (month - 1) * (plot.right - plot.left) / 11;
  const y = temperature => plot.bottom - (temperature - plot.min) * (plot.bottom - plot.top) / (plot.max - plot.min);
  const metadata = {
    source: SOURCE,
    measure: 'Observed daily maximum temperature',
    unit: '°F',
    period: ['2024-01-01', '2025-12-31'],
    aggregation: 'Arithmetic mean of target grouped by station and calendar month across 2024–2025; matched dates only. No smoothing, prediction, or imputation.',
    datesPerStation: 729,
    omittedDates: ['2024-01-01', '2025-05-30'],
    plot,
    stations,
  };
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="weather-title weather-description">`,
    '  <title id="weather-title">Temperature, place by place</title>',
    '  <desc id="weather-description">Monthly means of observed daily maximum temperatures for Central Park (NYC), Los Angeles airport (LAX), and Dallas–Fort Worth airport (DFW), across 729 matched dates per station in 2024–2025. Dallas and New York show larger seasonal changes than Los Angeles. This is observed weather context, not a forecast or a model-performance chart.</desc>',
    `  <metadata id="weather-source">${XML(JSON.stringify(metadata))}</metadata>`,
    `  <rect width="${width}" height="${height}" fill="#f3f0e8"/>`,
    `  <path d="M64 76H${width - 64}" stroke="#d4d6c9" stroke-width="2"/>`,
    `  <g font-family="Arial,Helvetica,sans-serif" fill="#33483a">`,
    `    <text x="64" y="58" font-size="21" letter-spacing="2.4">WEATHER / OBSERVATIONS</text>`,
    `    <text x="${width - 64}" y="58" text-anchor="end" font-size="21">2024–2025</text>`,
    `    <text x="64" y="160" font-family="Georgia,Times New Roman,serif" font-size="${mobile ? 66 : 74}" fill="#24372b">Temperature,</text>`,
    `    <text x="64" y="238" font-family="Georgia,Times New Roman,serif" font-size="${mobile ? 66 : 74}" fill="#24372b">place by place.</text>`,
    `    <text x="64" y="294" font-size="${mobile ? 24 : 26}" fill="#626f60">Monthly mean daily maximum · °F</text>`,
    '  </g>',
    '  <g font-family="Arial,Helvetica,sans-serif" font-size="23" fill="#65715f">',
  ];
  for (const tick of [40, 60, 80, 100]) {
    parts.push(`    <path d="M${plot.left} ${number(y(tick))}H${plot.right}" stroke="#d4d9cb" stroke-width="1.6"/>`);
    parts.push(`    <text x="${plot.left - 22}" y="${number(y(tick) + 8)}" text-anchor="end">${tick}</text>`);
  }
  parts.push('  </g>');
  // The single subtle observation area gives the profile visual weight without adding a fourth series.
  const nycPoints = stations[0].months.map(month => `${number(x(month.month))},${number(y(month.mean))}`).join(' ');
  parts.push(`  <polygon points="${plot.left},${plot.bottom} ${nycPoints} ${plot.right},${plot.bottom}" fill="#3e5541" opacity="0.055"/>`);
  for (const station of stations) {
    const points = station.months.map(month => `${number(x(month.month))},${number(y(month.mean))}`).join(' ');
    parts.push(`  <g data-station="${station.id}">`);
    parts.push(`    <polyline data-observation-profile="${station.id}" points="${points}" fill="none" stroke="${station.color}" stroke-width="${mobile ? 9 : 10}" stroke-linecap="round" stroke-linejoin="round"/>`);
    for (const month of station.months) {
      parts.push(`    <circle cx="${number(x(month.month))}" cy="${number(y(month.mean))}" r="5.5" fill="${station.color}"><title>${station.id} · ${MONTHS[month.month - 1]} · ${month.mean.toFixed(2)} °F · ${month.n} observed dates</title></circle>`);
    }
    parts.push('  </g>');
  }
  parts.push('  <g font-family="Arial,Helvetica,sans-serif" font-size="23" fill="#667260" text-anchor="middle">');
  for (let month = 1; month <= 12; month++) {
    // Mobile keeps the complete 12 data points; six tick labels preserve spacing.
    if (!mobile || [1, 3, 5, 7, 9, 12].includes(month)) {
      parts.push(`    <text x="${number(x(month))}" y="827">${MONTHS[month - 1]}</text>`);
    }
  }
  parts.push('  </g>');
  parts.push(`  <path d="M64 861H${width - 64}" stroke="#d4d6c9" stroke-width="1.6"/>`);
  parts.push('  <g font-family="Arial,Helvetica,sans-serif">');
  stations.forEach((station, index) => {
    const columnX = 64 + index * (width - 128) / 3;
    parts.push(`    <path d="M${number(columnX)} 896H${number(columnX + 43)}" stroke="${station.color}" stroke-width="8" stroke-linecap="round"/>`);
    parts.push(`    <text x="${number(columnX + 58)}" y="908" fill="${station.color}" font-size="36" font-weight="700">${station.id}</text>`);
    parts.push(`    <text x="${number(columnX)}" y="946" fill="#4c5f4e" font-size="${mobile ? 23 : 25}">${station.name}</text>`);
  });
  parts.push(`    <text x="64" y="986" fill="#697461" font-size="18">729 matched dates per station · NOAA observations</text>`);
  parts.push('  </g>', '</svg>', '');
  return parts.join('\n');
}

if (require.main === module) {
  const sourcePath = process.argv[2];
  if (!sourcePath) throw new Error('Pass the published Max-Temperature-Modeling/data/report_data.json path.');
  const stations = extractReport(fs.readFileSync(sourcePath));
  const output = path.resolve(__dirname, '../image/Project_Cover');
  for (const [name, mobile] of [['Weather-preview.svg', false], ['Weather-mobile.svg', true]]) {
    fs.writeFileSync(path.join(output, name), makeSvg(stations, mobile));
    console.log(`${name}: ${mobile ? '900' : '1200'} × 1000; 36 source-derived monthly means`);
  }
}

module.exports = { SOURCE, STATIONS, extractReport, makeSvg };
