
const cleanFormula = (str) => {
    // Strip \(\ce{...}\) or \ce{...} or \(...\)
    // Typical ID: "\\(\\ce{N2}\\)" -> "N2"
    let s = str;
    if (s.startsWith("\\(\\ce{")) s = s.replace(/^\\\\\(\\\\ce\{|\}\\\\\)$/g, '');
    else if (s.startsWith("\\ce{")) s = s.replace(/^\\ce\{|\}$/g, '');
    else if (s.startsWith("\\(")) s = s.replace(/^\\\\\(|\}\\\\\)$/g, ''); // Handle \(...\) without ce
    return s;
};

// Test Cases matching data.json format
const cases = [
    "\\(\\ce{N2}\\)",      // N2
    "\\(\\ce{H2}\\)",      // H2
    "\\(\\ce{NH3}\\)",     // NH3
    "\\(\\ce{NaOH}\\)",    // NaOH
    "JustText",            // JustText
    "\\(\\ce{Long_Formula}\\)"
];

console.log("Testing cleanFormula:");
cases.forEach(c => {
    console.log(`Original: '${c}' -> Cleaned: '${cleanFormula(c)}'`);
});
