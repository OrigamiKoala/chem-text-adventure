document.addEventListener('DOMContentLoaded', () => {
  const qtext = document.getElementById('text');
  const previousdiv = document.getElementById('previous');
  const formElement = document.getElementById('responseform');
  const inputField = document.getElementById('response');

  let currentid = 0;
  let previousdivid = null;
  let JSdata = null;
  let isProcessing = false;
  let helpText = '';
  let outlineText = '';

  // preload help.txt
  fetch('help.txt')
    .then(response => response.text())
    .then(data => { helpText = data; })
    .catch(error => { console.error('Error loading help text:', error); });

  fetch('outline.html')
    .then(response => response.text())
    .then(data => { outlineText = data; })
    .catch(error => { console.error('Error loading outline:', error); });

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
          initialDiv.innerHTML = initialText;
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

  // receiving input, returns output text and next id
  function parseinput(inputstring, currentdivid){
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
    if (isProcessing) return;
    isProcessing = true;

    const userInput = inputField ? inputField.value : '';
    const [newText, nextId] = parseinput(userInput, currentid);

    // append only the user's response to the history (do not re-insert the previous question text)
    if (previousdiv) {
      const container = document.createElement('div');
      container.className = 'response';
      container.innerHTML = `<div>${userInput}</div>`;
      // insert the container just before the form so it appears in history
      if (formElement && previousdiv === formElement.parentNode) {
        previousdiv.insertBefore(container, formElement);
      } else {
        previousdiv.appendChild(container);
      }
      
      // insert an empty line after user input
      const emptyLine = document.createElement('div');
      emptyLine.style.height = '1em';
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
      newTextDiv.innerHTML = newText;
      formElement.parentNode.insertBefore(newTextDiv, formElement);
    }

    currentid = nextId;

    try {
      if (inputField) {
        inputField.value = '';
        inputField.focus();
        // scroll to position input field near the bottom of the screen
        const inputRect = inputField.getBoundingClientRect();
        const scrollMargin = 100; // keep input 100px above bottom
        const targetScrollTop = window.scrollY + inputRect.bottom - window.innerHeight + scrollMargin;
        window.scrollTo({ top: targetScrollTop, behavior: 'instant' });
      }
    } finally {
      // allow subsequent submissions
      isProcessing = false;
    }
  }
});


