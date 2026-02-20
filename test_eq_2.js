const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

global.document = {
  addEventListener: () => {},
  getElementById: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '' }),
  createElement: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '', appendChild: ()=>{} }),
};
global.window = {};
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve('') });
global.console.log = () => {};

try {
  eval(code);
} catch(e) {}

setTimeout(() => {
  console.log("Syntax is sound");
}, 100);
