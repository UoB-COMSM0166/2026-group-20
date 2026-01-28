let flag = false;
let backgroundColour = 225;

function setup() {

  createCanvas(700, 500);
  background(backgroundColour);
  myInput = createInput();
  myInput.attribute('placeholder', 'size');
  myInput.position(315, 500);
  label1 = createSpan('RED：');
  label1.position(0, 500);
  slider1 = createSlider(0, 255);
  slider1.position(60,500);
  slider1.size(250);
  label2 = createSpan('GREEN：');
  label2.position(0, 518);
  slider2 = createSlider(0, 255);
  slider2.position(60, 520);
  slider2.size(250);
  label3 = createSpan('BLUE：');
  label3.position(0, 535);
  slider3 = createSlider(0, 255);
  slider3.position(60, 540);
  slider3.size(250);
  let button = createButton('eraser');
  button.position(315,525);
  button.mousePressed(eraser);
  
}

function draw() {
  let size = myInput.value();
  let red = 0;
  let green = 0;
  let blue = 0;
  noStroke();
  if(flag) {
    red = backgroundColour;
    green = backgroundColour;
    blue = backgroundColour;
    
  }else {
    red = slider1.value();
    green = slider2.value();
    blue = slider3.value();
  }
  fill(red, green, blue);
  if(mouseIsPressed && mouseY <= 500){
      ellipse(pmouseX,pmouseY,size,size);
  }
}
function eraser() {
  flag = !flag;
}