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

  // preload help.txt
  fetch('help.txt')
    .then(response => response.text())
    .then(data => { helpText = data; })
    .catch(error => { console.error('Error loading help text:', error); });

  // preload outline.json
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      JSoutline = data.active_pchem_outline;
      if (JSoutline) {
        outlineText = 'Click on a section to jump to it.<br>';
        for (const item of JSoutline) {
          outlineText += '<button class="outline" onclick="jumpTo(\''+item.div+'\')">' +item.reference_num +' ' + item.content + '</button><br>';
        }
      }
    }).catch(error => {
      console.error('Error loading outline:', error);
    });
  
  function decode(encodedURIComponent){
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

  // load data from json and render initial prompt
  fetch('data.json')
    .then(response => response.json())
    .then(async data => {
      fullJSdata = data;
      JSdata = data.pchem_nodes;
      let initialText = findnode("initial").text;
      previoustext= initialText;
      let splitinitialText = initialText.split("--");
      if (qtext && qtext.parentNode) qtext.parentNode.removeChild(qtext);
      let newContainer = document.createElement('div');
      formElement.parentNode.insertBefore(newContainer, formElement);
      previouscontainer = newContainer;
      for (var j=0; j<splitinitialText.length;) {
        const initialDiv = document.createElement('div');
        initialDiv.className = 'question';
        newContainer.appendChild(initialDiv);
        await typeWriter(initialDiv, splitinitialText[j], typespeed);
        initialDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
        initialDiv.innerHTML = splitinitialText[j];
        MathJax.typeset();
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
  function typeWriter(element, text, speed, callback = () => {}) {
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
      finish: function() {
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
            for (var n=0; n<splitnewText.length;) {
              console.log("Rendering interrupted text part " + n + ": " + splitnewText[n]);
              const newinterruptTextDiv = document.createElement('div');
              newinterruptTextDiv.className = 'question';
              newinterruptTextDiv.innerHTML = splitnewText[n];
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
              MathJax.typeset();
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
              MathJax.typeset();
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
    MathJax.typeset();
    console.log("typeWriter finished");
    });
  }

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid){
    console.log("parseinput called with inputstring=" + inputstring + " and currentdivid=" + currentdivid);

    if (inputstring){
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
    if (inputstring == "help"){
      return [helpText || 'Loading help... please wait', currentdivid];
    } else if (inputstring == "outline"){
      return [outlineText || 'Loading outline... please wait', currentdivid];
    } else if (inputstring == "undo"){
      output = findnode(previousdivid) ? (findnode(previousdivid).text || '') : 'Previous not found';
      wrongcounter = 0;
      nextdivid = previousdivid;
    } else if (inputstring == "hint") {
      if (hintcount === 1){
        if (currentobj.hint!=null && currentobj.hint!=''){
          output = currentobj.hint;
        }
        else {
          output = 'No hint available';
        }
        hintcount++;
      }
      else if (hintcount === 2){
        if (currentobj.hint2!=null && currentobj.hint2!=''){
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
      output = "<img src = 'images/periodic-table"+periodictableversion+".png'> Source: <a href='https://ptable.com/'>ptable.com</a>"
    } else if (inputstring == "default" && outlineclicked===false) {
      // allow user to press enter and skip typing animation
      currentTypingContext.finish();
      console.log("Input empty, typing interrupted");
      return ['interrupt', currentdivid];
    // handle normal input
    } else if (inputstring == 'default' && outlineclicked===true) {
      console.log("Jumping");
      outlineclicked=false;
      wrongcounter = 0;
      return [findnode(currentid).text, currentid];
    } else if (currentobj.type === 'frq') {
      previousdivid = currentdivid;
      if (inputstring == currentobj.correct || inputstring == currentobj.altcorrect) {
        nextdivid = currentobj.next;
        const nextobj = findnode(nextdivid);
        output = nextobj ? (nextobj.text || '') : 'Oops. I couldn\'t find the next part. Looks like you found a bug!';
        wrongcounter = 0;
      } else {
        if (wrongcounter >= 4){
          output = 'It seems like you\'re having some trouble with this question. Don\'t worry, it happens to everyone! The answer is '+currentobj.correct+'.';
          wrongcounter = 0;
        }
        else {
          output = 'Oops. That didn\'t seeem to be exactly right. But that\'s okay; we all make mistakes! Check your answer and try again :) Remember to spell/format your answer correctly! For more information on formatting, type "help". If you need a hint, type "hint".';
          wrongcounter++;
        }
      }
    } else if (currentobj.type === 'fr') {
      previousdivid = currentdivid;
      nextdivid = currentobj.next;
      const nextobj = findnode(nextdivid);
      output = nextobj ? (nextobj.text || '') : 'Oops. I couldn\'t find the next part. Looks like you found a bug!';
    } else if (currentobj.type === 'mcq') {
      if (inputstring == "1") {
        nextdivid = currentobj.op1;
        previousdivid = currentdivid;
        console.log(nextdivid);
      } else if (inputstring == "2") {
        nextdivid = currentobj.op2;
        previousdivid = currentdivid;
      } else if (inputstring == "3") {
        nextdivid = currentobj.op3;
        previousdivid = currentdivid;
      } else if (inputstring == "4") {
        nextdivid = currentobj.op4;
        previousdivid = currentdivid;
      } else {
        console.log("Unrecognized answer choice: " + inputstring);
        output = 'Hmmmm...that doesn\'t seem to be an answer choice. Please enter the number corresponding to your choice, and try again.';
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
    console.log("launching lab: " + labid);
    const chatContainer = document.getElementById('chat-container');
    const labContainer = document.getElementById('lab-container');
    const formElement = document.getElementById('responseform');

    chatContainer.classList.add('shifted');
    labContainer.classList.add('visible');
    formElement.classList.add('shifted-form');

    // Clear any previous lab content
    labContainer.innerHTML = '';

    // Create lab table
    const labTable = document.createElement('div');
    labTable.className = 'lab-table';
    labContainer.appendChild(labTable);

    // Create toolbox
    const toolbox = document.createElement('div');
    toolbox.className = 'toolbox';
    labContainer.appendChild(toolbox);

    // Add elements to lab table
    const flask = document.createElement('div');
    flask.className = 'lab-item flask';
    
    const flaskWrapper = document.createElement('div');
    flaskWrapper.style.position = 'relative';
    flaskWrapper.style.display = 'inline-block';

    const flaskSolid = document.createElement('div');
    flaskSolid.id = 'flask-solid';
    flaskSolid.style.position = 'absolute';
    flaskSolid.style.bottom = '0';
    flaskSolid.style.left = '0';
    flaskSolid.style.width = '0';
    flaskSolid.style.height = '0';
    flaskSolid.style.backgroundColor = 'transparent'; 
    flaskSolid.style.zIndex = '1';
    flaskSolid.style.borderRadius = '0'; 
    flaskSolid.style.opacity = '0';
    flaskSolid.style.transition = 'all 2s ease-in-out, width 0s ease-in-out, left 0s ease-in-out'; 
    flaskWrapper.appendChild(flaskSolid);

    const flaskGas = document.createElement('div');
    flaskGas.id = 'flask-gas';
    flaskGas.style.position = 'absolute';
    flaskGas.style.bottom = '60%'; // Positioned to float above/around neck
    flaskGas.style.left = '10%';
    flaskGas.style.width = '80%';
    flaskGas.style.height = '80%';
    flaskGas.style.backgroundColor = 'transparent'; 
    flaskGas.style.zIndex = '3'; 
    flaskGas.style.opacity = '0';
    flaskGas.style.transition = 'all 2s ease-in-out';
    flaskGas.style.mask = 'url(images/gas.png) no-repeat center / contain';
    flaskGas.style.mask = 'url(images/gas.png) no-repeat center / contain';
    flaskGas.style.webkitMaskMode = 'alpha';
    flaskGas.style.maskMode = 'alpha';
    flaskWrapper.appendChild(flaskGas);

    const flaskImage = document.createElement('img');
    flaskImage.src = 'images/flask.png';
    flaskImage.alt = 'Erlenmeyer Flask';
    flaskImage.style.position = 'relative';
    flaskImage.style.zIndex = '2';
    flaskWrapper.appendChild(flaskImage);

    flask.appendChild(flaskWrapper);
    labTable.appendChild(flask);

    let selectedBeakers = [];

    const labData = fullJSdata.labs.find(lab => lab.labid === labid);

    for (let i = 1; i <= 4; i++) {
      const beakerContainer = document.createElement('div');
      beakerContainer.className = 'lab-item beaker';
      
      const beakerWrapper = document.createElement('div');
      beakerWrapper.style.position = 'relative';
      beakerWrapper.style.display = 'inline-block';

      const beakerImage = document.createElement('img');
      beakerImage.src = 'images/beaker.png';
      beakerImage.alt = `Beaker ${i}`;
      beakerImage.style.position = 'relative';
      beakerImage.style.zIndex = '2';
      
      // Apply fluid color if available
      const fluidColor = labData ? labData['color' + i] : null;
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
      beakerContainer.appendChild(beakerWrapper);
      
      const beakerLabel = document.createElement('div');
      if (labData) {
        beakerLabel.innerHTML = labData['beaker' + i] || `Beaker ${i}`;
      } else {
        beakerLabel.innerHTML = `Beaker ${i}`;
      }
      beakerContainer.appendChild(beakerLabel);
      
      beakerContainer.onclick = () => { 
        console.log(`Beaker ${i} clicked`); 
        
        if (!selectedBeakers.includes(i)) {
            selectedBeakers.push(i);
        }

        if (selectedBeakers.length === 1) {
            const clickedBeaker = beakerContainer.querySelector('.lab-item.beaker img').previousElementSibling; // Assuming fluidDiv is the sibling before img
            if (clickedBeaker && clickedBeaker.style.backgroundColor) {
                const fluidColor = clickedBeaker.style.backgroundColor;
                if (flaskSolid) {
                    flaskSolid.style.width = '90%';
                    flaskSolid.style.height = '50%';
                    flaskSolid.style.bottom = '8%';
                    flaskSolid.style.left = '5%';
                    flaskSolid.style.borderRadius = '0 0 10% 10%';
                    flaskSolid.style.clipPath = 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)';
                    flaskSolid.style.backgroundColor = fluidColor;
                    flaskSolid.style.opacity = '1';
                    if (flaskGas) flaskGas.style.opacity = '0';
                }
            }
        } else if (selectedBeakers.length === 2) {
             if (labData && labData.reaction) {
                let reactionData = null;
                try {
                    reactionData = (new Function("return " + labData.reaction))();
                } catch (e) {
                    console.error("Error parsing reaction data:", e);
                }
                
                if (reactionData) {
                    const key1 = selectedBeakers[0] + "_" + selectedBeakers[1];
                    const key2 = selectedBeakers[1] + "_" + selectedBeakers[0];
                    const outcome = reactionData[key1] || reactionData[key2];

                    if (outcome) {
                        const slowReactionDelay = 1000; // 1 second delay
                        setTimeout(() => {
                            let type = null;
                            let color = null;

                            if (typeof outcome === 'string') {
                                if (outcome === 'solid') {
                                    type = 'solid';
                                    color = reactionData.solidcolor;
                                }
                            } else if (typeof outcome === 'object') {
                                 type = outcome.type;
                                 color = outcome.color || reactionData.solidcolor;
                            }

                            if (flaskSolid) {
                                if (type === 'solid') {
                                    flaskSolid.style.width = '40%';
                                    flaskSolid.style.height = '40%';
                                    flaskSolid.style.bottom = '10%';
                                    flaskSolid.style.left = '30%';
                                    flaskSolid.style.borderRadius = '0';
                                    flaskSolid.style.clipPath = 'none';
                                    flaskSolid.style.backgroundColor = color || 'white';
                                    flaskSolid.style.opacity = '1';
                                    if (flaskGas) flaskGas.style.opacity = '0';
                                } else if (type === 'liquid') {
                                    flaskSolid.style.width = '90%';
                                    flaskSolid.style.height = '50%';
                                    flaskSolid.style.bottom = '8%';
                                    flaskSolid.style.left = '5%';
                                    flaskSolid.style.borderRadius = '0 0 10% 10%';
                                    flaskSolid.style.clipPath = 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)';
                                    flaskSolid.style.backgroundColor = color || 'white';
                                    flaskSolid.style.opacity = '1';
                                    if (flaskGas) flaskGas.style.opacity = '0';
                                } else if (type === 'gas') {
                                    flaskSolid.style.opacity = '0';
                                    if (flaskGas) {
                                        flaskGas.style.backgroundColor = color || 'white';
                                        flaskGas.style.opacity = '1';
                                    }
                                }
                            }
                        }, slowReactionDelay); // Apply the delay here
                    }
                }
             }
        } else if (selectedBeakers.length === 3) {
          let errortext = document.createElement('div');
          errortext.className = "container";
          errortext.innerText = "Error: Please reset the beaker";
          toolbox.insertAdjacentHTML('afterEnd', errortext.outerHTML);
        }
      };
      labTable.appendChild(beakerContainer);
    }
    MathJax.typeset();

    // Add elements to toolbox
    const thermometer = document.createElement('div');
    thermometer.className = 'lab-item tool';
    thermometer.innerHTML = 'Thermometer';
    thermometer.onclick = () => { console.log('Thermometer clicked'); };
    toolbox.appendChild(thermometer);

    const phMeter = document.createElement('div');
    phMeter.className = 'lab-item tool';
    phMeter.innerHTML = 'pH Meter';
    phMeter.onclick = () => { console.log('pH Meter clicked'); };
    toolbox.appendChild(phMeter);

    const resetButton = document.createElement('div');
    resetButton.className = 'lab-item tool';
    resetButton.innerHTML = 'Reset';
    resetButton.onclick = () => { 
        console.log('Reset clicked'); 
        selectedBeakers = [];
        if (flaskSolid) {
            flaskSolid.style.opacity = '0';
            flaskSolid.style.backgroundColor = 'transparent'; 
        }
        if (flaskGas) {
            flaskGas.style.opacity = '0';
            flaskGas.style.backgroundColor = 'transparent'; 
        }
    };
    toolbox.appendChild(resetButton);
  }
  window.launch = launch;
  
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
        MathJax.typeset();
        return;
      } else {
        previoustext= newText;
        formElement.parentNode.insertBefore(newContainer, formElement);
        previouscontainer = newContainer;
        for (var j=0; j<splitnewText.length;) {
          const newTextDiv = document.createElement('div');
          newTextDiv.className = 'question';
            
          // cleanup function to run after typing is done
          const finishQuestionTyping = () => {
              // reload html 
            newTextDiv.innerHTML = splitnewText[j];
            newTextDiv.insertAdjacentHTML('afterend', emptyLine.outerHTML);
            // Final cleanup for the input field
            const inputField = document.getElementById('response');
            if (inputField) { 
              inputField.value = '';
              inputField.focus(); 
            }
              // Ensure final scroll is smooth
            scrollToBottom(true);
            ready = true;
            j++;
          };
          console.log("Typing part " + j + ": " + splitnewText[j]);
          newContainer.appendChild(newTextDiv, formElement);
          newContainer.appendChild(emptyLine, formElement);
          await typeWriter(newTextDiv, splitnewText[j], typespeed, finishQuestionTyping);
          MathJax.typeset();
        }
      }
    }
    MathJax.typeset();
    console.log("updategame completed");
  }
});


