import test from 'node:test';
import assert from 'node:assert';
import { calculateScenario, calculateRequiredContribution } from './scenarioCalculator.js';

test('Scenario Calculator Logic', async (t) => {

  await t.test('calculateScenario: Standard case', () => {
    const res = calculateScenario({
      initialPrincipal: 10000,
      additionalContribution: 500,
      contributionFrequency: 'monthly',
      duration: 10,
      annualGrowthRate: 6
    });
    
    // Future Value = 10000*(1.005)^120 + 500*(((1.005)^120 - 1)/0.005)
    // = 10000*1.8193967 + 500*(163.87934)
    // = 18193.97 + 81939.67 = 100133.64
    assert.ok(Math.abs(res.finalPrincipal - 100133.64) < 1, 'Final principal should be around 100133.64');
    assert.strictEqual(res.breakdown.totalContributed, 70000); // 10000 + 500*120
  });

  await t.test('calculateScenario: Zero growth', () => {
    const res = calculateScenario({
      initialPrincipal: 10000,
      additionalContribution: 1000,
      contributionFrequency: 'annually',
      duration: 5,
      annualGrowthRate: 0
    });
    assert.strictEqual(res.finalPrincipal, 15000);
    assert.strictEqual(res.breakdown.totalGrowth, 0);
  });
});

test('Required Contribution Logic', async (t) => {

  await t.test('calculateRequiredContribution: Standard case', () => {
    const res = calculateRequiredContribution({
      initialPrincipal: 10000,
      targetNetWorth: 1000000,
      currentAge: 25,
      targetAge: 65,
      contributionFrequency: 'monthly',
      annualGrowthRate: 8
    });
    
    // Duration = 40 years. r=0.08/12.
    // requiredContribution = ~216.92
    assert.ok(Math.abs(res.requiredContribution - 216.92) < 0.1, 'Required contribution should be around 216.92');
    assert.strictEqual(res.finalPrincipal, 1000000, 'Final principal is exactly target net worth');
  });

  await t.test('calculateRequiredContribution: Zero growth', () => {
    const res = calculateRequiredContribution({
      initialPrincipal: 0,
      targetNetWorth: 12000,
      currentAge: 30,
      targetAge: 31,
      contributionFrequency: 'monthly',
      annualGrowthRate: 0
    });
    assert.strictEqual(res.requiredContribution, 1000, 'Should require exactly 1000 a month');
  });
  
  await t.test('calculateRequiredContribution: Already exceeded target', () => {
    const res = calculateRequiredContribution({
      initialPrincipal: 10000,
      targetNetWorth: 5000,
      currentAge: 30,
      targetAge: 40,
      contributionFrequency: 'annually',
      annualGrowthRate: 5
    });
    // FV of 10000 in 10 yrs at 5% is ~16288. Which is > 5000.
    // So required contribution should be capped at 0.
    assert.strictEqual(res.requiredContribution, 0, 'Should require 0 when target is already met');
    // The final principal will be 16288.95
    assert.ok(res.finalPrincipal > 16288, 'Final principal reflects what the lump sum grows into');
  });

});
