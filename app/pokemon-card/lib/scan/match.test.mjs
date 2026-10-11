import assert from 'node:assert/strict'
import test from 'node:test'
import { buildQueries, scoreMatch } from './parse.ts'

const BEST_THRESHOLD = 0.9

test('high name + number + total agreement is a single match', () => {
  const score = scoreMatch(
    { name: 'Pikachu', number: '25', printedTotal: 165 },
    { name: 'Pikachu', number: '25', total: '165', kind: 'std', agreement: 0.7 }
  )
  assert.ok(score >= BEST_THRESHOLD)
})

test('secret rares still rank when the number is above the set total', () => {
  const score = scoreMatch(
    { name: 'Zapdos ex', number: '201', printedTotal: 165 },
    { name: 'Zapdos', number: '201', total: '165', kind: 'std', agreement: 1 }
  )
  assert.ok(score >= 0.8)
})

test('promo queries skip printedTotal', () => {
  const queries = buildQueries({ name: 'Pikachu', number: 'SVP045', kind: 'promo' })
  assert.deepEqual(queries, ['number:SVP045 name:"Pikachu*"', 'number:SVP045', 'name:"Pikachu"', 'name:Pika*'])
})

test('low name similarity stays below the single-match threshold', () => {
  const score = scoreMatch(
    { name: 'Bulbasaur', number: '1', printedTotal: 165 },
    { name: 'Pikachu', number: '25', total: '165', kind: 'std' }
  )
  assert.ok(score < BEST_THRESHOLD)
})
