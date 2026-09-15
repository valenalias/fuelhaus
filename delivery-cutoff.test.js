// Corte de pedidos nuevos (2026-09-15): miércoles 15:00 hora de Miami.
// Setiembre 2026 está en horario de verano de EE.UU. (EDT, UTC-4), por eso
// las horas UTC de estos casos son "hora de Miami + 4".
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { firstDeliverySundayDate } = require('./delivery-cutoff');

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

test('lunes a miércoles antes de las 15:00 (Miami): llega al domingo más próximo', () => {
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-14T15:00:00Z'))), '2026-09-20'); // lunes 11:00 Miami
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-15T15:00:00Z'))), '2026-09-20'); // martes 11:00 Miami
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-16T18:59:00Z'))), '2026-09-20'); // miércoles 14:59 Miami
});

test('miércoles a las 15:00 (Miami) en adelante: pasa al domingo siguiente al inmediato', () => {
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-16T19:00:00Z'))), '2026-09-27'); // miércoles 15:00 Miami en punto
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-16T23:30:00Z'))), '2026-09-27'); // miércoles 19:30 Miami
});

test('jueves a sábado: pasa al domingo siguiente al inmediato (sin cambios)', () => {
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-17T15:00:00Z'))), '2026-09-27'); // jueves 11:00 Miami
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-18T15:00:00Z'))), '2026-09-27'); // viernes 11:00 Miami
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-19T15:00:00Z'))), '2026-09-27'); // sábado 11:00 Miami
});

test('si hoy ya es domingo, pasa al domingo siguiente (sin cambios)', () => {
  assert.equal(isoDate(firstDeliverySundayDate(new Date('2026-09-20T15:00:00Z'))), '2026-09-27'); // domingo 11:00 Miami
});
