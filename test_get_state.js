const { getFlaskState } = require('./test_extracted.js');

let allIds = [
  {id: "1", qty: 2.0},
  {id: "2", qty: 2.0},
  {id: "3", qty: 1.0}
];

let state = getFlaskState(allIds);
console.log("State:", state);
