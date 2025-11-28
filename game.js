document.addEventListener('DOMContentLoaded', () => {
  const qtext = document.getElementById('text');
  const previousdiv = document.getElementById('previous');
  const formElement = document.getElementById('responseform');
  const inputField = document.getElementById('response');

  let outputtext = '';
  let currentid = 0;
  let JSdata = null;

  // load data from json and render initial prompt
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      JSdata = data;
      if (JSdata && JSdata[currentid] && qtext) {
        qtext.innerText = JSdata[currentid].text || '';
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

    if (currentobj.type === 'frq') {
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

    return [output, nextdivid];
  }

  // update the game
  function updategame(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const userInput = inputField ? inputField.value : '';
    const previoustext = qtext ? qtext.innerText : '';

    const [newText, nextId] = parseinput(userInput, currentid);

    // add previous interaction to the previous div instead of replacing form
    if (previousdiv) {
      const container = document.createElement('div');
      container.className = 'container';
      container.innerHTML = `<div class="previoustext">${previoustext}</div><div>${userInput}</div>`;
      previousdiv.insertAfter(container, previousdiv.firstChild);
    }

    if (qtext) qtext.innerText = newText;
    currentid = nextId;

    if (inputField) {
      inputField.value = '';
      inputField.focus();
    }
  }
});


