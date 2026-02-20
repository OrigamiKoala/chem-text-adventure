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
   window.currentLabData = {
      reaction: JSON.stringify({
         "1_2eqK1": [{id: "3", type: "liquid"}]
      })
   };
   
   window.visualStack = [
      {ids: ["1"], quantity: 1.5, type: "liquid", color: "red"},
      {ids: ["2"], quantity: 1.5, type: "liquid", color: "blue"},
      {ids: ["3", "1", "2"], quantity: 0.5, type: "liquid", color: "purple", isProduct: true}
   ];
   
   let allIds = [
      {id: "1", qty: 1.5},
      {id: "2", qty: 1.5},
      {id: "3", qty: 0.5}
   ];
   let state = window.getFlaskState ? window.getFlaskState(allIds) : null;
   
   if (!state) {
      // getFlaskState is scoped inside DOMContentLoaded. Let's extract.
      let funcStr = code.substring(code.indexOf('const getFlaskState ='), code.indexOf('// --- Reaction Queue Globals ---'));
      let queueStr = code.substring(code.indexOf('const queueReaction ='), code.indexOf('// --- Interaction ---'));
      let evalStr = `
        function cleanTeX(x) { return x; }
        function resolveId(x) { return x; }
        function getAttributes(x) { return {type: 'liquid', color: 'blue'}; }
        function getColors(x) { return ['blue']; }
        let labData = window.currentLabData;
        let calculateMixPH = () => 7.0;
        let visualStack = window.visualStack;
        let reactionQueue = Promise.resolve();
        function renderVisualStack() {}
        ` + funcStr + `
        ` + queueStr + `
        
        let allIds = [ {id: "1", qty: 1.5}, {id: "2", qty: 1.5}, {id: "3", qty: 0.5} ];
        let st = getFlaskState(allIds);
        console.log("Extracted State isEq:", st.isEquilibrium, "Yield:", st.limitingYield);
        queueReaction(st).then(() => {
           console.log("FINAL VISUAL STACK:");
           console.dir(visualStack, {depth: null});
        });
      `;
      eval(evalStr);
   }
}, 200);
