const qtext = document.getElementById("text")
const previousdiv = document.getElementById("previous")
const inputElement = document.getElementById("responseform")
var gameinput = inputElement.value
var previoustext = qtext.innerText
var outputtext = ""

let currentid = 1

// load data from json

const JSONdata = fetch('data.json');

const JSdata = JSON.parse(JSONdata);

// start game

function start(){
  currentid = 1
  showText(currentid)
}

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

function updategame(){
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


