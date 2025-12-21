let currentlab;

// once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

  // defining global variables
  const qtext = document.getElementById('text');
  const previousdiv = document.getElementById('previous');
  const formElement = document.getElementById('responseform');
  const inputField = document.getElementById('response');
  let currentid = "initial";
  let previousdivid = null;
  let JSdata = null;
  let fullJSdata = null;
  let helpText = '';
  let outlineText = '';
  let JSoutline = null;
  let currentTypingContext = null
  let typingTimeoutId = null;
  let outlineclicked = false;
  let previouscontainer = null
  let previoustext = ''
  let typespeed = 15;
  const emptyLine = document.createElement('div');
  emptyLine.className = 'spacer';
  let wrongcounter = 0;
  let periodictableversion = 1
  let hintcount = 1;
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

  window.roll = function (diceType, stat, dc, advantage) {
    window.rollingActive = true;
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

    const total = finalRoll + modifier;
    const passed = (typeof dc === 'number') ? total >= dc : null;

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
        window.rollingActive = false;

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


  currentlab = "reactions";

  // HP System
  window.playerHP = 100;
  window.maxHP = 100;
  const hpContainer = document.getElementById('hp-container');

  window.changeHP = function (amount) {
    if (amount < 0) {
      spawnFallingHearts(Math.abs(amount));
    }
    window.playerHP += amount;
    if (window.playerHP > window.maxHP) window.playerHP = window.maxHP;
    if (window.playerHP < 0) window.playerHP = 0;
    updateHPDisplay();
  };

  function updateHPDisplay() {
    if (hpContainer) {
      if (playerHP >= maxHP) {
        playerHP = maxHP;
      }
      hpContainer.innerHTML = `<span id="hp-heart-icon">❤️</span>: ${window.playerHP}/${window.maxHP}`;
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
      JSoutline = data.active_pchem_outline;
      if (data.items) {
        window.itemsData = data.items;
      }
      if (JSoutline) {
        outlineText = 'Click on a section to jump to it.<br>';
        for (const item of JSoutline) {
          outlineText += '<button class="outline" onclick="jumpTo(\'' + item.div + '\')">' + item.reference_num + ' ' + item.content + '</button><br>';
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
    previousdivid = currentid;
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
      textbookdata = data.pchem_nodes;
      narrativedata = data.narrative_nodes;
      JSdata = textbookdata;
      let initialText = findnode("initial").text;
      previoustext = initialText;
      let splitinitialText = initialText.split("--");
      if (qtext && qtext.parentNode) qtext.parentNode.removeChild(qtext);
      let newContainer = document.createElement('div');
      formElement.parentNode.insertBefore(newContainer, formElement);
      previouscontainer = newContainer;
      for (var j = 0; j < splitinitialText.length;) {
        const initialDiv = document.createElement('div');
        initialDiv.className = 'question';
        newContainer.appendChild(initialDiv);
        await typeWriter(initialDiv, splitinitialText[j], typespeed);
        initialDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
        initialDiv.innerHTML = splitinitialText[j];
        safeTypeset();
        j++;
      }
      // remove the original placeholder element if present so it doesn't duplicate
      console.log('Initial text rendered.')
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
    return new Promise(resolve => {
      console.log("typeWriter called");
      console.log("element= " + element);
      console.log("text= " + text);
      console.log("speed= " + speed);

      let i = 0;

      // reset typingTimeoutId
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
        console.log('Cleared existing typing timeout');
      }
      typingTimeoutId = null;
      currentTypingContext = null;

      // finish typing if form is resubmitted
      currentTypingContext = {
        element: element,
        text: text,
        finished: false,
        // A method to instantly finish the typing
        finish: function () {
          if (!this.finished) {
            // IMPORTANT: Immediately stop the pending timer
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
            formElement.parentNode.insertBefore(newContainer, formElement);
            for (var n = 0; n < splitnewText.length;) {
              console.log("Rendering interrupted text part " + n + ": " + splitnewText[n]);
              const newinterruptTextDiv = document.createElement('div');
              newinterruptTextDiv.className = 'question';
              newinterruptTextDiv.innerHTML = splitnewText[n];
              runScripts(newinterruptTextDiv);
              newContainer.appendChild(newinterruptTextDiv);
              newinterruptTextDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
              scrollToBottom(true);
              n++;
            }
            this.finished = true;
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
          if (window.rollingActive) {
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
  }

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid) {
    console.log("parseinput called with inputstring=" + inputstring + " and currentdivid=" + currentdivid);

    if (inputstring) {
    }
    else {
      inputstring = 'default';
      console.log("inputstring was empty or null, set to 'default'");
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
    if (inputstring == "help") {
      return [helpText || 'Loading help... please wait', currentdivid];
    } else if (inputstring == "condensed") {
      JSdata = textbookdata;
      currentdivid = "atomscover";
      return [findnode(currentdivid).text || 'Loading condensed... please wait', currentdivid];
    } else if (inputstring == "narrative") {
      JSdata = narrativedata;
      window.isNarrativeMode = true; // Flag for inventory tracking
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
      output = findnode(previousdivid) ? (findnode(previousdivid).text || '') : 'Previous not found';
      wrongcounter = 0;
      nextdivid = previousdivid;
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
      previousdivid = currentdivid;
      if (inputstring == currentobj.correct || inputstring == currentobj.altcorrect) {
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
      previousdivid = currentdivid;
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
        nextdivid = targetNodeId;
        previousdivid = currentdivid;
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
    let currentLiquidColors = [];
    let currentProductType = null;
    let currentProductColor = null;

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
          flaskSolid.style.width = '40%';
          flaskSolid.style.height = '25%';
          flaskSolid.style.bottom = '14.5%';
          flaskSolid.style.left = '30%';
          flaskSolid.style.borderRadius = '0';
          flaskSolid.style.clipPath = 'none';
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

    const getColors = (indices) => {
      return indices.map(idx => {
        let attr = null;
        if (typeof idx === 'number') {
          if (labData['attributes' + idx]) {
            try {
              // Sanitize string to preserve backslashes for invalid escapes (like \ce)
              const sanitizedAttributes = labData['attributes' + idx].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
              attr = JSON.parse(sanitizedAttributes);
            } catch (e) {
              console.error("Error parsing attributes for beaker " + idx, e);
            }
          }
        } else {
          // Inventory Item
          const item = window.itemsData.find(i => i.id === idx);
          if (item && item.attributes) {
            try {
              let parsedAttr;
              if (typeof item.attributes === 'string') {
                const sanitizedAttributes = item.attributes.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                parsedAttr = JSON.parse(sanitizedAttributes);
              } else {
                parsedAttr = item.attributes;
              }
              attr = parsedAttr;
            } catch (e) { console.error("Error parsing item attributes", e); }
          }
        }
        return (attr && attr.color) ? attr.color : 'rgba(255, 255, 255, 0.2)';
      });
    };

    const calculateMixPH = (indices) => {
      if (indices.length === 0) return null;

      let totalH = 0;

      indices.forEach(idx => {
        let ph = 7.0;
        let attr = null;
        if (typeof idx === 'number') {
          if (labData['attributes' + idx]) {
            try {
              const sanitizedAttributes = labData['attributes' + idx].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
              attr = JSON.parse(sanitizedAttributes);
            } catch (e) { console.error("Error parsing attributes for pH calc", e); }
          }
        } else {
          // Inventory item
          const item = window.itemsData.find(i => i.id === idx);
          if (item && item.attributes) {
            try {
              let parsedAttr;
              if (typeof item.attributes === 'string') {
                const sanitizedAttributes = item.attributes.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                parsedAttr = JSON.parse(sanitizedAttributes);
              } else {
                parsedAttr = item.attributes;
              }
              attr = parsedAttr;
            } catch (e) { console.error("Error parsing item attributes", e); }
          }
        }

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
              const key = combo.sort((a, b) => a - b).join("_");
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
      state.reactionKey = outcome ? reactingIndices.sort((a, b) => a - b).join('_') : null;

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
        if (typeof outcome === 'string') {
          if (outcome === 'solid') {
            prodType = 'solid';
            prodColor = reactionData.solidcolor;
          }
        } else {
          prodType = outcome.type;
          prodColor = outcome.color || reactionData.solidcolor;
        }

        if (outcome.temp || (reactionData.temp && prodType === 'solid')) {
          state.temp = parseInt(outcome.temp || reactionData.temp);
        }
        if (outcome.ph) state.ph = parseFloat(outcome.ph);

        // Format Reaction Name: $$\ce{Reactant1 + Reactant2 -> Product}$$
        let reactantNames = [];
        reactingIndices.forEach(idx => {
          let name = null;
          if (typeof idx === 'number') {
            if (labData && labData['beaker' + idx]) name = labData['beaker' + idx];
          } else {
            const item = window.itemsData.find(i => i.id === idx);
            if (item) name = item.name;
          }
          if (name) reactantNames.push(name);
        });

        const reactantsStr = reactantNames.join(" + ");
        const productsStr = (outcome && outcome.name) ? outcome.name : "Unknown Product";

        state.reactionName = `$$\\ce{${reactantsStr} -> ${productsStr}}$$`;
        state.productName = productsStr; // Store raw name for inventory
        state.script = (outcome && outcome.script) ? outcome.script : "";
      }

      if (prodType === 'liquid' && prodColor) {
        visualColors.push(prodColor);
      }

      state.visualColors = visualColors;
      state.productType = prodType;
      state.productColor = prodColor;

      return state;
    };

    // --- Reaction Queue Globals ---
    let visualStack = []; // Array of { ids: [beakerId], color: string, type: 'liquid'/'solid'/'gas' }
    let reactionQueue = Promise.resolve();
    let processedBeakersCount = 0;
    let currentReactionScript = ""; // Global for addToInventory

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
          const reactionData = {
            outcome: state.outcome,
            state: state,
            subsetIds: state.reactingIndices // Precise reactants
          };

          queueReaction(reactionData);
        }
      }
      processedBeakersCount = selectedBeakers.length;
    };

    // Identify reacting IDs assuming the subset causing the reaction consumes its inputs.

    const queueReaction = (rData) => {
      reactionQueue = reactionQueue.then(async () => {
        // Wait 2s
        await new Promise(r => setTimeout(r, 2000));

        // Perform Visual Update
        // Replace responding visualStack items with product (match by ID).

        const idsToconsume = new Set(rData.subsetIds);

        // Filter visualStack: consume participating items, retain non-participating ones.

        let newStack = [];
        let consumed = false;

        // We need to insert the Product *at the position of the first reactant*?
        let insertIdx = -1;

        let totalLiquidLayersConsumed = 0;
        let solidConsumed = false;

        // Iterate visualStack to mark reactants and count liquid layers.

        visualStack.forEach((item, idx) => {
          const hasReactant = item.ids.some(id => idsToconsume.has(id));
          if (hasReactant) {
            if (insertIdx === -1) insertIdx = idx;
            consumed = true;
            // Count consumed volume
            if (item.type === 'liquid' || !item.type) {
              totalLiquidLayersConsumed++;
            } else if (item.type === 'solid') {
              solidConsumed = true;
            }
          } else {
            newStack.push(item);
          }
        });

        if (consumed) {
          // Determine target layers: preserve volume for L+L, increase for S+L.

          let targetLayers = totalLiquidLayersConsumed;
          if (solidConsumed) targetLayers += 1;

          // Handle non-liquid products: solid/gas products have 0 volume layers.

          const prodType = rData.state.productType || 'liquid';

          if (prodType === 'liquid') {
            // Create N tokens of product
            const pColor = rData.state.productColor || rData.state.visualColors[0];

            // Ensure targetLayers >= 1 (unlikely scenario where S+S->L results in 0 layers).

            for (let k = 0; k < targetLayers; k++) {
              const prodToken = {
                ids: rData.subsetIds, // Shared ID reference
                color: pColor,
                type: 'liquid'
              };
              if (insertIdx !== -1) {
                newStack.splice(insertIdx + k, 0, prodToken);
                // Insert in order: splice consecutively at insertIdx.
              } else {
                newStack.push(prodToken);
              }
            }
          } else {
            // Solid/Gas Product
            const prodToken = {
              ids: rData.subsetIds,
              color: rData.state.productColor,
              type: prodType
            };
            if (insertIdx !== -1) newStack.splice(insertIdx, 0, prodToken);
            else newStack.push(prodToken);
          }

          visualStack = newStack;
        }

        // Update Globals (Trigger Visual Change)
        currentPH = rData.state.ph;
        currentTemperature = rData.state.temp;
        currentReactionName = rData.state.reactionName;
        currentProductName = rData.state.productName || ""; // Update global product name
        currentReactionScript = rData.state.script || ""; // Update global script
        currentProductType = rData.state.productType || 'liquid'; // Update global product type
        currentProductColor = rData.state.productColor || 'white'; // Update global product color
        currentProductType = rData.state.productType || 'liquid'; // Update global product type

        // Animate Flask
        flask.classList.add('flask-active');
        setTimeout(() => flask.classList.remove('flask-active'), 1000); // Shake

        renderVisualStack();

      });
    };

    // --- Interaction ---
    const addLiquid = (id) => {
      // Calculate current LIQUID volume
      let volume = 0;
      visualStack.forEach(v => {
        if (v.type === 'liquid' || !v.type) volume++;
      });

      if (volume >= 4) {
        alert("Beaker full");
        return;
      }

      selectedBeakers.push(id);

      const colors = getColors([id]);
      let itemType = 'liquid';

      if (typeof id === 'number') {
        // Parse type from attributes if available
        if (labData && labData['attributes' + id]) {
          try {
            const sanitizedAttributes = labData['attributes' + id].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
            const attr = JSON.parse(sanitizedAttributes);
            if (attr && attr.type) itemType = attr.type;
          } catch (e) { console.error(e); }
        }
      } else {
        // Inventory Item
        const item = window.itemsData.find(i => i.id === id);
        if (item && item.attributes) {
          try {
            // Check if it's already an object (if parsed by other logic) or string
            let attr;
            if (typeof item.attributes === 'string') {
              const sanitizedAttributes = item.attributes.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
              attr = JSON.parse(sanitizedAttributes);
            } else {
              attr = item.attributes;
            }
            if (attr && attr.type) itemType = attr.type;
          } catch (e) { console.error("Error parsing item attributes", e); }
        }
      }

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
    window.labAddLiquid = addLiquid; // Expose for useItem
    console.log("Lab Launched. window.labAddLiquid set.");

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

      let beakerAttributes = null;
      if (labData && labData['attributes' + i]) {
        try {
          const sanitizedAttributes = labData['attributes' + i].replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          beakerAttributes = JSON.parse(sanitizedAttributes);
        } catch (e) { console.error(e); }
      }

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
      beakerLabel.innerHTML = (labData && labData['beaker' + i]) || `Beaker ${i}`;
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
          if (window.inventory[id]) window.inventory[id]++;
          else window.inventory[id] = 1;
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
      const reactionName = currentProductName; // Use raw name (e.g. "Substance1")

      // 1. Handle Product Addition
      if (reactionName && reactionName !== "Unknown Reaction" && reactionName !== "") {
        // Look for existing item
        let item = window.itemsData.find(i => i.name === reactionName);
        if (!item) {
          let generatedId = reactionName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          item = {
            id: generatedId,
            name: reactionName,
            attributes: JSON.stringify({
              type: currentProductType || 'liquid',
              color: currentProductColor || 'white',
              ph: currentPH,
              temp: currentTemperature
            }),
            script: currentReactionScript || "" // Use the global script
          };
          window.itemsData.push(item);
        }

        if (window.inventory[item.id]) window.inventory[item.id]++;
        else window.inventory[item.id] = 1;
        alert(`Added ${reactionName} to inventory!`);
      } else {
        if (selectedBeakers.length > 0) alert("Returning content to inventory.");
        else alert("Flask is empty.");
      }

      // 2. Return Unreacted Items & Clear Flask
      // The simplest way to return unreacted items is to trigger the reset logic,
      // which iterates 'selectedBeakers' and returns any strings (inventory IDs) back to inventory.
      // Since we already added the Product (if any), consuming reactants is the tricky part.
      // BUT, 'selectedBeakers' still contains the reactants.
      // If we blindly reset, we get reactants back!
      // 'getFlaskState' knows what reacted.
      // To properly IMPLEMENT "consumed", we must filter selectedBeakers.
      // Re-calculate state to get reacting indices.
      const currentState = getFlaskState(selectedBeakers);
      const consumedIndices = currentState.reactingIndices || [];

      // Return items that were NOT consumed
      selectedBeakers.forEach((id, index) => {
        // If it's an inventory item (string) AND it is NOT in consumedIndices
        if (typeof id === 'string' && !consumedIndices.includes(index)) {
          if (window.inventory[id]) window.inventory[id]++;
          else window.inventory[id] = 1;
        }
      });

      // Clear Flask State (Consumed items are gone, Unreacted returned, Product added)
      selectedBeakers = [];
      visualStack = [];
      processedBeakersCount = 0;
      currentPH = 7.0;
      currentTemperature = 298;
      currentReactionName = "";
      currentReactionScript = "";
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

    if (window.activeTempInterval) {
      clearInterval(window.activeTempInterval);
      window.activeTempInterval = null;
    }

    const invSidebar = document.getElementById('inventory-sidebar');
    const invTrigger = document.getElementById('inventory-trigger');

    if (invSidebar) {
      invSidebar.classList.add('desktop-only');
      invSidebar.style.position = '';
      invSidebar.style.width = '';
      invSidebar.style.marginTop = '';
      // Conditional hiding based on mode
      if (window.isNarrativeMode) {
        invSidebar.style.display = ''; // Restore default (CSS handles it, or block)
      } else {
        invSidebar.style.display = 'none';
      }
      document.body.appendChild(invSidebar);
    }
    if (invTrigger) invTrigger.style.display = '';

    window.labAddLiquid = null;
  }
  window.closelab = closelab;

  window.useItem = function (itemId) {
    // Check if lab is open
    console.log("useItem called for " + itemId + ". LabOpen: " + !!window.labAddLiquid);
    if (window.labAddLiquid) {
      if (window.inventory[itemId] > 0) {
        window.labAddLiquid(itemId);
        window.inventory[itemId]--;
        if (window.inventory[itemId] <= 0) delete window.inventory[itemId];
        renderInventory(); // Refresh UI
      }
      return;
    }

    const item = window.itemsData.find(i => i.id === itemId);
    if (item && window.inventory[itemId] > 0) {
      // Execute script
      try {
        const func = new Function(item.script);
        func();

        // Decrement logic
        window.inventory[itemId]--;
        if (window.inventory[itemId] <= 0) {
          delete window.inventory[itemId];
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
      currentTypingContext.finish();
      console.log('Typing interrupted by user.');
    }

    const userInput = inputField ? inputField.value : '';
    let [newText, nextId] = parseinput(userInput, currentid);
    currentid = nextId; // update currentid immediately to reflect any jumps
    inputField.value = '';

    // append only the user's response to the history (do not re-insert the previous question text)
    if (previousdiv) {
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
        // insert an empty line after user input
        if (formElement && previousdiv === formElement.parentNode) {
          previousdiv.insertBefore(emptyLine, formElement);
        } else {
          previousdiv.appendChild(emptyLine);
        }
      }
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
          };
          console.log("Typing part " + j + ": " + splitnewText[j]);
          newContainer.appendChild(newTextDiv, formElement);
          newContainer.appendChild(emptyLine, formElement);
          await typeWriter(newTextDiv, splitnewText[j], typespeed, finishQuestionTyping);
          if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
        }
      }
    }
    if (typeof MathJax !== 'undefined') MathJax.typesetPromise();
    console.log("updategame completed");
  }

  window.spawnFallingHearts = function (count) {
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
      if (window.inventory[itemId]) {
        window.inventory[itemId]++;
      } else {
        window.inventory[itemId] = 1;
      }
      renderInventory();
    } else {
      console.warn('Item not found:', itemId);
    }
  };

  function renderInventory() {
    const listDesktop = document.getElementById('inventory-list');
    const listMobile = document.getElementById('inventory-list-mobile');

    // Helper to generate HTML
    const generateHtml = () => {
      let html = '';
      for (const [itemId, count] of Object.entries(window.inventory)) {
        if (count > 0) {
          const item = window.itemsData.find(i => i.id === itemId);
          if (item) {
            html += `<button class="inventory-item-btn" onclick="useItem('${itemId}')">
              ${count > 1 ? count + 'x ' : '1x '}${item.name}
            </button>`;
          }
        }
      }
      return html || '<div style="color: var(--muted); font-size: 0.9em;">Empty</div>';
    };

    const htmlContent = generateHtml();
    if (listDesktop) listDesktop.innerHTML = htmlContent;
    if (listMobile) listMobile.innerHTML = htmlContent;
  }



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


