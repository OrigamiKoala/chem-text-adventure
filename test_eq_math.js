const kVal = 1;
const reactants = [{count: 1, available: 1.5}];
const products = [{count: 1, available: 0.5}];

const minYield = 1.5;
let maxReverseYield = 0.5;

let low = -maxReverseYield;
let high = minYield;

for (let i = 0; i < 30; i++) {
  const mid = (low + high) / 2;

  if (mid >= minYield * 0.999999) { high = mid; continue; }
  if (mid <= -maxReverseYield * 0.999999) { low = mid; continue; }

  let num = 1;
  products.forEach(p => num *= Math.pow(Math.max(0, p.available + p.count * mid), p.count));
  let den = 1;
  reactants.forEach(r => den *= Math.pow(Math.max(0, r.available - r.count * mid), r.count));

  if (den <= 1e-9) { high = mid; continue; }

  const Q = num / den;
  if (Q < kVal) { low = mid; } 
  else { high = mid; }
}
console.log("Final Yield Extent:", low);
console.log("Expected R:", reactants[0].available - low);
console.log("Expected P:", products[0].available + low);

// Test old behavior vs new behavior
