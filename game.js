document.addEventListener('DOMContentLoaded', () => {
  const qtext = document.getElementById('text');
  const previousdiv = document.getElementById('previous');
  const formElement = document.getElementById('responseform');
  const inputField = document.getElementById('response');

  let currentid = 0;
  let previousdivid = null;
  let JSdata = null;
  let helpText = '';
  let outlineText = '';
  let JSoutline = null;
  let currentTypingContext = null
  let typingTimeoutId = null;

  // preload help.txt
  fetch('help.txt')
    .then(response => response.text())
    .then(data => { helpText = data; })
    .catch(error => { console.error('Error loading help text:', error); });

    // preload outline.json
  fetch('outline.json')
    .then(response => response.json())
    .then(data => {
      JSoutline = data;
      if (JSoutline && JSoutline[currentid]) {
        outlineText = 'Click on a section to jump to it.<br>';
        for (const item of JSoutline) {
          outlineText += '<button class="outline" onclick="jumpTo('+item.div+')">' +item.reference_num +' ' + item.content + '</button><br>';
        }
      }
    }).catch(error => {
      console.error('Error loading data:', error);
    });
  function jumpTo(divid) {
    currentid = divid;
    previousdivid = null;
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    updategame(new Event('jump'));
    console.log("jumpTo ran!");
  }
  window.jumpTo = jumpTo; // expose jumpTo to global scope for button onclick
  // load data from json and render initial prompt
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      JSdata = data;
      if (JSdata && JSdata[currentid]) {
        const initialText = JSdata[currentid].text || '';
        // create a rendered question div and insert it above the form
        if (previousdiv && formElement) {
          const initialDiv = document.createElement('div');
          initialDiv.className = 'question';
          typeWriter(initialDiv, initialText, 20);
          formElement.parentNode.insertBefore(initialDiv, formElement);
          // remove the original placeholder element if present so it doesn't duplicate
          if (qtext && qtext.parentNode) qtext.parentNode.removeChild(qtext);
        } else if (qtext) {
          // fallback: put text into qtext then remove it
          qtext.innerText = initialText;
          if (qtext.parentNode) qtext.parentNode.removeChild(qtext);
        }
      }
    })
    .catch(error => {
      console.error('Error loading data:', error);
    });

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

  function typeWriter(element, text, speed, callback = () => {}) {
  console.log("typeWriter called");
  console.log(text);
  let i = 0;
  element.innerHTML = ''; // Clear existing text

    // ✅ NEW: UNCONDITIONAL STATE RESET
    if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
        console.log('Cleared existing typing timeout');
    }
    typingTimeoutId = null;
    currentTypingContext = null; 
    // NEW: Store the context and define a finish method
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
                console.log('finish called');
                element.innerHTML = text; // Display all remaining text
                this.finished = true;
            }
        }
    };
    
    function type() {
      console.log("Typing");
        // ... (existing check for currentTypingContext.finished) ...
        if (currentTypingContext && currentTypingContext.finished) {
            return;
        }

        if (i < text.length) {
            let delay = speed; // Default delay
            let char = text.charAt(i);

            // ✅ RESTORED/FIXED: Check for HTML tag
            if (char === '<') {
              let tagEnd = text.indexOf('>', i);
        
                if (tagEnd !== -1) {
                  let tagContent = text.substring(i, tagEnd + 1);
                  
                  // 2. Check if it's the specific <button tag
                  if (tagContent.startsWith('<button')) {
                      
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
                  } else {
                      // If not a button, treat as a simple tag (e.g., <b>, <br>)
                      element.innerHTML += tagContent;
                      i = tagEnd + 1;
                      delay = 1;
                  }
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
            console.log("Typing complete, callback executed");
        }
    }
      type();
      console.log("typeWriter finished");
  }

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid){
    if (inputstring){
      inputstring = encodeURIComponent(inputstring.trim());
    }
    else {
      inputstring = 'default';
      console.log(inputstring);
    }
    if (!JSdata) return ['Loading...', currentdivid];
    const currentobj = JSdata[currentdivid];
    if (!currentobj) return ['Unknown node', currentdivid];

    // Ensure `text` exists on the current object to avoid undefined errors
    if (typeof currentobj.text === 'undefined') {
      currentobj.text = '';
    }

    let output = '';
    let nextdivid = currentdivid;
    if (inputstring == "help"){
      // return preloaded help text
      return [helpText || 'Loading help... please wait', currentdivid];
    } else if (inputstring == "outline"){
      return [outlineText || 'Loading outline... please wait', currentdivid];
    } else if (inputstring == "undo"){
      output = JSdata[previousdivid] ? (JSdata[previousdivid].text || '') : 'Previous not found';
      nextdivid = previousdivid;
    } else if (inputstring == "" || inputstring == null){
      currentTypingContext.finish();
      return;
    } else if (currentobj.type === 'frq') {
      if (inputstring === currentobj.correct) {
        nextdivid = currentobj.next;
        const nextobj = JSdata[nextdivid];
        output = nextobj ? (nextobj.text || '') : 'Next not found';
      } else {
        output = 'Try again';
      }
    } else if (currentobj.type === 'fr') {
      nextdivid = currentobj.next;
      const nextobj = JSdata[nextdivid];
      output = nextobj ? (nextobj.text || '') : 'Next not found';
    } else if (currentobj.type === 'mcq') {
      if (inputstring == "1") {
        nextdivid = currentobj.op1;
      }
      if (inputstring == "2") {
        nextdivid = currentobj.op2;
      }
      if (inputstring == "3") {
        nextdivid = currentobj.op3;
      }
      if (inputstring == "4") {
        nextdivid = currentobj.op4;
      }
      const nextobj = JSdata[nextdivid];
      output = nextobj ? (nextobj.text || '') : 'Next not found';
    } else {
      output = 'Unrecognized answer choice';
    }
    previousdivid = currentdivid;
    return [output, nextdivid];
  }

  // update the game
  function updategame(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    // Check if typing is currently active and not finished
    if (currentTypingContext && !currentTypingContext.finished) {
        // If typing is in progress, interrupt it instantly and DO NOT proceed
        // with the game logic yet. We just want to finish the typing.
        
        currentTypingContext.finish();
        console.log('Typing interrupted by user.');
    }
    
    // --- If we reach here, typing is either finished naturally or was just completed by the user ---
    
    // The original processing check (to prevent double submissions)

    const userInput = inputField ? inputField.value : 'hi';
    console.log(currentid);
    console.log(userInput);
    let [newText, nextId] = parseinput(userInput, currentid);
    inputField.value = '';

    // append only the user's response to the history (do not re-insert the previous question text)
    if (previousdiv) {
      const container = document.createElement('div');
      container.className = 'response';
      container.innerHTML = `<div>${encodeURIComponent(userInput)}</div>`;
      // insert the container just before the form so it appears in history
      if (formElement && previousdiv === formElement.parentNode) {
        previousdiv.insertBefore(container, formElement);
      } else {
        previousdiv.appendChild(container);
      }
      
      // insert an empty line after user input
      const emptyLine = document.createElement('div');
      emptyLine.className = 'spacer';
      if (formElement && previousdiv === formElement.parentNode) {
        previousdiv.insertBefore(emptyLine, formElement);
      } else {
        previousdiv.appendChild(emptyLine);
      }
    }

    // insert newText above the form as a question element
    if (formElement) {
    const newTextDiv = document.createElement('div');
    newTextDiv.className = 'question';
    console.log('Preparing to type new question text.');
    
    // --- ⬇️ NEW CLEANUP FUNCTION ⬇️ ---
    const finishQuestionTyping = () => {
        // Only allow subsequent submissions and focus the input AFTER typing is done
        
        // Final cleanup for the input field
        const inputField = document.getElementById('response');
        if (inputField) { 
            inputField.value = '';
            inputField.focus(); 
        }
        
        // Ensure final scroll is smooth
        scrollToBottom(true);
    };
    // --- ⬆️ END NEW CLEANUP FUNCTION ⬆️ ---

     // newTextDiv.innerHTML = newText;
    // Pass the cleanup function as the callback
    typeWriter(newTextDiv, newText, 20, finishQuestionTyping); 
    
    formElement.parentNode.insertBefore(newTextDiv, formElement);
    
    // Initial instant scroll to ensure typing is visible from the start
    // scrollToBottom(true) will be called inside the typewriter loop (false)
    // and then called by the callback (true).
    currentid = nextId;
    }
  }
});


