
function cleanTeX(x) { return x; }
function resolveId(x) { return x; }
function getAttributes(x) { return {type: 'liquid', color: 'blue'}; }
function getColors(x) { return ['blue']; }
let window = { currentLabData: { reaction: JSON.stringify({"1_2eqK0.5": [{id: "3", count: 1}]}) } };
let labData = window.currentLabData;
let calculateMixPH = () => 7.0;

const getFlaskState = (indices, excludeKey = null) => {
      let state = {
        ph: 7.0,
        temp: 298.0,
        reactionName: "",
        visualColors: [],
        productType: null,
        reactionKey: null,
        reactingIndices: [],
        limitingYield: 1.0, // Default 1.0 (100%)
        isEquilibrium: false,
        direction: 'forward',
        K: null,
        outcome: null
      };

      if (!indices || indices.length === 0) return state;

      // 1. Map Inputs: Handle both raw IDs and {id, qty} objects
      // We need to sum up total Quantity available for each ID
      const flaskCounts = {}; // ID -> Total Quantity
      const flaskInstances = {}; // ID -> Array of original objects (for tracking)

      indices.forEach(item => {
        const id = (typeof item === 'object' && item.id) ? item.id : item;
        const qty = (typeof item === 'object' && item.qty) ? item.qty : 1.0;
        const strId = String(id);

        if (!flaskCounts[strId]) flaskCounts[strId] = 0;
        flaskCounts[strId] += qty;

        if (!flaskInstances[strId]) flaskInstances[strId] = [];
        flaskInstances[strId].push(item);
      });

      // pH
      const newPH = calculateMixPH(indices.map(item => (typeof item === 'object' && item.id) ? item.id : item)); // Pass raw IDs for pH calculation
      if (newPH !== null) state.ph = newPH;

      // Reaction
      let outcome = null;
      let reactionData = null;
      let reactingIndices = [];
      const lData = window.currentLabData || labData;

      if (lData && lData.reaction && indices.length >= 1) { // Changed from indices.length >= 2 to >= 1 to allow single-reactant reactions
        try {
          // Use sanitized string safely
          const sanitizedReaction = lData.reaction.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          reactionData = JSON.parse(sanitizedReaction);
        } catch (e) {
          console.error("Error parsing reaction data:", e);
        }

        if (reactionData) {
          // --- NEW LOGIC: Iterate Reactions & Check Stoichiometry ---
          // 2. Iterate All Defined Reactions to find a match
          // We prioritize "complex" reactions (more total reactants) to avoid partial matches
          const reactionKeys = Object.keys(reactionData).sort((a, b) => {
            // Sort by length/complexity descending (heuristic)
            return b.length - a.length;
          });

          for (const key of reactionKeys) {
            if (excludeKey && key === excludeKey) continue;

            // 3. Parse Key
            // Format: "2*1_3*2eqK1.5" -> Reactants: 2 of '1', 3 of '2'. Eq: True, K: 1.5

            let baseKey = key;
            let isEq = false;
            let kVal = null;

            // Check Suffixes
            if (baseKey.includes('eq')) {
              isEq = true;
              kVal = 1.0; // Default K is 1
              // Check for K value
              const kMatch = baseKey.match(/eqK([\d\.]+)/);
              if (kMatch) {
                kVal = parseFloat(kMatch[1]);
              }
              // Strip suffix for reactant parsing
              baseKey = baseKey.split('eq')[0];
            }

            const reactantParts = baseKey.split('_');
            let match = true;
            const requiredIndicesForReaction = []; // To store exactly which instances are consumed
            let minYield = Infinity;

            // 4. Verify Stoichiometry & Calculate Yield
            for (const part of reactantParts) {
              let count = 1;
              let id = part;

              // Check "Count * ID" syntax (e.g. 3*2)
              if (part.includes('*')) {
                const pieces = part.split('*');
                if (pieces.length === 2 && !isNaN(pieces[0])) {
                  count = parseInt(pieces[0]);
                  id = pieces[1];
                }
              }

              // Check if flask has enough
              // NEW: Check Total Quantity vs Required Count
              // If we have 0.5 units, and need 1, yield is 0.5
              const available = flaskCounts[id] || 0;

              if (available <= 0.0001) { // Use a small epsilon for float comparison
                match = false;
                break;
              }

              const theoreticalYield = available / count;
              if (theoreticalYield < minYield) minYield = theoreticalYield;

              // "Consume" logic for tracking: We don't need to splice instances anymore
              // We just record the IDs involved.
              const instancesToUse = flaskInstances[id].map(obj => (typeof obj === 'object' ? obj.id : obj));
              requiredIndicesForReaction.push(...instancesToUse);
            }

            if (match) {
              // FOUND A VALID REACTION
              let finalYield = minYield; // Default to limiting reagent yield (Complete reaction)

              // --- EQUILIBRIUM LOGIC ---
              if (isEq && kVal !== null) {
                // 1. Gather Reactant Data (We need it again in a structured way for the solver)
                // Re-parse reactantParts to get coefficients and available amounts
                const reactants = [];
                for (const part of reactantParts) {
                  let count = 1;
                  let id = part;
                  if (part.includes('*')) {
                    const pieces = part.split('*');
                    if (pieces.length === 2 && !isNaN(pieces[0])) {
                      count = parseInt(pieces[0]);
                      id = pieces[1];
                    }
                  }
                  reactants.push({
                    count: count,
                    available: flaskCounts[id] || 0
                  });
                }

                // 2. Gather Product Data
                // We need current amounts of products in flask to calculate Q
                const products = [];
                const outcome = reactionData[key] || [];
                // Group outcome items by ID to determine coefficients (e.g. 2 NH3)
                const productCounts = {};
                outcome.forEach(p => {
                  const pid = p.id;
                  productCounts[pid] = (productCounts[pid] || 0) + 1;
                });

                Object.keys(productCounts).forEach(pid => {
                  products.push({
                    count: productCounts[pid],
                    available: flaskCounts[pid] || 0
                  });
                });

                // 3. Solve for Extent (Delta) using Binary Search
                // Find delta in [0, minYield] such that Q(delta) = K
                // Q(delta) = [Products] / [Reactants]
                // Q = Prod((P.curr + P.coef*delta)^P.coef) / Prod((R.curr - R.coef*delta)^R.coef)

                // Check initial Q (delta=0)
                let num0 = 1;
                products.forEach(p => num0 *= Math.pow(p.available, p.count));
                let den0 = 1;
                reactants.forEach(r => den0 *= Math.pow(r.available, r.count));

                // If den0 is 0 (reactants empty), Q is undefined (or infinite). 
                // But here we know reactants > 0 due to 'match' check.

                let Q0 = num0 / den0;
                let maxReverseYield = Infinity;
                products.forEach(p => {
                  const theoreticalRev = p.available / p.count;
                  if (theoreticalRev < maxReverseYield) maxReverseYield = theoreticalRev;
                });
                if (products.length === 0) maxReverseYield = 0;

                let low = -maxReverseYield;
                let high = minYield;

                for (let i = 0; i < 30; i++) {
                  const mid = (low + high) / 2;

                  if (mid >= minYield * 0.999999) {
                    high = mid; continue;
                  }
                  if (mid <= -maxReverseYield * 0.999999) {
                    low = mid; continue;
                  }

                  let num = 1;
                  products.forEach(p => num *= Math.pow(Math.max(0, p.available + p.count * mid), p.count));
                  let den = 1;
                  reactants.forEach(r => den *= Math.pow(Math.max(0, r.available - r.count * mid), r.count));

                  if (den <= 1e-9) {
                    high = mid; continue;
                  }

                  const Q = num / den;
                  if (Q < kVal) {
                    low = mid;
                  } else {
                    high = mid;
                  }
                }
                finalYield = low;
              }

              // Apply Yield Lower Bound filter to prevent micro-reactions
              if (Math.abs(finalYield) < 0.001) {
                // Treat as no reaction
                continue;
              }

              state.reactionKey = key;
              state.reactingIndices = requiredIndicesForReaction; // Legacy name, now used for "Consumption Set"
              state.outcome = reactionData[key];

              // Generate Reaction Name (Equation)
              // Key format: "1_3*2eqK1" -> "1 + 3*2"

              const cleanFormula = (str) => cleanTeX(str);

              let leftSide = "";
              reactantParts.forEach((part, idx) => {
                let count = 1;
                let id = part;
                if (part.includes('*')) {
                  const p = part.split('*');
                  count = p[0];
                  id = p[1];
                }
                // Resolve ID to Name/Formula
                const resolved = resolveId(id);
                if (idx > 0) leftSide += " + ";
                leftSide += (count > 1 ? count + " " : "") + cleanFormula(resolved);
              });

              let rightSide = "";
              if (state.outcome) {
                const outArr = Array.isArray(state.outcome) ? state.outcome : [state.outcome];
                // Group by ID
                const counts = {};
                outArr.forEach(o => counts[o.id] = (counts[o.id] || 0) + 1);

                Object.keys(counts).forEach((oid, idx) => {
                  if (idx > 0) rightSide += " + ";
                  const c = counts[oid];
                  rightSide += (c > 1 ? c + " " : "") + cleanFormula(resolveId(oid) || oid);
                });
              }

              // Use mhchem arrow syntax inside \ce
              const arrow = isEq ? " <=> " : " -> ";
              state.reactionName = "\\(\\ce{" + leftSide + arrow + rightSide + "}\\)";

              // Helper to define generic properties if they exist
              if (state.outcome && state.outcome.length > 0) {
                const first = state.outcome[0];
                state.productType = first.type;
                state.productColor = first.color;
                state.productName = first.name || first.id;
                state.triggerConditional = first.conditional === "true";
                // Accumulate scripts? Usually just one.
                state.script = first.script;
              }

              state.limitingYield = finalYield;

              return state;
            }
          }

          // Reverse Equilibrium Matching: If we have a product matching an 'eq' reaction, trigger decomposition
          if (!outcome && indices.length > 0) {
            for (const key in reactionData) {
              if (key.includes('eq')) {
                const eqOutcomes = Array.isArray(reactionData[key]) ? reactionData[key] : [reactionData[key]];
                const productIds = eqOutcomes.map(o => o.id);

                // If any item in flask matches a product of an equilibrium reaction
                const matchingProduct = indices.find(id => productIds.includes(id));
                if (matchingProduct) {
                  // Trigger Reverse: Generate reactants from the key
                  const reactantParts = key.split('eq')[0].split('_').filter(p => p);
                  const reverseOutcomes = [];

                  reactantParts.forEach(part => {
                    let count = 1;
                    let rStr = part;

                    // Parse "Count * ID"
                    // Default count is 1
                    if (part.includes('*')) {
                      const pieces = part.split('*');
                      if (pieces.length === 2 && !isNaN(pieces[0])) {
                        count = parseInt(pieces[0]);
                        rStr = pieces[1];
                      }
                    }

                    // Generate 'count' copies of this reactant
                    for (let c = 0; c < count; c++) {
                      const beakerKey = isNaN(rStr) ? null : 'beaker' + rStr;
                      // const attrKey = isNaN(rStr) ? null : 'attributes' + rStr; // Unused variable?

                      let id = rStr;
                      let type = 'liquid';
                      let color = 'rgba(255, 255, 255, 0.2)';

                      if (beakerKey && window.currentLabData && window.currentLabData[beakerKey]) {
                        id = window.currentLabData[beakerKey];
                        const attr = getAttributes(parseInt(rStr));
                        if (attr) {
                          if (attr.type) type = attr.type;
                          if (attr.color) color = attr.color;
                        }
                      } else {
                        // Inventory item fallback
                        const item = window.itemsData.find(i => i.id === rStr || i.name === rStr);
                        if (item) {
                          id = item.id;
                          if (item.attributes) {
                            const attr = typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes;
                            if (attr.type) type = attr.type;
                            if (attr.color) color = attr.color;
                          }
                        }
                      }

                      reverseOutcomes.push({
                        id: id,
                        type: type,
                        color: color
                      });
                    }
                  });

                  outcome = reverseOutcomes;
                  // matchingProduct is defined in the closure
                  reactingIndices = [matchingProduct];
                  state.isEquilibrium = true;
                  state.K = 1; // Default K=1 for reverse
                  state.direction = 'reverse';
                  break;
                }
              }
            }
          }
        }

        state.outcome = outcome;
        state.reactingIndices = reactingIndices;
        // Assume reactingIndices joined forms the key (used for identity).
        state.reactionKey = outcome ? reactingIndices.sort((a, b) => String(a).localeCompare(String(b))).join('_') : null;

        let visualColors = [];
        let prodType = null;
        let prodColor = null;

        let tempReactants = reactingIndices ? [...reactingIndices] : [];

        indices.forEach((bId) => {
          const rIndex = tempReactants.indexOf(bId);
          if (rIndex > -1) {
            tempReactants.splice(rIndex, 1);
          } else {
            const colors = getColors([bId]);
            if (colors.length > 0) visualColors.push(colors[0]);
          }
        });

        if (outcome) {
          // Normalize to array
          const outcomes = Array.isArray(outcome) ? outcome : [outcome];
          state.products = outcomes;

          let productNames = [];
          let productScripts = [];
          let primaryType = null;
          let primaryColor = null;

          outcomes.forEach(prod => {
            // Visuals: If any product is solid/gas, tracking it might be useful for rendering override?
            // Currently, 'visualColors' tracks LIQUIDS. 
            // 'prodType'/'prodColor' tracks the SPECIAL state (solid block/gas).
            // If we have multiple, we need a strategy.
            // For now, let's say if ANY is solid, we show solid. If ANY is gas, we show gas (or maybe both?).
            // The renderer uses 'productType' and 'productColor'.
            // Let's stick to the FIRST non-liquid type found for the 'productType' state used by partial renderers,
            // OR better: Just grab data for names/scripts here. Visuals are handled by 'visualColors' 
            // and specific tokens.

            if (typeof prod === 'string') {
              if (prod === 'solid') {
                if (!primaryType) { primaryType = 'solid'; primaryColor = reactionData.solidcolor; }
              }
              productNames.push("Unknown Product");
            } else {
              productNames.push(prod.id || "Unknown Product");
              if (prod.script) productScripts.push(prod.script);

              // Simple priority for single-state legacy renderers: Solid > Gas > Liquid
              if (prod.type === 'solid') {
                primaryType = 'solid';
                primaryColor = prod.color;
              } else if ((prod.type === 'gas' || prod.type === 'trapped_gas') && primaryType !== 'solid') {
                primaryType = prod.type; // Use the specific gas type
                primaryColor = prod.color;
              } else if (prod.type === 'liquid' && !primaryType) {
                primaryType = 'liquid';
                primaryColor = prod.color;
              }

              // If it's a liquid, add to the visualColors list so it mingles with other liquids
              if (prod.type === 'liquid' && prod.color) {
                visualColors.push(prod.color);
              }
            }
          });

          // Temperature Averaging
          let totalTemp = 0;
          let tempCount = 0;
          outcomes.forEach(o => {
            if (o.temp) { totalTemp += parseInt(o.temp); tempCount++; }
          });
          if (tempCount > 0) {
            state.temp = Math.floor(totalTemp / tempCount);
          } else if (reactionData && reactionData.temp) {
            state.temp = parseInt(reactionData.temp);
          }

          // pH Mixture Logic (Treating products as equal volume mix)
          let totalH_prod = 0;
          let phCount = 0;
          outcomes.forEach(o => {
            if (o.ph !== undefined) {
              let ph = parseFloat(o.ph);
              let molesH = Math.pow(10, -ph);
              let molesOH = Math.pow(10, -(14 - ph));
              totalH_prod += (molesH - molesOH);
              phCount++;
            }
          });

          if (phCount > 0) {
            let avgNetH = totalH_prod / phCount;
            if (avgNetH > 0) {
              state.ph = -Math.log10(avgNetH);
            } else if (avgNetH < 0) {
              state.ph = 14 - (-Math.log10(-avgNetH));
            } else {
              state.ph = 7.0;
            }
            state.ph = Math.round(state.ph * 100) / 100;
          }


          // Format Reaction Name: $$\ce{Reactant1 + Reactant2 -> Product1 + Product2}$$
          let reactantIds = [];
          reactingIndices.forEach(idx => {
            let id = null;
            if (typeof idx === 'number') {
              const attr = getAttributes(idx);
              if (attr && attr.id) id = attr.id;
              else if (window.currentLabData && window.currentLabData['beaker' + idx]) id = window.currentLabData['beaker' + idx];
            } else {
              // Inventory items: the id is the key used in reactingIndices
              id = idx;
            }
            if (id) reactantIds.push(id);
          });

          // Helper to strip LaTeX wrappers for the reaction string
          const cleanForReaction = (name) => cleanTeX(name);

          const reactantsStr = reactantIds.map(cleanForReaction).join(" + ");
          const productsStr = productNames.map(cleanForReaction).join(" + ");

          // Save raw lists for measurement bar
          // Save raw lists for measurement bar (must match resolvedId exactly)
          state.reactantList = reactantIds;
          state.productList = productNames; // These are from outcomes which are usually raw IDs too? Check downstream.

          const arrow = state.isEquilibrium ? "<=>" : "->";

          state.reactionName = `$$\\ce{${reactantsStr} ${arrow} ${productsStr}}$$`;
          state.productName = productsStr;
          state.script = productScripts.join(";");

          // Legacy single-state support (best guess)
          if (primaryType) {
            state.productType = primaryType;
            state.productColor = primaryColor;
          } else if (outcomes.length > 0 && typeof outcomes[0] === 'object') {
            state.productType = outcomes[0].type;
            state.productColor = outcomes[0].color;
          }

        }

        // Note: 'visualColors' was already pushed with liquid products above.

        state.visualColors = visualColors;
        // state.productType is set above
        // state.productColor is set above

        // Check for conditional trigger in products
        if (state.products) {
          state.products.forEach(p => {
            if (p && (p.conditional === "true" || p.conditional === true || p.conditional === 1)) {
              state.triggerConditional = true;
            }
          });
        }
      }

      return state;
    };

    

module.exports = { getFlaskState };
