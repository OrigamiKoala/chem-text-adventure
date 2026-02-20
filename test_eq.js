const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Mock DOM/Browser globals
global.document = {
  addEventListener: () => {},
  getElementById: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '' }),
  createElement: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '', appendChild: ()=>{} }),
};
global.window = {};
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve('') });
global.console.log = () => {};

// Evaluate game.js in scope
try {
  eval(code);
} catch(e) {}

// Wait for eval to finish async stuff possibly? No, it's mostly synchronous except fetch.
setTimeout(() => {
  console.log("Finished load");
}, 100);
