// once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

  // defining global variables
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
      console.error('Error loading outline:', error);
    });

  // jump to div id (for outline)
  function jumpTo(divid) {
    console.log("jumpTo called with divid=" + divid);
    currentid = divid;
    previousdivid = null;
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    updategame(new Event('jump'));
    console.log("jumpTo completed");
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
          console.log('Initial text rendered.')
          if (qtext && qtext.parentNode) qtext.parentNode.removeChild(qtext);
        } else if (qtext) {
          qtext.innerText = initialText;
          if (qtext.parentNode) qtext.parentNode.removeChild(qtext);
        }
      }
    })
    .catch(error => {
      console.error('Error loading game data:', error);
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

  // typewriter effect
  function typeWriter(element, text, speed, callback = () => {}) {
    console.log("typeWriter called");
    console.log("element= " + element);
    console.log("text= " + text);
    console.log("speed= " + speed);

    let i = 0;
    element.innerHTML = ''; // Clear existing text

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
              element.innerHTML = text; // Display all remaining text
              this.finished = true;
          }
      }
    };
    
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
            } else {
              console.log("Non-button HTML tag detected at index " + i);
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
      console.log("character typed");
    }
    type();
    console.log("typeWriter finished");
  }

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid){
    console.log("parseinput called with inputstring=" + inputstring + " and currentdivid=" + currentdivid);

    if (inputstring){
      inputstring = encodeURIComponent(inputstring.trim());
    }
    else {
      inputstring = 'default';
      console.log("inputstring was empty or null, set to 'default'");
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

    // handle special commands
    if (inputstring == "help"){
      return [helpText || 'Loading help... please wait', currentdivid];
    } else if (inputstring == "outline"){
      return [outlineText || 'Loading outline... please wait', currentdivid];
    } else if (inputstring == "undo"){
      output = JSdata[previousdivid] ? (JSdata[previousdivid].text || '') : 'Previous not found';
      nextdivid = previousdivid;
    } else if (inputstring == 'default'){
      // allow user to press enter and skip typing animation
      currentTypingContext.finish();
      console.log("Input empty, typing interrupted");
      return ['interrupt', currentdivid];
    // handle normal input
    } else if (currentobj.type === 'frq') {
      if (inputstring == currentobj.correct) {
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
    console.log("parseinput returned output=" + output + " and nextdivid=" + nextdivid);
    return [output, nextdivid];
  }

  // update the game
  function updategame(e) {
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

    const userInput = inputField ? inputField.value : 'hi';
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
      if (newText == 'interrupt') {
        console.log("interrupt detected, no new question rendered");
      } else {
        const newTextDiv = document.createElement('div');
        newTextDiv.className = 'question';
        
        // cleanup function to run after typing is done
        const finishQuestionTyping = () => {
          // reload html 
        newTextDiv.innerHTML = newText;
        // Final cleanup for the input field
        const inputField = document.getElementById('response');
        if (inputField) { 
          inputField.value = '';
          inputField.focus(); 
        }
          
          // Ensure final scroll is smooth
        scrollToBottom(true);
        };

        typeWriter(newTextDiv, newText, 20, finishQuestionTyping); 
      
        formElement.parentNode.insertBefore(newTextDiv, formElement);
        currentid = nextId;
      }
    console.log("updategame completed");
    }
  }
});


