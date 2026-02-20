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

let funcStr = code.substring(code.indexOf('const getFlaskState ='), code.indexOf('// --- Reaction Queue Globals ---'));
let queueStr = code.substring(code.indexOf('const queueReaction ='), code.indexOf('// --- Interaction ---'));

let evalStr = `
  function cleanTeX(x) { return x; }
  function resolveId(x) { return x; }
  function getAttributes(x) { return {type: 'liquid', color: 'blue'}; }
  function getColors(x) { return ['blue']; }
  let window = { currentLabData: { reaction: JSON.stringify({"1_2eqK1": [{id: "3", type: "liquid"}]}) } };
  let labData = window.currentLabData;
  let calculateMixPH = () => 7.0;
  
  let visualStack = [
      {ids: ["1"], quantity: 2.0, type: "liquid", color: "red"},
      {ids: ["2"], quantity: 1.0, type: "liquid", color: "blue"},
      {ids: ["3", "1", "2"], quantity: 1.0, type: "liquid", color: "purple", isProduct: true}
  ];
  let currentPH = 7;
  let currentTemperature = 298;
  let currentReactionName = "";
  let currentProductName = "";
  let currentReactionScript = "";
  let currentProductType = "";
  let currentProductColor = "";
  let currentProducts = [];
  
  let reactionQueue = Promise.resolve();
  function renderVisualStack() {}
  
  ` + funcStr + `
  ` + queueStr + `
  
  let allIds = [ {id: "1", qty: 2.0}, {id: "2", qty: 1.0}, {id: "3", qty: 1.0} ];
  let st = getFlaskState(allIds);
  console.log("State:", st.isEquilibrium, st.limitingYield);
  
  queueReaction(st).catch(e => console.error(e)).then(() => {
     console.log("FINAL STACK:", visualStack);
  });
`;

try {
  eval(evalStr);
} catch(e) {
  console.error(e);
}
