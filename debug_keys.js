const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
console.log(Object.keys(data));
if (data.active_narrative_outline) console.log("active_narrative_outline found");
if (data.pchem_nodes) console.log("pchem_nodes found");
else console.log("pchem_nodes MISSING");
