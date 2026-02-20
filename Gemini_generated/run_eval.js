const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

global.document = {
  addEventListener: () => {},
  getElementById: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '' }),
  createElement: () => ({ style: {}, classList: { add:()=>{}, remove:()=>{} }, innerHTML: '', innerText: '', appendChild: ()=>{} }),
};
global.window = {};
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}), text: () => Promise.resolve('') });
global.console = Object.assign({}, console); 

try {
  eval(code);
} catch(e) {}

setTimeout(() => {
   let allIds = [
      {id: "1", qty: 2.0},
      {id: "2", qty: 1.0},
      {id: "3", qty: 1.0}
   ];
   let st = getFlaskState(allIds);
   console.log("Returned State has isEquilibrium:", st.isEquilibrium, "limitingYield:", st.limitingYield);
}, 200);
