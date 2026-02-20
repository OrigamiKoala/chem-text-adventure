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
} catch(e) { console.error(e); }

setTimeout(() => {
   window.currentLabData = {
      reaction: JSON.stringify({
         "1_2eqK1": [{id: "3", type: "liquid"}]
      })
   };
   
   let allIds = [
      {id: "1", qty: 1.5},
      {id: "2", qty: 1.5},
      {id: "3", qty: 0.5}
   ];
   
   console.log("TESTING STATE:");
   let s = getFlaskState(allIds);
   console.log(s);
}, 200);
