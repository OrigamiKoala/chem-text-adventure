const qtext = document.getElementById("text")
const previousdiv = document.getElementById("previous")
const inputElement = document.getElementById("responseform")
var gameinput = inputElement.value
var previoustext = qtext.innerText
var outputtext = ""

let currentid = 1

// load data from json

let JSdata; // Declare JSdata outside
fetch('data.json')
  .then(response => {
    return response.json();
  })
  .then(data => {
    JSdata = data; // JSdata now holds the parsed JSON object
    start(); // Start the game ONLY when data is loaded
  })
  .catch(error => {
    console.error('Error loading data:', error);
  });

// start game

function start(){
  currentid = 1
  showText(currentid)
}

// update

inputElement.addEventListener('submit', updategame);

// receiving input, returns output text

function parseinput(inputstring, currentdivid){
  currentobj = JSdata[currentdivid]
  output = ""
  if (currentobj.type=="frq"){
    if (inputstring == currentobj.correct){
      nextdivid = currentobj.next
      currentobj = JSdata[currentobj.next]
      output = currentobj.text
    }
    else {
      output = "Try again"
      nextdivid = currentdivid
    }
  }
 // if (currentobj.type=="mcq"){
 //   
 // }
  if (currentobj.type=="fr"){
    nextdivid = currentobj.next
    currentobj = JSdata[currentobj.next]
    output = currentobj.text
  }
  else {
    output = "Try again"
    nextdivid = currentdivid
  }
  return [output, nextdivid]
}

// update the game

function updategame(e) {
  e.preventDefault();
  
  qtext = document.getElementById("text")
  previousdiv = document.getElementById("previous")
  inputElement = document.getElementById("responseform")
  gameinput = inputElement.value
  previoustext = qtext.innerText
  outputtext = parseinput(gameinput, currentid)[0]
  currentid = parseinput(gameinput, currentid)[1]
  inputElement.innerHTML = '<div class="container"><div>'+previoustext+'</div><div>'+gameinput+'</div></div>'
  inputElement.insertAdjacentHTML('afterend', '<div class="container" id="previous"><div id="text">'+outputtext+'</div><form id="responseform"><label for="response">Response: </label><input type="text" id="response" name="response"></div>');
  previoustext = ouputtext
}

// start code
start()


