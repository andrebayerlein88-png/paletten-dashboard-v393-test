import test from 'node:test';import assert from 'node:assert/strict';import {validateSnapshot} from '../src/validation.js';
test('rejects empty',()=>assert.ok(validateSnapshot(null)));
test('rejects malformed revision',()=>assert.ok(validateSnapshot({revision:-1,state:{}})));
test('rejects incomplete schema',()=>assert.ok(validateSnapshot({revision:0,state:{schemaVersion:14}})));
test('accepts test snapshot structure',()=>{const keys=['employees','palettes','loads','errors','audits','closures','exportPlans','kanbanProducts','kanbanMovements','replenishmentRequests','tdsCustomers','tdsPreparations','inboundDeliveries'];const state={schemaVersion:14,settings:{}};keys.forEach(k=>state[k]=[]);assert.equal(validateSnapshot({revision:0,state}),null);});
