import assert from 'node:assert/strict'
import test from 'node:test'
import { parseNumbers, voteNumber } from './parse.ts'

function first(text, totals) {
  return parseNumbers(text, totals)[0]
}

test('secret rares parse above the set total', () => {
  const read = first('201/165')
  assert.deepEqual([read.number, read.total], ['201', '165'])
})

test('name junk around a number is ignored', () => {
  const read = first('G  245/198  ')
  assert.deepEqual([read.number, first('245/198').total], ['245', '198'])
})

test('trainer gallery and galarian gallery codes parse', () => {
  assert.deepEqual([first('TG05/TG30').number, first('TG05/TG30').total], ['TG05', '30'])
  assert.deepEqual([first('GG35 / GG70').number, first('GG35/GG70').total], ['GG35', '70'])
})

test('promo codes parse', () => {
  assert.equal(first('SWSH020').number, 'SWSH020')
  assert.equal(first('SVP 045').number, 'SVP045')
})

test('OCR letter repairs', () => {
  assert.equal(first('O25/I65').number, '25')
})

test('known totals trim junk and repair a missing slash', () => {
  const totals = new Set([165, 198, 146, 30, 70])
  assert.deepEqual([first('42/1460 Ne', totals).number, first('42/1460', totals).total], ['42', '146'])
  assert.deepEqual([first('2017165, rg', totals).number, first('2017165', totals).total], ['201', '165'])
  assert.equal(first('1IGO5/1G30', totals).number, 'TG05')
  assert.equal(first('GG35/GGZ0N', totals).number, 'GG35')
})

test('vote prefers the majority and drops implausible secret-rare reads', () => {
  assert.equal(
    voteNumber([
      { number: '25', total: '165', kind: 'std' },
      { number: '25', total: '165', kind: 'std' },
      { number: '223', total: '165', kind: 'std' },
    ]).pick.number,
    '25'
  )
  assert.equal(
    voteNumber([
      { number: '923', total: '165', kind: 'std' },
      { number: '25', total: '165', kind: 'std' },
    ]).pick.number,
    '25'
  )
})
