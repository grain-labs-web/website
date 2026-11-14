import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, fromHash, recipeHash, bowlName, recipeText, TOPPINGS, cleanName, breakfastTitle } from '../src/lib/recipe.js';
test('recipe links round-trip every possible topping combination', () => {
  for(let mask=0;mask<2**TOPPINGS.length;mask++){const ids=TOPPINGS.filter((_,i)=>mask & (1<<i)).map(t=>t.id);assert.deepEqual(fromHash(recipeHash(ids)),ids);}
});
test('personalised title handles blank, long and international names without markup', () => {
  assert.equal(breakfastTitle('  Kavi  '), "Kavi's breakfast");
  assert.equal(breakfastTitle('   '), 'My breakfast');
  assert.equal(cleanName('काव्या'), 'काव्या');
  assert.ok(Array.from(cleanName('a'.repeat(100))).length === 24);
  assert.doesNotMatch(cleanName('<img src=x>'), /[<>]/);
  assert.doesNotMatch(recipeHash(['banana']), /Kavi/);
});
test('unknown and duplicate ingredients cannot enter a recipe', () => {
  assert.deepEqual(normalize(['banana','unknown','banana','berries']),['banana','berries']);
  assert.deepEqual(fromHash('#oats=unknown,<script>,seeds,seeds'),['seeds']);
});
test('section links are distinct from an intentionally empty recipe', () => {
  assert.equal(fromHash('#ritual'),null);assert.deepEqual(fromHash('#oats='),[]);
});
test('recipe is useful with no toppings and contains no invented nutrition', () => {
  assert.equal(bowlName([]),'The chocolate original');
  assert.match(recipeText([]),/according to the pack/);
  assert.match(recipeText(['banana','peanut']),/banana, peanut butter/);
  assert.doesNotMatch(recipeText(TOPPINGS.map(t=>t.id)),/calorie|protein|fiber|kcal|\d+\s*g/i);
});
