// once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

  // defining global variables
  const qtext = document.getElementById('text');
  const previousdiv = document.getElementById('previous');
  const formElement = document.getElementById('responseform');
  const inputField = document.getElementById('response');
  let currentid = "initial";
  let historyStack = [];
  let JSdata = null;
  let fullJSdata = null;
  let helpText = '';
  let outlineText = '';
  let narrativeoutlineText = '';
  let JSoutline = null;
  let JSnarrativeoutline = null;
  let currentTypingContext = null
  let typingTimeoutId = null;
  let outlineclicked = false;
  let previouscontainer = null
  let previoustext = ''
  let typespeed = 15;
  let rollingActive = false;
  const emptyLine = document.createElement('div');
  emptyLine.className = 'spacer';
  let wrongcounter = 0;
  let periodictableversion = 1
  let hintcount = 1;
  let isNarrativeMode = true;
  const generateStatsTo72 = () => {
    let stats = [12, 12, 12, 12, 12, 12];
    for (let i = 0; i < 150; i++) {
      let i1 = Math.floor(Math.random() * 6);
      let i2 = Math.floor(Math.random() * 6);
      if (i1 === i2) continue;
      let dir = Math.random() > 0.5 ? 1 : -1;
      if (stats[i1] + dir >= 1 && stats[i1] + dir <= 20 &&
        stats[i2] - dir >= 1 && stats[i2] - dir <= 20) {
        stats[i1] += dir;
        stats[i2] -= dir;
      }
    }
    return stats;
  };
  const [s1, s2, s3, s4, s5, s6] = generateStatsTo72();
  window.STR = s1;
  window.DEX = s2;
  window.CON = s3;
  window.INT = s4;
  window.WIS = s5;
  window.CHA = s6;
  window.rollingActive = false;
  window.labAddLiquid = null; // Prevent ReferenceError
  window.machineon = false;
  window.conditional = false;

  window.roll = function (diceType, stat, dc, advantage) {
    rollingActive = true;
    // 1. Parse Dice
    const [numDice, numSides] = diceType.toLowerCase().split('d').map(Number);

    // 2. Get Stat Modifier
    const statValue = window[stat] || 10;
    const modifier = Math.floor((statValue - 10) / 2);

    // Helper to roll dice
    const doRoll = () => {
      let sum = 0;
      let rolls = [];
      for (let i = 0; i < numDice; i++) {
        let r = Math.floor(Math.random() * numSides) + 1;
        rolls.push(r);
        sum += r;
      }
      return { sum, rolls };
    };

    // 3. Logic
    let resultObj;
    let finalRoll = 0;
    let rollType = 'Normal';

    if (advantage === true) {
      rollType = 'Advantage';
      let r1 = doRoll();
      let r2 = doRoll();
      if (r1.sum >= r2.sum) {
        finalRoll = r1.sum;
        resultObj = { ...r1, dropped: r2.sum };
      } else {
        finalRoll = r2.sum;
        resultObj = { ...r2, dropped: r1.sum };
      }
    } else if (advantage === false) {
      rollType = 'Disadvantage';
      let r1 = doRoll();
      let r2 = doRoll();
      if (r1.sum <= r2.sum) {
        finalRoll = r1.sum;
        resultObj = { ...r1, dropped: r2.sum };
      } else {
        finalRoll = r2.sum;
        resultObj = { ...r1, dropped: r2.sum };
      }
    } else {
      let r1 = doRoll();
      finalRoll = r1.sum;
      resultObj = r1;
    }
    let passed = false;
    if (finalRoll === 20) {
      passed = true;
    } else if (finalRoll === 1) {
      passed = false;
    } else {
      passed = (typeof dc === 'number') ? finalRoll + modifier >= dc : null;
    }
    const total = finalRoll + modifier;

    // 4. UI Animation
    const chatContainer = document.getElementById('previous'); // Or previouscontainer
    // We want to insert into the flow.
    // If we are called from typeWriter script, previouscontainer is where text is being added.
    // If called from inventory, previouscontainer might be old.
    // Safer to append to the end of 'previous' if typically used for chat log.
    // But standard is appending before form.

    const rollBox = document.createElement('div');
    rollBox.className = 'dice-roll-notification';
    if (formElement && formElement.parentNode) {
      formElement.parentNode.insertBefore(rollBox, formElement);
    } else {
      document.body.appendChild(rollBox);
    }
    scrollToBottom();

    const startTime = Date.now();
    const duration = 2000;

    const modSign = modifier >= 0 ? '+' : '';
    let statLabel = '';
    if (stat) {
      statLabel = `${stat} ${statValue} (${modSign}${modifier})`;
    }

    const animate = () => {
      const now = Date.now();
      if (now - startTime < duration) {
        // Flash random numbers
        let flashSum = 0;
        let flashText = [];
        for (let i = 0; i < numDice; i++) {
          let r = Math.floor(Math.random() * numSides) + 1;
          flashText.push(r);
          flashSum += r;
        }

        let displayText = `Rolling ${diceType} `;
        if (stat) {
          displayText += `for ${statLabel}`;
        }
        if (numDice > 1) {
          displayText += ` (${flashText.join('+')}) = ${flashSum}`;
        } else {
          displayText += `${flashSum}`;
        }

        if (advantage !== undefined && advantage !== null) {
          displayText += ` (${rollType})`;
        }

        rollBox.innerHTML = `<div class="dice-result">${displayText}</div>`;

        requestAnimationFrame(animate);
      } else {
        // Final Result
        rollingActive = false;

        let resultHTML = `<div class="dice-result">`;
        if (passed === true) resultHTML += `<span class="dice-success">Success!</span> `;
        if (passed === false) resultHTML += `<span class="dice-failure">Failure!</span> `;

        resultHTML += `Rolled ${total}`;
        if (stat) {
          resultHTML += ` for ${statLabel}`;
        }
        resultHTML += `</div>`;

        let detailHTML = `<div class="dice-detail">`;
        detailHTML += `[${resultObj.rolls.join('+')}]`;
        if (modifier !== 0) detailHTML += ` ${modSign}${modifier} (${stat})`;
        if (advantage !== undefined && advantage !== null) {
          detailHTML += ` | ${rollType} (Dropped: ${resultObj.dropped})`;
        }
        if (typeof dc === 'number') detailHTML += ` vs DC ${dc}`;
        detailHTML += `</div>`;

        rollBox.innerHTML = resultHTML + detailHTML;
        scrollToBottom();
      }
    };

    animate();

    // Return Logic Result Immediately
    if (typeof dc === 'number') {
      return passed;
    } else {
      return total;
    }
  };

  // Helper to execute scripts in a container
  function runScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      try {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        // Copy attributes if any
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        document.body.appendChild(newScript);
        document.body.removeChild(newScript);
      } catch (e) {
        console.error("Error executing script:", e);
      }
    });
  }


  window.currentlab = "reactions";

  // HP System
  let playerHP = 100;
  let maxHP = 100;
  const hpContainer = document.getElementById('hp-container');

  window.changeHP = async function (amount) {
    if (amount < 0) {
      spawnFallingHearts(Math.abs(amount));
    }
    playerHP += amount;
    if (playerHP > maxHP) playerHP = maxHP;
    updateHPDisplay();
    if (playerHP <= 0 && isNarrativeMode) {
      HPloss = 0;
      if (playerHP <= -1 * maxHP) {
        playerHP = 0;
        updateHPDisplay();
        const newDiv = document.createElement('div');
        newDiv.className = 'question';
        document.getElementById('previous').appendChild(emptyLine);
        document.getElementById('previous').appendChild(newDiv);
        await typeWriter(newDiv, "Unfortunately, you have sustained too much damage and have been killed instantly. Please reload the page to restart the game.", typespeed);
        inputField.remove();
      } else {
        playerHP = 0;
        updateHPDisplay();
        const initialDiv = document.createElement('div');
        initialDiv.className = 'question';
        document.getElementById('previous').appendChild(initialDiv);
        await typeWriter(initialDiv, "Your HP has dropped to 0, and you fall unconscious. Rolling death saving throws.", typespeed);
        initialDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
        let deathsuccess = 0;
        for (let i = 0; i < 5; i++) {
          let roll = roll("1d20");
          if (roll >= 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            deathsuccess++;
            if (roll == 20) {
              await typeWriter(newDiv, "Critical Success! You have succeeded your death saving throws. You have survived - just barely, though. You slowly regain consciousness, and everything hurts. You may continue.", typespeed);
            }
          } else if (roll == 1) {
            await typeWriter(newDiv, "Critical Failure.", typespeed);
            deathsuccess--;
          }
        }
        const newDiv = document.createElement('div');
        newDiv.className = 'question';
        initialDiv.insertAdjacentElement('afterend', emptyLine);
        initialDiv.insertAdjacentElement('afterend', newDiv);
        if (deathsuccess >= 3) {
          await typeWriter(newDiv, "Death refuses to take you...yet. You have succeeded your death saving throws. You have survived - just barely, though. You slowly regain consciousness, and everything hurts. You may continue.", typespeed);
          changeHP(1);
          updateHPDisplay();
        }
        else {
          await typeWriter(newDiv, "Unfortunately, fate was not in your favor this time. You have failed your death saving throws, and are now dead. Please reload the page to restart the game.", typespeed);
          inputField.remove();
        }
      }
    }
  };

  function updateHPDisplay() {
    if (hpContainer) {
      if (playerHP >= maxHP) {
        playerHP = maxHP;
      }
      hpContainer.innerHTML = `<span id="hp-heart-icon">❤️</span>: ${playerHP}/${maxHP}`;
    }
  }

  // Initialize HP Display
  updateHPDisplay();

  // Passive HP Loss Logic
  window.HPloss = 0; // Default loss per minute
  setInterval(() => {
    if (window.HPloss > 0) {
      window.changeHP(-window.HPloss);
      console.log(`Passive HP loss: -${window.HPloss}. Current HP: ${window.playerHP}`);
    }
  }, 30000); // 30 seconds



  const safeTypeset = (elements) => {
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise(elements).catch(err => console.log('MathJax error: ' + err));
    }
  };

  // preload help.txt
  fetch('help.txt')
    .then(response => response.text())
    .then(data => { helpText = data; })
    .catch(error => { console.error('Error loading help text:', error); });

  // preload outline.json
  window.itemsData = [];
  window.inventory = {}; // { itemId: count }

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      JSnarrativeoutline = data.active_narrative_outline;
      JSoutline = data.active_narrative_outline;
      if (data.items) {
        window.itemsData = data.items;
      }
      if (JSoutline) {
        outlineText = 'Click on a section to jump to it.<br>';
        for (const item of JSoutline) {
          outlineText += '<button class="outline" onclick="jumpTo(\'' + item.div + '\')">' + item.reference_num + ' ' + item.content + '</button><br>';
        }
      }
      if (JSnarrativeoutline) {
        narrativeoutlineText = 'Click on a section to jump to it.<br>';
        for (const item of JSnarrativeoutline) {
          narrativeoutlineText += '<button class="outline" onclick="jumpTo(\'' + item.div + '\')">' + item.reference_num + ' ' + item.content + '</button><br>';
        }
      }
    }).catch(error => {
      console.error('Error loading outline:', error);
    });

  function decode(encodedURIComponent) {
    let result = encodedURIComponent.replaceAll("%20", " ");
    result = result.replaceAll("%25", "%");
    result = result.replaceAll("%2F", "/");
    result = result.replaceAll("%2C", ",");
    return result;
  }
  // jump to div id (for outline)
  function jumpTo(divid) {
    console.log("jumpTo called with divid=" + divid);
    historyStack.push(currentid);
    currentid = divid;
    outlineclicked = true;
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    updategame();
    console.log("jumpTo completed");
  }
  window.jumpTo = jumpTo; // expose jumpTo to global scope for button onclick
  let textbookdata = "null";
  let narrativedata = "null";
  // load data from json and render initial prompt
  fetch('data.json')
    .then(response => response.json())
    .then(async data => {
      fullJSdata = data;
      //  textbookdata = data.pchem_nodes;
      narrativedata = data.narrative_nodes;
      JSdata = narrativedata;
      updategame();
      currentid = "initial";
    })
    .catch(error => {
      console.error('Error loading game data:', error);
    });
  function findnode(nodeid) {
    if (JSdata) {
      // Use the built-in .find() method to search the array
      const node = JSdata.find(item => item.id == nodeid);

      if (node) {
        console.log("findnode found node for divid=" + nodeid);
        return node;
      } else {
        console.log("findnode did not find node for divid=" + nodeid);
        return null;
      }
    }
    return { text: "node data not loaded" };
  }

  // attach listener to form (safe when form exists)
  if (formElement) {
    formElement.addEventListener('submit', updategame);
  }

  // utility: smooth scroll to bottom of page (so form + latest qtext are visible)
  function scrollToBottom(smooth = true) {
    const behavior = smooth ? 'smooth' : 'instant';
    // use requestAnimationFrame to ensure DOM layout is updated before scrolling
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior });
    });
  }

  // typewriter effect
  function typeWriter(element, text, speed, callback = () => { }) {
    let contextResolver;
    const promise = new Promise(resolve => {
      contextResolver = resolve;
      console.log("typeWriter called");
      console.log("element= " + element);
      console.log("text= " + text);
      console.log("speed= " + speed);

      let i = 0;

      // reset typingTimeoutId and resolve previous context if pending
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
        console.log('Cleared existing typing timeout');
      }
      if (currentTypingContext && !currentTypingContext.finished) {
        console.log("Resolving previous typing context due to new typed text");
        currentTypingContext.interrupted = true;
        currentTypingContext.finished = true;
        currentTypingContext.resolve();
      }
      typingTimeoutId = null;
      currentTypingContext = null;

      // finish typing if form is resubmitted
      currentTypingContext = {
        element: element,
        text: text,
        finished: false,
        interrupted: false,
        resolve: resolve,
        // A method to instantly finish the typing
        finish: function () {
          if (!this.finished) {
            //IMPORTANT: Immediately stop the pending timer
            if (typingTimeoutId) {
              clearTimeout(typingTimeoutId);
              typingTimeoutId = null;
            }
            console.log('finish() called');
            // Display all remaining text
            let newText = previoustext;
            console.log(currentid);
            let splitnewText = newText.split("--");
            previouscontainer.remove();
            let newContainer = document.createElement('div');
            previouscontainer = newContainer; // FIX: Update local ref correctly
            formElement.parentNode.insertBefore(newContainer, formElement);
            for (var n = 0; n < splitnewText.length;) {
              console.log("Rendering interrupted text part " + n + ": " + splitnewText[n]);
              const newinterruptTextDiv = document.createElement('div');
              newinterruptTextDiv.className = 'question';
              newinterruptTextDiv.innerHTML = splitnewText[n];
              runScripts(newinterruptTextDiv);
              newContainer.appendChild(newinterruptTextDiv);
              newContainer.appendChild(emptyLine.cloneNode(true)); // FIX: Add spacer
              scrollToBottom(true);
              n++;
            }
            this.interrupted = true;
            this.finished = true;
            this.resolve();
          }
        }
      }

      function type() {
        // if finished typing, move on
        if (currentTypingContext && currentTypingContext.finished) {
          console.log("Typing already finished, exiting type()");
          return;
        }

        // if not finished typing
        if (i < text.length) {
          if (rollingActive) {
            typingTimeoutId = setTimeout(type, 100);
            return;
          }
          let delay = speed;
          let char = text.charAt(i);
          // Check for HTML tag
          if (char === '<') {
            console.log("HTML tag detected at index " + i);
            let tagEnd = text.indexOf('>', i);

            if (tagEnd !== -1) {
              let tagContent = text.substring(i, tagEnd + 1);

              // check if it's the specific <button tag
              if (tagContent.startsWith('<button')) {
                console.log("<button> tag detected at index " + i);
                // Find the closing </button> tag
                let closingTagStart = text.indexOf('</button>', i);

                if (closingTagStart !== -1) {
                  // Render the entire <button>...</button> structure instantly
                  let fullButtonHtml = text.substring(i, closingTagStart + 9); // +9 for length of </button>
                  element.innerHTML += fullButtonHtml;

                  // Set index i to after the closing tag
                  i = closingTagStart + 9;
                  delay = 1; // Tiny delay before next Qtext character
                } else {
                  // Fallback for an unmatched opening tag (treat as a simple tag)
                  element.innerHTML += tagContent;
                  i = tagEnd + 1;
                  delay = 1;
                }
              } else if (tagContent.startsWith('<ol')) {
                console.log("<ol> tag detected at index " + i);
                // Find the closing </ol> tag
                let closingTagStart = text.indexOf('</ol>', i);

                if (closingTagStart !== -1) {
                  // Render the entire <ol>...</ol> structure instantly
                  let fullOlHtml = text.substring(i, closingTagStart + 5); // +5 for length of </ol>
                  element.innerHTML += fullOlHtml;

                  // Set index i to after the closing tag
                  i = closingTagStart + 5;
                  delay = 1; // Tiny delay before next Qtext character
                } else {
                  // Fallback for an unmatched opening tag (treat as a simple tag)
                  element.innerHTML += tagContent;
                  i = tagEnd + 1;
                  delay = 1;
                }
              } else if (tagContent.startsWith('<ul')) {
                console.log("<ul> tag detected at index " + i);
                // Find the closing </ul> tag
                let closingTagStart = text.indexOf('</ul>', i);

                if (closingTagStart !== -1) {
                  // Render the entire <ul>...</ul> structure instantly
                  let fullUlHtml = text.substring(i, closingTagStart + 5); // +5 for length of </ul>
                  element.innerHTML += fullUlHtml;

                  // Set index i to after the closing tag
                  i = closingTagStart + 5;
                  delay = 1; // Tiny delay before next Qtext character 
                } else {
                  element.innerHTML += tagContent;
                  i = tagEnd + 1;
                  delay = 1;
                }
              } else if (tagContent.startsWith('<script')) {
                console.log("<script> tag detected at index " + i);
                let scriptEnd = text.indexOf('</script>', i);
                if (scriptEnd !== -1) {
                  // Extract body: everything between the opening tag's closing > and </script>
                  let scriptBodyContentStart = text.indexOf('>', i) + 1;
                  let scriptBody = text.substring(scriptBodyContentStart, scriptEnd);

                  // Execute script immediately
                  try {
                    const scriptElement = document.createElement('script');
                    scriptElement.textContent = scriptBody;
                    document.body.appendChild(scriptElement);
                    document.body.removeChild(scriptElement);
                    console.log("Successfully executed script from qtext typewriter loop.");
                  } catch (err) {
                    console.error("Error executing script from qtext typewriter loop:", err);
                  }

                  // Skip index i to after the closing </script> tag
                  i = scriptEnd + 9;
                  delay = 1; // Tiny delay before next Qtext character
                } else {
                  // Fallback for an unmatched opening tag (treat as a simple tag)
                  element.innerHTML += tagContent;
                  i = tagEnd + 1;
                  delay = 1;
                }
              } else {
                console.log("Non-button/list HTML tag detected at index " + i);
                // If not a button, treat as a simple tag (e.g., <b>, <br>)
                element.innerHTML += tagContent;
                i = tagEnd + 1;
                delay = 1;
              }
            }
          } else if (char === '\\') {
            if (text.charAt(i + 1) === '(') {
              // LaTeX inline math start
              let mathEnd = text.indexOf('\\)', i + 2);
              if (mathEnd !== -1) {
                let mathContent = text.substring(i, mathEnd + 2);
                element.innerHTML += mathContent;
                i = mathEnd + 2;
                delay = 1; // Tiny delay before next Qtext character
                safeTypeset();
              } else {
                // No closing found, treat as normal characters
                element.innerHTML += char;
                i++;
              }
            } else if (text.charAt(i + 1) === '[') {
              // LaTeX display math start
              let mathEnd = text.indexOf('\\]', i + 2);
              if (mathEnd !== -1) {
                let mathContent = text.substring(i, mathEnd + 2);
                element.innerHTML += mathContent;
                i = mathEnd + 2;
                delay = 1; // Tiny delay before next Qtext character
                safeTypeset();
              } else {
                // No closing found, treat as normal characters
                element.innerHTML += char;
                i++;
              }
            } else {
              // Just a backslash, append it
              element.innerHTML += char;
              i++;
            }
          } else {
            // Append regular character
            element.innerHTML += char;
            i++;
          }
          // Scroll instantly to bottom so user sees new text
          scrollToBottom(false);

          // Assign the ID returned by setTimeout, using the delay (1ms for tags, 'speed' for chars)
          typingTimeoutId = setTimeout(type, delay);
        } else {
          // Typing finished naturally
          currentTypingContext.finished = true;
          typingTimeoutId = null;
          scrollToBottom(true);
          callback();
          resolve();
          console.log("Typing complete, callback executed");
        }
        console.log("character typed");
      }
      type();
      safeTypeset();
      console.log("typeWriter finished");
    });
    // Attach the context to the promise so we can check it later
    promise.context = currentTypingContext;
    return promise;
  }

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid) {
    console.log("parseinput called with inputstring=" + inputstring + " and currentdivid=" + currentdivid);

    if (inputstring) {
    }
    else {
      if (currentdivid == "initial") {
        return [findnode("initial").text, "atomscover"];
      } else {
        inputstring = 'default';
        console.log("inputstring was empty or null, set to 'default'");
      }
    }
    if (!JSdata) return ['Loading...', currentdivid];
    const currentobj = findnode(currentdivid);
    if (!currentobj) return ['Unknown node', currentdivid];

    // Ensure `text` exists on the current object to avoid undefined errors
    if (typeof currentobj.text === 'undefined') {
      currentobj.text = '';
    }

    let output = '';
    let nextdivid = currentdivid;

    // handle special commands
    if (inputstring.startsWith("_auto_jump_")) {
      const targetId = inputstring.replace("_auto_jump_", "");
      historyStack.push(currentdivid);
      const targetNode = findnode(targetId);
      return [targetNode ? targetNode.text : "Error jumping", targetId];
    } else if (decode(inputstring).toLowerCase().startsWith("take out ")) {
      const query = decode(inputstring).substring(9).trim().toLowerCase();
      // Helper to strip HTML tags for name comparison
      const stripHtml = (html) => {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
      };

      const item = window.itemsData.find(i => {
        const idMatch = i.id.toLowerCase() === query;
        const nameMatch = stripHtml(i.name).toLowerCase() === query;
        return idMatch || nameMatch;
      });

      if (item) {
        window.pickup(item.id);
        return ["Added " + item.id + " to your inventory.", currentdivid];
      } else {
        return ["Item not found.", currentdivid];
      }
    } else if (decode(inputstring).toLowerCase().startsWith("drop ")) {
      const query = decode(inputstring).substring(5).trim().toLowerCase();
      // Helper to strip HTML tags for name comparison
      const stripHtml = (html) => {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
      };

      const item = window.itemsData.find(i => {
        const idMatch = i.id.toLowerCase() === query;
        const nameMatch = stripHtml(i.name).toLowerCase() === query;
        return idMatch || nameMatch;
      });

      if (item) {
        if (window.inventory[item.id]) {
          window.removeInventory(item.id, 1);
          return ["Dropped " + item.id + " from your inventory.", currentdivid];
        } else {
          return ["You don't have " + item.id + " in your inventory.", currentdivid];
        }
      } else {
        return ["Item not found.", currentdivid];
      }
    } else if (inputstring == "help") {
      return [helpText || 'Loading help... please wait', currentdivid];
      // } else if (inputstring == "condensed") {
      //   JSdata = textbookdata;
      //   currentdivid = "atomscover";
      //   return [findnode(currentdivid).text || 'Loading condensed... please wait', currentdivid];
      // } 
    } else if (inputstring == "narrative") {
      JSdata = narrativedata;
      outlineText = narrativeoutlineText;
      isNarrativeMode = true; // Flag for inventory tracking
      currentdivid = "atomscover";
      const uiTopLeft = document.getElementById('ui-top-left');
      if (uiTopLeft) uiTopLeft.style.display = 'flex';

      const hpContainer = document.getElementById('hp-container');
      if (hpContainer) hpContainer.style.display = 'flex';

      const invSidebar = document.getElementById('inventory-sidebar');
      if (invSidebar) invSidebar.style.display = '';
      return [findnode("atomscover").text || 'Loading narrative... please wait', "atomscover"];
    } else if (inputstring == "outline") {
      return [outlineText || 'Loading outline... please wait', currentdivid];
    } else if (inputstring == "undo") {
      if (historyStack.length > 0) {
        nextdivid = historyStack.pop();
        output = findnode(nextdivid) ? (findnode(nextdivid).text || '') : 'Previous not found';
      } else {
        output = "Nothing to undo.";
        nextdivid = currentdivid;
      }
      wrongcounter = 0;
    } else if (inputstring == "hint") {
      if (hintcount === 1) {
        if (currentobj.hint != null && currentobj.hint != '') {
          output = currentobj.hint;
        }
        else {
          output = 'No hint available';
        }
        hintcount++;
      }
      else if (hintcount === 2) {
        if (currentobj.hint2 != null && currentobj.hint2 != '') {
          output = currentobj.hint2;
        }
        else {
          output = 'No hint available';
        }
        hintcount = 1;
      }
      else {
        output = 'No hint available';
        hintcount = 1;
      }
    } else if (inputstring == "periodic table") {
      output = "<img src = 'images/periodic-table" + periodictableversion + ".png'> Source: <a href='https://ptable.com/'>ptable.com</a>"
    } else if (inputstring == "launch lab") {
      launch(currentlab);
      output = "Launching lab '" + currentlab + "'...";
    } else if (inputstring == "close lab") {
      closelab();
      output = "Closing lab...";
    } else if (inputstring == "default" && outlineclicked === false) {
      // allow user to press enter and skip typing animation
      currentTypingContext.finish();
      console.log("Input empty, typing interrupted");
      return ['interrupt', currentdivid];
      // handle normal input
    } else if (inputstring == 'default' && outlineclicked === true) {
      console.log("Jumping");
      outlineclicked = false;
      wrongcounter = 0;
      return [findnode(currentid).text, currentid];
    } else if (currentobj.type === 'frq') {
      inputstring = inputstring.trim();
      if (inputstring == currentobj.correct || inputstring == currentobj.altcorrect) {
        historyStack.push(currentdivid);
        nextdivid = currentobj.next;
        const nextobj = findnode(nextdivid);
        output = nextobj ? (nextobj.text || '') : 'Oops. I couldn\'t find the next part. Looks like you found a bug!';
        wrongcounter = 0;
      } else {
        if (wrongcounter >= 4) {
          output = 'It seems like you\'re having some trouble with this question. Don\'t worry, it happens to everyone! The answer is ' + currentobj.correct + '.';
          wrongcounter = 0;
        }
        else {
          output = 'Oops. That didn\'t seeem to be exactly right. But that\'s okay; we all make mistakes! Check your answer and try again :) Remember to spell/format your answer correctly! For more information on formatting, type \'help\'. If you need a hint, type \'hint\'.';
          wrongcounter++;
        }
      }
    } else if (currentobj.type === 'fr') {
      historyStack.push(currentdivid);
      nextdivid = currentobj.next;
      const nextobj = findnode(nextdivid);
      output = nextobj ? (nextobj.text || '') : 'Oops. I couldn\'t find the next part. Looks like you found a bug!';
    } else if (currentobj.type === 'mcq') {
      inputstring = inputstring.trim();
      let targetNodeId = null;

      if (inputstring == "1") targetNodeId = currentobj.op1;
      else if (inputstring == "2") targetNodeId = currentobj.op2;
      else if (inputstring == "3") targetNodeId = currentobj.op3;
      else if (inputstring == "4") targetNodeId = currentobj.op4;

      // Safe check for direct ID match
      if (!targetNodeId) {
        if (currentobj.op1 && inputstring.toLowerCase() == currentobj.op1.toLowerCase()) targetNodeId = currentobj.op1;
        else if (currentobj.op2 && inputstring.toLowerCase() == currentobj.op2.toLowerCase()) targetNodeId = currentobj.op2;
        else if (currentobj.op3 && inputstring.toLowerCase() == currentobj.op3.toLowerCase()) targetNodeId = currentobj.op3;
        else if (currentobj.op4 && inputstring.toLowerCase() == currentobj.op4.toLowerCase()) targetNodeId = currentobj.op4;

        // Text match (extract options from HTML)
        if (!targetNodeId && currentobj.text) {
          try {
            const doc = new DOMParser().parseFromString(currentobj.text, 'text/html');
            const listItems = doc.querySelectorAll('ol li');
            for (let i = 0; i < listItems.length; i++) {
              const optionText = listItems[i].textContent.trim();
              if (inputstring.trim().toLowerCase() === optionText.toLowerCase()) {
                const opKey = 'op' + (i + 1);
                if (currentobj[opKey]) {
                  targetNodeId = currentobj[opKey];
                }
                break;
              }
            }
          } catch (e) {
            console.log("Error parsing options text: " + e);
          }
        }
      }

      if (targetNodeId) {
        historyStack.push(currentdivid);
        nextdivid = targetNodeId;
        console.log(nextdivid);
      } else {
        if (["1", "2", "3", "4"].includes(inputstring)) {
          output = 'That option is not available. Please choose a valid number.';
        } else {
          console.log("Unrecognized answer choice: " + inputstring);
          output = 'Hmmmm...that doesn\'t seem to be an answer choice. Please enter the number corresponding to your choice, and try again.';
        }
        nextdivid = currentdivid;
        return [output, nextdivid];
      }
      output = findnode(nextdivid) ? (findnode(nextdivid).text || '') : 'Oops. I couldn\'t find the next part. Looks like you found a bug!';
    } else {
      output = 'Oops! Looks like you found a bug! I guess I messed up when writing the question...';
      nextdivid = currentdivid;
    }
    console.log("parseinput returned output=" + output + " and nextdivid=" + nextdivid);
    return [output, nextdivid];
  }
  function launch(labid) {
    currentlab = labid;
    console.log("launching lab: " + labid);
    const chatContainer = document.getElementById('chat-container');
    const labContainer = document.getElementById('lab-container');
    const formElement = document.getElementById('responseform');

    const invSidebar = document.getElementById('inventory-sidebar');
    const invTrigger = document.getElementById('inventory-trigger');

    chatContainer.classList.add('shifted');
    labContainer.classList.add('visible');
    formElement.classList.add('shifted-form');

    // Move Inventory Sidebar to Lab Container
    if (invSidebar) {
      invSidebar.classList.remove('desktop-only');
      invSidebar.style.position = 'static';
      invSidebar.style.width = '100%';
      invSidebar.style.marginTop = '20px';
      invSidebar.style.display = 'block'; // Force display in Lab
      labContainer.appendChild(invSidebar);
    }
    if (invTrigger) invTrigger.style.display = 'none';

    // Clear any previous lab content
    // Note: Do NOT clear labContainer.innerHTML blindly because we just appended inventory-sidebar
    // Instead, clear children EXCEPT inventory-sidebar
    const children = Array.from(labContainer.children);
    children.forEach(child => {
      if (child.id !== 'inventory-sidebar') {
        labContainer.removeChild(child);
      }
    });

    // Close Button
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '&#10006;'; // X symbol
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.width = '30px';
    closeBtn.style.height = '30px';
    closeBtn.style.lineHeight = '30px';
    closeBtn.style.textAlign = 'center';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#555';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.zIndex = '1000';
    closeBtn.title = "Close Lab";
    closeBtn.onmouseover = () => { closeBtn.style.color = 'black'; };
    closeBtn.onmouseout = () => { closeBtn.style.color = '#555'; };
    closeBtn.onclick = () => closelab();
    labContainer.appendChild(closeBtn);

    // Ensure inventory is last, so prepend table
    // Create lab table
    const labTable = document.createElement('div');
    labTable.className = 'lab-table';
    labContainer.insertBefore(labTable, invSidebar);

    // Create toolbox
    const toolbox = document.createElement('div');
    toolbox.className = 'toolbox';
    labContainer.insertBefore(toolbox, invSidebar);

    // Reaction info container
    const reactionInfoContainer = document.createElement('div');
    reactionInfoContainer.id = 'reaction-info-container';
    reactionInfoContainer.style.textAlign = 'center';
    reactionInfoContainer.style.marginTop = '10px';
    labContainer.insertBefore(reactionInfoContainer, invSidebar);

    const showReactionBtn = document.createElement('button');
    showReactionBtn.className = 'lab-item tool';
    showReactionBtn.innerHTML = 'Show Reaction';
    reactionInfoContainer.appendChild(showReactionBtn);

    const reactionNameDisplay = document.createElement('div');
    reactionNameDisplay.id = 'reaction-name-display';
    reactionNameDisplay.style.marginTop = '10px';
    reactionNameDisplay.style.fontWeight = 'bold';
    reactionNameDisplay.style.minHeight = '1.2em';
    reactionInfoContainer.appendChild(reactionNameDisplay);

    // Add elements to lab table
    const flask = document.createElement('div');
    flask.className = 'lab-item flask';

    const flaskWrapper = document.createElement('div');
    flaskWrapper.style.position = 'relative';
    flaskWrapper.style.display = 'inline-block';

    const flaskSolid = document.createElement('div');
    flaskSolid.id = 'flask-solid';
    flaskSolid.style.position = 'absolute';
    flaskSolid.style.bottom = '14.5%';
    flaskSolid.style.left = '0';
    flaskSolid.style.width = '0';
    flaskSolid.style.height = '0';
    flaskSolid.style.backgroundColor = 'transparent';
    flaskSolid.style.zIndex = '1';
    flaskSolid.style.borderRadius = '0';
    flaskSolid.style.opacity = '0';
    flaskSolid.style.transition = 'opacity 2s ease-in-out, height 2s ease-in-out, background 2s ease-in-out, background-color 2s ease-in-out, border-radius 2s ease-in-out, clip-path 2s ease-in-out, width 0s ease-in-out, left 0s ease-in-out, bottom 0s ease-in-out';
    flaskWrapper.appendChild(flaskSolid);

    const flaskGas = document.createElement('div');
    flaskGas.id = 'flask-gas';
    flaskGas.style.position = 'absolute';
    flaskGas.style.bottom = '60%'; // Positioned to float above/around neck
    flaskGas.style.left = '10%';
    flaskGas.style.width = '80%';
    flaskGas.style.height = '80%';
    flaskGas.style.backgroundColor = 'transparent';
    flaskGas.style.zIndex = '1';
    flaskGas.style.opacity = '0';
    flaskGas.style.transition = 'all 2s ease-in-out';
    flaskGas.style.maskImage = "url('images/gas.png')";
    flaskGas.style.webkitMaskImage = "url('images/gas.png')";
    flaskGas.style.maskSize = "contain";
    flaskGas.style.webkitMaskSize = "contain";
    flaskGas.style.maskRepeat = "no-repeat";
    flaskGas.style.webkitMaskRepeat = "no-repeat";
    flaskGas.style.maskPosition = "center";
    flaskGas.style.webkitMaskPosition = "center";
    flaskWrapper.appendChild(flaskGas);

    const flaskLiquid = document.createElement('div');
    flaskLiquid.id = 'flask-liquid';
    flaskLiquid.style.position = 'absolute';
    flaskLiquid.style.bottom = '10%';
    flaskLiquid.style.left = '5%';
    flaskLiquid.style.width = '90%';
    flaskLiquid.style.height = '0%';
    flaskLiquid.style.backgroundColor = 'transparent';
    flaskLiquid.style.zIndex = '2';
    flaskLiquid.style.borderRadius = '0 0 10% 10%';
    flaskLiquid.style.clipPath = 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)';
    flaskLiquid.style.opacity = '0';
    flaskLiquid.style.transition = 'opacity 2s ease-in-out';
    flaskWrapper.appendChild(flaskLiquid);

    const flaskImage = document.createElement('img');
    flaskImage.src = 'images/flask.png';
    flaskImage.alt = 'Erlenmeyer Flask';
    flaskImage.style.position = 'relative';
    flaskImage.style.zIndex = '3'; // Ensure image is on top
    flaskWrapper.appendChild(flaskImage);

    flask.appendChild(flaskWrapper);
    labTable.appendChild(flask);

    // Temperature display div
    const tempDisplay = document.createElement('div');
    tempDisplay.id = 'temp-display';
    tempDisplay.style.marginTop = '10px';
    tempDisplay.style.fontWeight = 'bold';
    tempDisplay.style.textAlign = 'center';
    flask.appendChild(tempDisplay);

    // pH display div
    const phDisplay = document.createElement('div');
    phDisplay.id = 'ph-display';
    phDisplay.style.marginTop = '5px';
    phDisplay.style.fontWeight = 'bold';
    phDisplay.style.textAlign = 'center';
    flask.appendChild(phDisplay);

    // Container for beakers
    const beakersContainer = document.createElement('div');
    beakersContainer.className = 'beakers-container';
    labTable.appendChild(beakersContainer);

    let selectedBeakers = [];
    let currentTemperature = 298;
    let currentPH = 7.0;
    let currentReactionName = "";
    // Globals used instead of locals for product state
    // let currentProductType = null;
    // let currentProductColor = null;

    showReactionBtn.onclick = () => {
      if (reactionNameDisplay.innerHTML !== "") {
        reactionNameDisplay.innerHTML = "";
      } else {
        reactionNameDisplay.innerHTML = "Reaction: " + (currentReactionName || "None");
        safeTypeset([reactionNameDisplay]);
      }
    };

    const startCooling = () => {
      if (window.activeTempInterval) clearInterval(window.activeTempInterval);
      window.activeTempInterval = setInterval(() => {
        const ambientTemp = 298;
        const k = 0.002;
        const diff = currentTemperature - ambientTemp;
        if (Math.abs(diff) > 0.01) {
          currentTemperature -= k * diff;
        } else {
          currentTemperature = ambientTemp;
        }
        if (tempDisplay && tempDisplay.innerText !== "") {
          tempDisplay.innerText = "Temperature: " + currentTemperature.toFixed(1) + " K";
        }
      }, 1000);
    };

    startCooling();

    // Reusable Renderer
    const renderVisuals = (liquidColors, pType, pColor) => {
      // Solid Layer
      if (flaskSolid) {
        if (pType === 'solid') {
          flaskSolid.style.width = '50%';
          flaskSolid.style.height = '15%'; // Low pile
          flaskSolid.style.bottom = '14.5%';
          flaskSolid.style.left = '25%'; // Centered (100 - 50 / 2)
          flaskSolid.style.borderRadius = '0';
          flaskSolid.style.clipPath = 'polygon(5% 100%, 10% 85%, 18% 80%, 25% 70%, 32% 65%, 40% 55%, 50% 50%, 60% 55%, 68% 65%, 75% 70%, 82% 80%, 90% 85%, 95% 100%)';
          flaskSolid.style.background = pColor || 'rgba(255, 255, 255, 0.2)';
          flaskSolid.style.transitionDelay = '0s';
          flaskSolid.style.opacity = '1';
        } else {
          flaskSolid.style.transitionDelay = '0s';
          flaskSolid.style.opacity = '0';
        }
      }
      // Liquid Layer
      if (flaskLiquid) {
        if (liquidColors.length > 0) {
          // Reset dimensions in case they were morphed to solid
          // Static layout: flaskLiquid fixed at max visual size; clip-path reveals bottom-up to prevent child distortion.

          // Refined Geometry for PERFECTLY PARALLEL SIDES and NATURAL SMOOTH CORNERS:
          // Spacing: Perfectly equalized gaps on all sides (13% uniform).
          flaskLiquid.style.width = '74%';
          flaskLiquid.style.left = '13%';
          flaskLiquid.style.bottom = '14.5%';
          flaskLiquid.style.height = '82.5%';
          flaskLiquid.style.background = 'none';
          flaskLiquid.style.display = 'block';

          // Outer Shape (High-Fidelity 50-Point Polygon for Precision Alignment)
          // Refined: Absolute Parallel Precision (60.5% right, 39.5% left top) for flawless gap consistency.
          const staticShape = `polygon(
            44% 0%, 56% 0%,                       /* Neck Top */
            56% 20%, 56.5% 25%, 58% 30%, 61% 35%, 61% 40%, 51% 45%, /* Right Shoulder Flare & Parallel Start */
            100% 95%,                             /* Parallel Wall End */
            99.8% 97.5%, 99% 99%, 97% 99.8%, 91% 100%, 85% 100%,    /* Natural Right Corner */
            15% 100%, 9% 100%, 3% 99.8%, 1% 99%, 0.2% 97.5%, 0% 95%, /* Natural Left Corner */
            47% 45%,                            /* Parallel Wall Start & Flare End */
            39% 40%, 39% 35%, 42% 30%, 43.5% 25%, 44% 20%           /* Left Shoulder Flare */
          )`;
          flaskLiquid.style.clipPath = staticShape;
          flaskLiquid.style.borderRadius = '0';
          flaskLiquid.style.overflow = 'hidden';

          // Nested Level Clipper (Handles the "rise" without distorting the shape)
          let clipper = flaskLiquid.querySelector('.level-clipper');
          if (!clipper) {
            clipper = document.createElement('div');
            clipper.className = 'level-clipper';
            clipper.style.width = '100%';
            clipper.style.height = '100%';
            clipper.style.display = 'flex';
            clipper.style.flexDirection = 'column-reverse';
            flaskLiquid.appendChild(clipper);
          }

          const heightPerLiquid = 12.5;
          const fillPerc = Math.min(liquidColors.length * heightPerLiquid, 100);
          const targetClip = `inset(${100 - fillPerc}% 0 0 0)`;

          // Animate Level
          if (flaskLiquid.style.opacity === '0') {
            clipper.style.transition = 'none';
            clipper.style.clipPath = `inset(100% 0 0 0)`;
            void clipper.offsetWidth;
            clipper.style.transition = 'clip-path 1s ease-in-out';
            clipper.style.clipPath = targetClip;
          } else {
            clipper.style.transition = 'clip-path 1s ease-in-out';
            clipper.style.clipPath = targetClip;
          }

          // Render layers inside the clipper
          const currentLayers = Array.from(clipper.children);
          const layerHeight = heightPerLiquid + '%';

          liquidColors.forEach((color, i) => {
            let layer;
            if (i < currentLayers.length) {
              layer = currentLayers[i];
            } else {
              layer = document.createElement('div');
              layer.style.width = '100%';
              layer.style.flexShrink = '0';
              layer.style.transition = 'background-color 2s ease, height 1s ease';
              clipper.appendChild(layer);
            }
            layer.style.height = layerHeight;
            layer.style.backgroundColor = color;
          });

          while (clipper.children.length > liquidColors.length) {
            clipper.removeChild(clipper.lastChild);
          }

          flaskLiquid.style.opacity = '0.7';

          // Clear any artifacts from previous mask attempts
          flaskLiquid.style.maskImage = '';
          flaskLiquid.style.webkitMaskImage = '';

        } else {
          // No liquids
          flaskLiquid.style.opacity = '0';
          let clipper = flaskLiquid.querySelector('.level-clipper');
          if (clipper) clipper.style.clipPath = `inset(100% 0 0 0)`;
        }
      }

      // Gas Layer
      if (flaskGas) {
        if (pType === 'gas') {
          flaskGas.style.background = pColor || 'rgba(255, 255, 255, 0.2)';
          flaskGas.style.opacity = '1';
        } else {
          flaskGas.style.opacity = '0';
        }
      }
    };

    const labData = fullJSdata.labs.find(lab => lab.labid === labid);

    // Helper: Parse attributes for any item (Lab or Inventory)
    const getAttributes = (id) => {
      let attrData = null;
      let rawStr = null;

      if (typeof id === 'number') {
        // Lab Beaker
        if (labData && labData['attributes' + id]) {
          rawStr = labData['attributes' + id];
        }
      } else {
        // Inventory Item
        const item = window.itemsData.find(i => i.id === id);
        if (item && item.attributes) {
          if (typeof item.attributes === 'object') return item.attributes;
          rawStr = item.attributes;
        }
      }

      if (rawStr) {
        try {
          // Sanitize string to preserve backslashes for invalid escapes (like \ce)
          const sanitized = rawStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          return JSON.parse(sanitized);
        } catch (e) {
          console.error("Error parsing attributes for " + id, e);
        }
      }
      return null;
    };

    const getColors = (indices) => {
      return indices.map(idx => {
        const attr = getAttributes(idx);
        return (attr && attr.color) ? attr.color : 'rgba(255, 255, 255, 0.2)';
      });
    };

    const calculateMixPH = (indices) => {
      if (indices.length === 0) return null;

      let totalH = 0;

      indices.forEach(idx => {
        let ph = 7.0;
        const attr = getAttributes(idx);

        if (attr && attr.ph !== undefined) {
          ph = parseFloat(attr.ph);
        }

        const molesH = Math.pow(10, -ph);
        const molesOH = Math.pow(10, -(14 - ph));
        totalH += (molesH - molesOH);
      });

      const avgNetH = totalH / indices.length;

      if (avgNetH > 0) {
        return -Math.log10(avgNetH);
      } else if (avgNetH < 0) {
        const avgNetOH = -avgNetH;
        const pOH = -Math.log10(avgNetOH);
        return 14 - pOH;
      } else {
        return 7.0;
      }
    };

    const getFlaskState = (indices, excludeKey = null) => {
      let state = {
        ph: 7.0,
        temp: 298,
        reactionName: "",
        visualColors: [],
        productType: null,
        productColor: null,
        outcome: null,
        reactingIndices: [],
        reactionKey: null
      };

      if (indices.length === 0) return state;

      // pH
      const newPH = calculateMixPH(indices);
      if (newPH !== null) state.ph = newPH;

      // Reaction
      let outcome = null;
      let reactionData = null;
      let reactingIndices = [];

      if (labData && labData.reaction && indices.length >= 2) {
        try {
          // Use sanitized string safely
          const sanitizedReaction = labData.reaction.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          reactionData = JSON.parse(sanitizedReaction);
        } catch (e) {
          console.error("Error parsing reaction data:", e);
        }

        if (reactionData) {
          const getCombinations = (arr, size) => {
            let result = [];
            const f = (prefix, chars) => {
              for (let i = 0; i < chars.length; i++) {
                let newPrefix = [...prefix, chars[i]];
                if (newPrefix.length === size) {
                  result.push(newPrefix);
                } else {
                  f(newPrefix, chars.slice(i + 1));
                }
              }
            };
            f([], arr);
            return result;
          };

          // Prioritize LARGEST subset matches first (Greedy)
          for (let size = indices.length; size >= 2; size--) {
            const combos = getCombinations(indices, size);
            for (const combo of combos) {
              const key = combo.sort((a, b) => String(a).localeCompare(String(b))).join("_");
              if (reactionData[key]) {
                if (excludeKey && key === excludeKey) continue; // Skip known state
                outcome = reactionData[key];
                reactingIndices = combo;
                break;
              }
            }
            if (outcome) break;
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
            } else if (prod.type === 'gas' && primaryType !== 'solid') {
              primaryType = 'gas';
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
            else if (labData && labData['beaker' + idx]) id = labData['beaker' + idx];
          } else {
            // Inventory items: the id is the key used in reactingIndices
            id = idx;
          }
          if (id) reactantIds.push(id);
        });

        // Helper to strip LaTeX wrappers for the reaction string
        const cleanForReaction = (name) => {
          let s = name;
          // Recursively strip wrappers to handle nested cases like $$\ce{...}$$
          while (true) {
            let changed = false;
            // Remove wrapping $$
            if (s.startsWith('$$') && s.endsWith('$$')) {
              s = s.substring(2, s.length - 2);
              changed = true;
            }
            // Remove wrapping \ce{...}
            if (s.startsWith('\\ce{') && s.endsWith('}')) {
              s = s.substring(4, s.length - 1);
              changed = true;
            }
            // Remove wrapping \text{...} (if used)
            if (s.startsWith('\\text{') && s.endsWith('}')) {
              s = s.substring(6, s.length - 1);
              changed = true;
            }
            // Remove wrapping \(...\)
            if (s.startsWith('\\(') && s.endsWith('\\)')) {
              s = s.substring(2, s.length - 2);
              changed = true;
            }
            if (!changed) break;
          }
          return s;
        };

        const reactantsStr = reactantIds.map(cleanForReaction).join(" + ");
        const productsStr = productNames.map(cleanForReaction).join(" + ");

        state.reactionName = `$$\\ce{${reactantsStr} -> ${productsStr}}$$`;
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

      return state;
    };

    // --- Reaction Queue Globals ---
    let visualStack = []; // Array of { ids: [beakerId], color: string, type: 'liquid'/'solid'/'gas' }
    let reactionQueue = Promise.resolve();
    let processedBeakersCount = 0;
    let currentReactionScript = ""; // Global for addToInventory
    let currentProductName = ""; // Global for addToInventory name
    let currentProductType = "liquid"; // Global for type
    let currentProductColor = "white"; // Global for color
    let currentProducts = []; // Global array for multiple products
    const renderVisualStack = () => {
      // Map visualStack items to colors for the renderer
      const liquidColors = visualStack.filter(v => v.type === 'liquid' || !v.type).map(v => v.color);
      // Determine product type/color based on visualStack items (solid/gas presence).

      let pType = null;
      let pColor = null;

      // Check if any solid exists in stack
      // Check if any solid exists in stack
      const solidItem = visualStack.find(v => v.type === 'solid');
      if (solidItem) {
        pType = 'solid';
        pColor = solidItem.color;
      } else {
        // Check for gas
        const gasItem = visualStack.find(v => v.type === 'gas');
        if (gasItem) {
          pType = 'gas';
          pColor = gasItem.color;
        }
      }

      // Pass to renderer
      renderVisuals(liquidColors, pType, pColor);

      // Update displays to match visual state using current globals (which update upon reaction execution).

      if (tempDisplay && tempDisplay.innerText !== "") tempDisplay.innerText = "Temperature: " + currentTemperature.toFixed(1) + " K";
      if (phDisplay && phDisplay.innerText !== "") {
        if (liquidColors.length > 0 || pType === 'solid') { // Show pH if content
          phDisplay.innerText = "pH: " + currentPH.toFixed(1);
        } else {
          phDisplay.innerText = "pH: n/a";
        }
      }
      if (reactionNameDisplay && reactionNameDisplay.innerHTML !== "") {
        reactionNameDisplay.innerHTML = "Reaction: " + currentReactionName;
        if (typeof MathJax !== 'undefined') MathJax.typesetPromise([reactionNameDisplay]);
      }
    };

    const processLogicUpdates = () => {
      // Iterate through new beakers
      for (let i = processedBeakersCount + 1; i <= selectedBeakers.length; i++) {
        const subset = selectedBeakers.slice(0, i);
        // Check if new subset triggers a *new* reaction, ignoring valid reactions from previous subsets.
        const prevSubset = selectedBeakers.slice(0, i - 1);
        const prevState = getFlaskState(prevSubset);

        const state = getFlaskState(subset, prevState.reactionKey);

        // Robust detection: Check if reactionKey changed or became non-null.
        const newReaction = state.reactionKey && (!prevState.reactionKey || state.reactionKey !== prevState.reactionKey);

        if (newReaction) {
          // Schedule Reaction
          queueReaction(state);
        }
      }
      processedBeakersCount = selectedBeakers.length;
    };

    // Identify reacting IDs assuming the subset causing the reaction consumes its inputs.

    const queueReaction = (state) => {
      reactionQueue = reactionQueue.then(async () => {
        // Wait 2s
        await new Promise(r => setTimeout(r, 2000));

        // Identify Reagents & Products
        const idsToconsume = new Set(state.reactingIndices);
        let consumed = false;
        let totalLiquidLayersConsumed = 0;

        // Iterate visualStack to mark reactants and count liquid layers.
        visualStack.forEach((item, idx) => {
          const hasReactant = item.ids.some(id => idsToconsume.has(id));
          if (hasReactant) {
            consumed = true;
            // Count consumed volume
            if (item.type === 'liquid' || !item.type) {
              totalLiquidLayersConsumed++;
            }
          }
        });

        if (consumed) {
          const products = state.products || [];

          // If single legacy product exists but no array, wrap it
          if (products.length === 0 && state.productType) {
            products.push({
              type: state.productType,
              color: state.productColor
            });
          }

          // 1. Filter out tokens whose IDs were fully consumed.
          let newStack = visualStack.filter(token => {
            const intersection = token.ids.filter(id => idsToconsume.has(id)); // intersection with set
            // If any ID in token is being consumed, remove the token.
            // Simplification: if intersection > 0, remove.
            return intersection.length === 0;
          });

          // 2. Add ALL Products
          if (products.length > 0) {
            products.forEach(prod => {
              newStack.push({
                ids: [],
                color: prod.color,
                type: prod.type || 'liquid'
              });
            });
          }

          visualStack = newStack;
        }

        // Update Globals (Trigger Visual Change)
        currentPH = state.ph;
        currentTemperature = state.temp;
        currentReactionName = state.reactionName;
        currentProductName = state.productName || "";
        currentReactionScript = state.script || "";
        currentProductType = state.productType || 'liquid';
        currentProductColor = state.productColor || 'white';
        currentProducts = state.products || [];

        // Animate Flask
        flask.classList.add('flask-active');
        setTimeout(() => flask.classList.remove('flask-active'), 1000); // Shake

        renderVisualStack();

        // Trigger Conditional if applicable
        if (state.triggerConditional) {
          console.log("Reaction triggered conditional flag!");
          window.conditional = true;
        }

        return state;

      });
    };

    // --- Interaction ---
    const addLiquid = (id) => {
      // Calculate current LIQUID volume
      let volume = 0;
      visualStack.forEach(v => {
        if (v.type === 'liquid' || !v.type) volume++;
      });

      const attr = getAttributes(id);
      if (attr && attr.type === 'nonreactant') {
        console.log("Non-reactant item clicked, ignoring flask updates.");
        return false;
      }

      if (volume >= 4) {
        alert("Beaker full");
        return;
      }

      selectedBeakers.push(id);

      const colors = getColors([id]);
      let itemType = 'liquid';
      if (attr && attr.type) itemType = attr.type;

      // Immediate Visual Add
      if (colors.length > 0) {
        visualStack.push({
          ids: [id],
          color: colors[0],
          type: itemType
        });
      }

      // Immediate Render
      renderVisualStack();

      // Defer global updates to queue processing to ensure state matches visual timing.

      processLogicUpdates();
    };
    window.labAddLiquid = addLiquid ? addLiquid : null; // FIX: Expose globally
    console.log("Lab Launched. labAddLiquid set.");

    // Modified click loop (Replacing lines 977-1047)
    for (let i = 1; i <= 4; i++) {
      if (i > 2 && labData && !labData['beaker' + i]) continue;

      const beakerContainer = document.createElement('div');
      beakerContainer.className = 'lab-item beaker';
      // ... (Skipping visual creation boilerplate for brevity, assuming standard DOM) ...
      // Re-implementing the DOM creation fully to replace the block.

      const beakerWrapper = document.createElement('div');
      beakerWrapper.style.position = 'relative';
      beakerWrapper.style.display = 'flex';
      beakerWrapper.style.flexDirection = 'column';
      beakerWrapper.style.justifyContent = 'flex-end';
      beakerWrapper.style.alignItems = 'center';
      beakerWrapper.style.height = '120px'; // Slightly larger than beaker max-height (110px)
      beakerWrapper.style.width = '100%';

      const beakerImage = document.createElement('img');
      beakerImage.src = 'images/beaker.png';
      beakerImage.alt = `Beaker ${i}`;
      beakerImage.style.position = 'relative';
      beakerImage.style.zIndex = '2';

      const beakerAttributes = getAttributes(i);

      const fluidColor = (beakerAttributes && beakerAttributes.color) ? beakerAttributes.color : 'rgba(255, 255, 255, 0.2)';
      const itemType = (beakerAttributes && beakerAttributes.type) ? beakerAttributes.type : 'liquid';

      if (itemType === 'solid') {
        // Render as Solid Block
        const solidBlock = document.createElement('div');
        solidBlock.className = 'lab-item solid-block';
        solidBlock.style.backgroundColor = fluidColor;
        beakerWrapper.appendChild(solidBlock);
      } else {
        // Render as Beaker (Default)
        if (fluidColor) {
          const fluidDiv = document.createElement('div');
          fluidDiv.style.position = 'absolute';
          fluidDiv.style.bottom = '15%';
          fluidDiv.style.left = '15%';
          fluidDiv.style.width = '70%';
          fluidDiv.style.height = '50%';
          fluidDiv.style.backgroundColor = fluidColor;
          fluidDiv.style.zIndex = '1';
          fluidDiv.style.borderRadius = '0 0 10% 10%';
          beakerWrapper.appendChild(fluidDiv);
        }
        beakerWrapper.appendChild(beakerImage);
      }

      beakerContainer.appendChild(beakerWrapper);

      const beakerLabel = document.createElement('div');
      let labelText = (labData && labData['beaker' + i]) || `Beaker ${i}`;
      // Clean LaTeX for label (optional, but requested for cleanliness?) No, user asked to keep LaTeX generally but maybe prepending assumes clean text?
      // Actually user said "display the concentration in front". 
      // If name is "$$\ce{AgNO3}$$" and conc is "0.1 M", result: "0.1 M $$\ce{AgNO3}$$". This works fine with MathJax.

      if (beakerAttributes && beakerAttributes.concentration) {
        labelText = `${beakerAttributes.concentration} ${labelText}`;
      }
      beakerLabel.innerHTML = labelText;
      // Re-trigger MathJax for the label if needed (though usually processed globally or by safeTypeset call if dynamic.
      // Launch usually happens once. We might need to ensure MathJax typesets this new dynamic content? 
      // Existing code doesn't seem to explicitly typeset these labels inside loop, relying on global render?
      // Wait, `labData` usually has LaTeX. If `launch` builds DOM, does it trigger typeset?
      // Check if there is a typeset call at end of launch.

      beakerContainer.appendChild(beakerLabel);

      const beakerIdx = i;
      beakerContainer.onclick = () => {
        console.log(`Beaker ${beakerIdx} clicked`);
        addLiquid(beakerIdx);
      };
      beakersContainer.appendChild(beakerContainer);
    }

    // Reset Logic
    const resetButton = document.createElement('div');
    resetButton.className = 'lab-item tool';
    resetButton.innerHTML = 'Reset';
    resetButton.onclick = () => {
      // Return items to inventory
      selectedBeakers.forEach(id => {
        if (typeof id === 'string') {
          if (inventory[id]) inventory[id]++;
          else inventory[id] = 1;
        }
      });
      renderInventory();

      selectedBeakers = [];
      visualStack = [];
      processedBeakersCount = 0;
      reactionQueue = Promise.resolve(); // Clear queue reference (old chains continue independently).
      // Reset queue logic (active jobs check selectedBeakers state).

      currentPH = 7.0;
      currentTemperature = 298;
      currentReactionName = "";
      renderVisualStack();
    };

    // Add To Inventory
    const addToInvBtn = document.createElement('div');
    addToInvBtn.className = 'lab-item tool';
    addToInvBtn.innerHTML = 'Add to 🎒';
    addToInvBtn.onclick = () => {
      // Find reaction name
      const reactionName = currentProductName; // Still used for check (concatenated name)

      // 1. Handle Product Addition
      // If we have a products array, use it. Fallback to legacy single globals if array is empty but name exists.

      const productsToAdd = (currentProducts && currentProducts.length > 0) ? currentProducts : [];
      // Fallback for single product (legacy)
      if (productsToAdd.length === 0 && currentProductName && currentProductName !== "Unknown Product") {
        productsToAdd.push({
          name: currentProductName,
          type: currentProductType || 'liquid',
          color: currentProductColor || 'white',
          script: currentReactionScript || ""
        });
      }

      if (productsToAdd.length > 0) {
        productsToAdd.forEach(prod => {
          const prodID = prod.id || "Unknown Product";
          const prodName = prod.name || prodID;
          if (prodID === "Unknown Product") return;

          // Look for existing item
          let item = window.itemsData.find(i => i.id === prodID);
          if (!item) {
            item = {
              id: prodID,
              name: prodName,
              use: prod.use || "Unknown",
              attributes: JSON.stringify({
                type: prod.type || 'liquid',
                color: prod.color || 'white',
                // pH/Temp might be uniform or specific. Use global/uniform for now from state.
                ph: prod.ph ? parseFloat(prod.ph) : currentPH,
                temp: prod.temp ? parseInt(prod.temp) : currentTemperature
              }),
              script: prod.script || ""
            };
            window.itemsData.push(item);
          }

          if (inventory[item.id]) inventory[item.id]++;
          else inventory[item.id] = 1;
        });
      }

      // 2. Return Unreacted Items & Clear Flask
      // ... (Rest of logic unchanged) ...
      const currentState = getFlaskState(selectedBeakers);
      const consumedIndices = currentState.reactingIndices || [];
      selectedBeakers.forEach((id, index) => {
        if (typeof id === 'string' && !consumedIndices.includes(index)) {
          if (inventory[id]) inventory[id]++;
          else inventory[id] = 1;
        }
      });

      // Clear Flask State
      selectedBeakers = [];
      visualStack = [];
      processedBeakersCount = 0;
      currentPH = 7.0;
      currentTemperature = 298;
      currentReactionName = "";
      currentReactionScript = "";
      currentProducts = []; // Clear
      renderVisualStack();
      renderInventory();
    };
    toolbox.appendChild(addToInvBtn);
    // ... (Keep other tools) ...

    if (typeof MathJax !== 'undefined') MathJax.typesetPromise();

    const thermometer = document.createElement('div');
    thermometer.className = 'lab-item tool';
    thermometer.innerHTML = 'Thermometer';
    thermometer.onclick = () => {
      if (tempDisplay.innerText !== "") { tempDisplay.innerText = ""; return; }
      tempDisplay.innerText = "Temperature: " + currentTemperature.toFixed(1) + " K";
    };
    toolbox.appendChild(thermometer);

    const phMeter = document.createElement('div');
    phMeter.className = 'lab-item tool';
    phMeter.innerHTML = 'pH Meter';
    phMeter.onclick = () => {
      if (phDisplay.innerText !== "") { phDisplay.innerText = ""; return; }
      if (visualStack.length > 0) {
        phDisplay.innerText = "pH: " + currentPH.toFixed(1);
      } else {
        phDisplay.innerText = "pH: n/a";
      }
    };
    toolbox.appendChild(phMeter);

    toolbox.appendChild(resetButton);
    scrollToBottom(true);
    setTimeout(() => scrollToBottom(true), 500);

  }
  window.launch = launch;

  function closelab() {
    console.log("closing lab");
    const chatContainer = document.getElementById('chat-container');
    const labContainer = document.getElementById('lab-container');
    const formElement = document.getElementById('responseform');

    chatContainer.classList.remove('shifted');
    labContainer.classList.remove('visible');
    formElement.classList.remove('shifted-form');

    if (activeTempInterval) {
      clearInterval(activeTempInterval);
      activeTempInterval = null;
    }

    const invSidebar = document.getElementById('inventory-sidebar');
    const invTrigger = document.getElementById('inventory-trigger');
    const uiTopLeft = document.getElementById('ui-top-left');

    if (invSidebar) {
      invSidebar.classList.add('desktop-only');
      invSidebar.style.position = '';
      invSidebar.style.width = '';
      invSidebar.style.marginTop = '';
      // Conditional hiding based on mode
      if (isNarrativeMode) {
        invSidebar.style.display = 'block'; // Restore default (CSS handles it, or block)
        if (uiTopLeft) uiTopLeft.appendChild(invSidebar); // Move under HP bar
      } else {
        invSidebar.style.display = 'none';
        document.body.appendChild(invSidebar);
      }
    }
    if (invTrigger) invTrigger.style.display = '';

    window.labAddLiquid = null;
  }
  window.closelab = closelab;

  window.useItem = function (itemId) {
    // Check if lab is open
    console.log("useItem called for " + itemId + ". LabOpen: " + !!window.labAddLiquid);
    if (window.labAddLiquid) {
      if (inventory[itemId] > 0) {
        const result = window.labAddLiquid(itemId);
        if (result !== false) {
          inventory[itemId]--;
          if (inventory[itemId] <= 0) delete inventory[itemId];
          renderInventory(); // Refresh UI
        }
      }
      return;
    }

    const item = window.itemsData.find(i => i.id === itemId);
    if (item && inventory[itemId] > 0) {
      // Execute script
      try {
        const func = new Function(item.script);
        func();

        // Decrement logic
        inventory[itemId]--;
        if (inventory[itemId] <= 0) {
          delete inventory[itemId];
        }

        // Update Displays
        updateHPDisplay();
        renderInventory();

      } catch (e) {
        console.error("Error using item:", e);
      }
    }
  };

  // update the game
  async function updategame(e) {
    console.log("updategame called");
    // prevent form submission from reloading the page
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // if typing in progress, stop it
    if (currentTypingContext && !currentTypingContext.finished) {
      currentTypingContext.interrupted = true;
      currentTypingContext.finish();
      console.log('Typing interrupted by user.');
    }

    const userInput = inputField ? inputField.value : '';
    let [newText, nextId] = parseinput(userInput, currentid);
    currentid = nextId; // update currentid immediately to reflect any jumps
    inputField.value = '';

    // append only the user's response to the history (do not re-insert the previous question text)
    // SKIP history if it's an auto-jump command
    if (previousdiv && !userInput.startsWith("_auto_jump_")) {
      if (userInput.trim() !== '') {
        const container = document.createElement('div');
        container.className = 'response';
        container.innerHTML = `<div>${decode(encodeURIComponent(userInput))}</div>`;
        // insert the container just before the form so it appears in history
        if (formElement && previousdiv === formElement.parentNode) {
          previousdiv.insertBefore(container, formElement);
        } else {
          previousdiv.appendChild(container);
        }
      }
    }
    // Conditional Wait Logic
    const currentNodeObj = findnode(currentid);
    if (currentNodeObj && currentNodeObj.conditional === 1 && window.conditional !== true) {
      console.log("Waiting for conditional triggers...");
      if (inputField) {
        inputField.disabled = true;
        inputField.placeholder = "Waiting...";
      }
      const condCheckInterval = setInterval(() => {
        if (window.conditional === true) {
          clearInterval(condCheckInterval);
          if (inputField) {
            inputField.disabled = false;
            inputField.placeholder = "";
            inputField.focus();
          }
          // Force re-render as if jumped
          outlineclicked = true;
          updategame();
          window.conditional = false;
        }
      }, 500);
      return;
    }

    let splitnewText = newText.split("--");
    const newContainer = document.createElement('div');
    // insert newText above the form as a question element
    if (formElement) {
      if (splitnewText[0] == 'interrupt') {
        console.log("interrupt detected, no new question rendered");
        if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
        return;
      } else {
        previoustext = newText;
        formElement.parentNode.insertBefore(newContainer, formElement);
        previouscontainer = newContainer;
        for (var j = 0; j < splitnewText.length;) {
          const newTextDiv = document.createElement('div');
          newTextDiv.className = 'question';

          // cleanup function to run after typing is done
          const finishQuestionTyping = () => {
            // reload html 
            newTextDiv.innerHTML = splitnewText[j];
            runScripts(newTextDiv);
            newTextDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
            scrollToBottom(true);
            ready = true;
            j++;

            // --- ROLL TYPE HANDLING ---
            const currentNode = findnode(currentid);
            if (currentNode && currentNode.type === 'roll') {
              // Execute Roll
              let result = false;
              try {
                result = eval(currentNode.roll);
              } catch (e) { console.error("Roll failed:", e); }

              // Wait for animation (approx 2s + buffer)
              setTimeout(() => {
                const nextTarget = result ? currentNode.success : currentNode.fail;
                if (inputField) {
                  inputField.value = "_auto_jump_" + nextTarget;
                  updategame();
                }
              }, 2200);
            }
          };
          console.log("Typing part " + j + ": " + splitnewText[j]);
          newContainer.appendChild(newTextDiv);
          newContainer.appendChild(emptyLine.cloneNode(true));
          const p = typeWriter(newTextDiv, splitnewText[j], typespeed, finishQuestionTyping);
          await p;

          if (p.context && p.context.interrupted) {
            console.log("Segment loop interrupted.");

            // Restore interrupted roll logic
            const currentNode = findnode(currentid);
            if (currentNode && currentNode.type === 'roll') {
              console.log("Interrupted roll question detected, executing roll.");
              let result = false;
              try {
                result = eval(currentNode.roll);
              } catch (e) { console.error("Roll failed:", e); }

              setTimeout(() => {
                const nextTarget = result ? currentNode.success : currentNode.fail;
                if (inputField) {
                  inputField.value = "_auto_jump_" + nextTarget;
                  updategame();
                }
              }, 2200);
            }
            break;
          }

          if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
        }
      }
    }
    if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
    console.log("updategame completed");
  }

  function spawnFallingHearts(count) {
    const heartIcon = document.getElementById('hp-heart-icon');
    if (!heartIcon) return;

    const rect = heartIcon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Limit the number of hearts to avoid performance issues if loss is huge
    const heartsToSpawn = Math.min(count, 20);

    for (let i = 0; i < heartsToSpawn; i++) {
      const heart = document.createElement('div');
      heart.className = 'falling-heart';
      heart.innerText = '❤️';

      // Randomize initial position slightly around the center
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      heart.style.left = (centerX + offsetX) + 'px';
      heart.style.top = (centerY + offsetY) + 'px';

      document.body.appendChild(heart);

      // Remove the heart after animation finishes
      heart.addEventListener('animationend', () => {
        heart.remove();
      });
    }
  }

  // Inventory System
  window.pickup = function (itemId) {
    if (!window.itemsData) return;
    const item = window.itemsData.find(i => i.id === itemId);
    if (item) {
      if (inventory[itemId]) {
        inventory[itemId]++;
      } else {
        inventory[itemId] = 1;
      }
      renderInventory();
    } else {
      console.warn('Item not found:', itemId);
    }
  };

  window.removeInventory = function (itemId, number) {
    if (!inventory[itemId]) return;

    if (number === "all") {
      delete inventory[itemId];
    } else {
      const count = parseInt(number);
      if (!isNaN(count)) {
        inventory[itemId] -= count;
        if (inventory[itemId] <= 0) delete inventory[itemId];
      }
    }
    renderInventory();
  };

  function renderInventory() {
    const listDesktop = document.getElementById('inventory-list');
    const listMobile = document.getElementById('inventory-list-mobile');

    // Helper to generate HTML
    const generateHtml = () => {
      let html = '';
      for (const [itemId, count] of Object.entries(inventory)) {
        if (count > 0) {
          const item = window.itemsData.find(i => i.id === itemId);
          if (item) {
            html += `<button class="inventory-item-btn" onclick="useItem('${itemId}')" oncontextmenu="event.preventDefault(); machine('${itemId}')">
              ${count > 1 ? count + 'x ' : '1x '}${item.id}
            </button>`;
          }
        }
      }
      return html || '<div style="color: var(--muted); font-size: 0.9em;">Empty</div>';
    };

    const htmlContent = generateHtml();
    if (listDesktop) listDesktop.innerHTML = htmlContent;
    if (listMobile) listMobile.innerHTML = htmlContent;
    MathJax.typesetPromise();
  }

  window.machine = function (itemId) {
    if (window.machineon) {
      const item = window.itemsData.find(i => i.id === itemId);
      if (item) {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'question';
        let response = "Name: " + item.name + "<br>";
        response += "Usage: " + item.use;
        responseDiv.innerHTML = response;
        document.getElementById('previous').appendChild(responseDiv);
        document.getElementById('previous').appendChild(emptyLine.cloneNode(true));
        scrollToBottom();
        MathJax.typesetPromise();
      }
    }
  };



  // Mobile Inventory Toggles
  const invTrigger = document.getElementById('inventory-trigger');
  const invModal = document.getElementById('inventory-modal');
  const invClose = document.querySelector('.close-modal');

  if (invTrigger && invModal) {
    invTrigger.onclick = () => {
      invModal.classList.toggle('hidden');
    };
    invClose.onclick = () => {
      invModal.classList.add('hidden');
    };
    invModal.onclick = (e) => {
      if (e.target === invModal) {
        invModal.classList.add('hidden');
      }
    };
  }
});




