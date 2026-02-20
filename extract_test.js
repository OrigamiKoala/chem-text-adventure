const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Extract getFlaskState out properly
let getFlaskStateStr = code.substring(code.indexOf('const getFlaskState ='), code.indexOf('// --- Reaction Queue Globals ---'));

let evalStr = `
function cleanTeX(x) { return x; }
function resolveId(x) { return x; }
function getAttributes(x) { return {type: 'liquid', color: 'blue'}; }
function getColors(x) { return ['blue']; }
let window = { currentLabData: { reaction: JSON.stringify({"1_2eqK0.5": [{id: "3", count: 1}]}) } };
let labData = window.currentLabData;
let calculateMixPH = () => 7.0;

${getFlaskStateStr}

module.exports = { getFlaskState };
`;
fs.writeFileSync('test_extracted.js', evalStr);
