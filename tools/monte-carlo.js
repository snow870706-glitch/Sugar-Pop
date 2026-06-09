const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "..", "math-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const actions = Number(process.argv[2] || 1_000_000);
const bet = Number(process.argv[3] || config.minBet);

const clearDistribution = [
  { tier: 0, weight: 0.72 },
  { tier: 6, weight: 0.2 },
  { tier: 10, weight: 0.07 },
  { tier: 20, weight: 0.01 }
];

const totalWeight = clearDistribution.reduce((sum, item) => sum + item.weight, 0);

function pickTier() {
  let roll = Math.random() * totalWeight;
  for (const item of clearDistribution) {
    roll -= item.weight;
    if (roll <= 0) return item.tier;
  }
  return clearDistribution[clearDistribution.length - 1].tier;
}

function fragmentsForTier(tier) {
  if (tier >= 20) return config.fragmentAwards["20"];
  if (tier >= 10) return config.fragmentAwards["10"];
  if (tier >= 6) return config.fragmentAwards["6"];
  return 0;
}

function playBonus() {
  let currentOffer = bet * config.bonusMultipliers[0];
  for (let step = 0; step < config.bonusMultipliers.length; step += 1) {
    currentOffer = bet * config.bonusMultipliers[step];
    const isFinal = step === config.bonusMultipliers.length - 1;
    if (isFinal) return currentOffer;
    if (Math.random() > config.bonusSuccessRates[step]) {
      return bet * config.consolationMultiplier;
    }
  }
  return currentOffer;
}

let fragments = 0;
let totalBet = 0;
let totalWin = 0;
let winningActions = 0;
let bonusCount = 0;
let maxActionWin = 0;

for (let i = 0; i < actions; i += 1) {
  totalBet += bet;
  const tier = pickTier();
  fragments += fragmentsForTier(tier);
  let actionWin = 0;

  while (fragments >= config.fragmentTarget) {
    fragments -= config.fragmentTarget;
    bonusCount += 1;
    actionWin += playBonus();
  }

  if (actionWin > 0) winningActions += 1;
  if (actionWin > maxActionWin) maxActionWin = actionWin;
  totalWin += actionWin;
}

const report = {
  actions,
  bet,
  rtp: Number((totalWin / totalBet).toFixed(4)),
  hitRate: Number((winningActions / actions).toFixed(4)),
  bonusFrequency: Number((bonusCount / actions).toFixed(4)),
  totalBet,
  totalWin,
  maxActionWin,
  remainingFragments: fragments,
  clearDistribution
};

console.log(JSON.stringify(report, null, 2));
