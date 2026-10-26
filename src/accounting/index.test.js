'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');

function run(...lines) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'index.js')], {
    input: lines.join('\n') + '\n',
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}

test('initial balance and repeated views do not mutate state', () => {
  const output = run('1', '1', '4');
  assert.equal(output.match(/Current balance: 00100000/g).length, 2);
  for (const option of ['1. View Balance', '2. Credit Account', '3. Debit Account', '4. Exit']) {
    assert.ok(output.includes(option));
  }
});

test('whole-unit and decimal credits accumulate and are saved', () => {
  const output = run('2', '25', '1', '2', '25.75', '2', '10', '2', '20.50', '1', '4');
  assert.match(output, /Amount credited\. New balance: 00102500/);
  assert.match(output, /Current balance: 00102500/);
  assert.match(output, /Amount credited\. New balance: 00105075/);
  assert.match(output, /Current balance: 00108125/);
});

test('debits subtract funds and allow an exact-balance debit', () => {
  const output = run('3', '125.25', '1', '3', '874.75', '1', '4');
  assert.match(output, /Amount debited\. New balance: 00087475/);
  assert.match(output, /Current balance: 00087475/);
  assert.match(output, /Amount debited\. New balance: 00000000/);
  assert.match(output, /Current balance: 00000000/);
});

test('insufficient funds leave state unchanged and later operations work', () => {
  const output = run('3', '1000.01', '1', '2', '5', '1', '4');
  assert.match(output, /Insufficient funds for this debit\./);
  assert.match(output, /Current balance: 00100000/);
  assert.match(output, /Current balance: 00100500/);
  assert.doesNotMatch(output, /Amount debited/);
});

test('zero-value credit and debit succeed without changing the balance', () => {
  const output = run('2', '0', '3', '0.00', '1', '4');
  assert.match(output, /Amount credited\. New balance: 00100000/);
  assert.match(output, /Amount debited\. New balance: 00100000/);
  assert.match(output, /Current balance: 00100000/);
});

test('invalid menu choices do not change state and the menu continues', () => {
  for (const choice of ['5', '', 'abc', '1x', '1.0', '-1', '12']) {
    const output = run(choice, '1', '4');
    assert.match(output, /Invalid choice, please select 1-4\./);
    assert.match(output, /Current balance: 00100000/);
  }
});

test('exit stops processing immediately and emits the original goodbye', () => {
  const output = run('4', '2', '100');
  assert.match(output, /Exiting the program\. Goodbye!\n$/);
  assert.doesNotMatch(output, /Enter credit amount/);
});

test('balance is process-local and resets on restart', () => {
  assert.match(run('2', '10', '1', '4'), /Current balance: 00101000/);
  assert.match(run('1', '4'), /Current balance: 00100000/);
});

test('maximum balance is exact and overflow is rejected without mutation', () => {
  const output = run('2', '998999.99', '1', '2', '0.01', '1', '3', '999999.99', '1', '4');
  assert.equal(output.match(/Current balance: 99999999/g).length, 2);
  assert.match(output, /Credit would exceed the maximum balance of 999999\.99\./);
  assert.match(output, /Current balance: 00000000/);
  assert.match(run('2', '999999.99', '1', '4'), /Current balance: 00100000/);
});

test('invalid amounts are rejected for both operations without mutation', () => {
  for (const operation of ['2', '3']) {
    for (const amount of ['', 'abc', '-1', '1000000', '1.234', 'NaN', 'Infinity', '1e2', '1x', '0x10', '+1']) {
      const output = run(operation, amount, '1', '4');
      assert.match(output, /Invalid amount\./);
      assert.match(output, /Current balance: 00100000/);
      assert.doesNotMatch(output, /Amount (credited|debited)/);
    }
  }
});

test('fractional transactions use exact cents rather than floating-point arithmetic', () => {
  const output = run('2', '0.1', '2', '0.20', '3', '1000.30', '1', '4');
  assert.match(output, /Current balance: 00000000/);
});

test('end of input exits cleanly and never commits an incomplete transaction', () => {
  assert.match(run(), /Exiting the program\. Goodbye!/);
  const output = run('2');
  assert.match(output, /No amount received\. Transaction cancelled\./);
  assert.doesNotMatch(output, /Amount credited/);
  assert.match(output, /Exiting the program\. Goodbye!/);
});
