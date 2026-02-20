
const cleanFormula = (str) => {
    let s = str;
    // Regex intended to match starting "\(\ce{"
    // In JS string literal for Regex: "^\\\\\\(\\ce\\{"
    // Wait, regex literal /.../ handles backslashes differently than string "..."

    // Attempt 1: Using regex literal
    // To match literal '\', use '\\'
    // To match literal '(', use '\('
    // So to match '\(', use '\\\('
    // To match '\(\ce{', use ^\\\(\\ce\{

    if (/^\\\(\\ce\{/.test(s)) {
        s = s.replace(/^\\\(\\ce\{|\}\\\)$/g, '');
    } else if (/^\\ce\{/.test(s)) {
        s = s.replace(/^\\ce\{|\}$/g, '');
    } else if (/^\\\(/.test(s)) {
        s = s.replace(/^\\\(|\}\\\)$/g, '');
    }
    return s;
};

// Test Cases matching data.json format
// Note: In JS source, "\\" means one backslash.
const cases = [
    "\\(\\ce{N2}\\)",      // Represents string: \(\ce{N2}\)
    "\\(\\ce{H2}\\)",
    "\\(\\ce{NH3}\\)",
    "\\(\\ce{NaOH}\\)",
    "JustText",
    "\\ce{Simple}",        // Represents string: \ce{Simple}
    "\\(ParenOnly\\)"      // Represents string: \(ParenOnly\)
];

console.log("Testing cleanFormula Corrected:");
cases.forEach(c => {
    console.log(`Original: '${c}' -> Cleaned: '${cleanFormula(c)}'`);
});
