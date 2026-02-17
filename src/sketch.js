export const sketch = (p) => {

  let flag = false;
  let backgroundColour = 225;
  let myInput, slider1, slider2, slider3;

  p.setup = () => {
    p.createCanvas(700, 500);
    p.background(backgroundColour);
    myInput = p.createInput();
    myInput.attribute('placeholder', 'size');
    myInput.position(315, 500);
    let label1 = p.createSpan('RED：');
    label1.position(0, 500);
    slider1 = p.createSlider(0, 255);
    slider1.position(60,500);
    slider1.size(250);
    let label2 = p.createSpan('GREEN：');
    label2.position(0, 518);
    slider2 = p.createSlider(0, 255);
    slider2.position(60, 520);
    slider2.size(250);
    let label3 = p.createSpan('BLUE：');
    label3.position(0, 535);
    slider3 = p.createSlider(0, 255);
    slider3.position(60, 540);
    slider3.size(250);
    let button = p.createButton('eraser');
    button.position(315,525);
    button.mousePressed(p.eraser);
    
  }

  p.draw = () => {
    let size = myInput.value();
    let red = 0;
    let green = 0;
    let blue = 0;
    p.noStroke();
    if(flag) {
      red = backgroundColour;
      green = backgroundColour;
      blue = backgroundColour;
      
    }else {
      red = slider1.value();
      green = slider2.value();
      blue = slider3.value();
    }
    p.fill(red, green, blue);
    if(p.mouseIsPressed && p.mouseY <= 500){
        p.ellipse(p.pmouseX,p.pmouseY,size,size);
    }
  }
  p.eraser = function () {
    flag = !flag;
  }
}