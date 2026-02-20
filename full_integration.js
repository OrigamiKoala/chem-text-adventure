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
global.updateMeasurementBars = () => {};
global.MathJax = undefined;

try {
  eval(code);
} catch(e) {}

setTimeout(() => {
   // Setup initial flask with equilibrium mixture
   window.currentLabData = {
      reaction: JSON.stringify({
         "1_2eqK1": [{id: "3", type: "liquid"}]
      })
   };
   
   window.visualStack = [
      {ids: ["1"], quantity: 1.0, type: "liquid", color: "red"},
      {ids: ["2"], quantity: 1.0, type: "liquid", color: "blue"},
      {ids: ["3", "1", "2"], quantity: 1.0, type: "liquid", color: "purple", isProduct: true}
   ];
   
   console.log("Initial Visual Stack:", window.visualStack);
   console.log("Adding 1...");
   window.labAddLiquid("1");
   
   // labAddLiquid sets up debounced reaction check (processLogicUpdates)
   setTimeout(() => {
     console.log("Final Stack:", window.visualStack);
   }, 1500);
}, 200);
