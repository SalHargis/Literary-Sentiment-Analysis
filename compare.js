let gatsby, frank;
let bg;

function preload() {
  gatsby = loadJSON('gatsby.json');
  frank = loadJSON('frankenstein.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  bg = color(10, 10, 15);
  noLoop(); // static view
}

function draw() {
  background(bg);
  
  let centerX = width / 2;
  let centerY = height / 2;
  let spacing = width * 0.25;

  // render both side-by-side
  renderMandala(gatsby.nodes, centerX - spacing, centerY, "THE GREAT GATSBY");
  renderMandala(frank.nodes, centerX + spacing, centerY, "FRANKENSTEIN");
  
  drawLegend(centerY);
}

function renderMandala(nodes, cx, cy, label) {
  let rBase = min(width, height) * 0.15;
  let len = nodes.length;

  push();
  translate(cx, cy);
  
  // title
  textAlign(CENTER);
  fill(255, 150);
  textSize(22);
  text(label, 0, rBase + 120);

  // guide rings
  noFill();
  stroke(255, 5);
  ellipse(0, 0, rBase * 2);
  ellipse(0, 0, rBase * 1.5);
  ellipse(0, 0, rBase * 2.5);

  // story path
  beginShape();
  for (let i = 0; i < len; i++) {
    let n = nodes[i];
    let ang = map(i, 0, len, -HALF_PI, TWO_PI - HALF_PI);
    let r = rBase + (n.sentiment * (rBase * 0.6));
    
    let x = r * cos(ang);
    let y = r * sin(ang);

    let col = lerpColor(color(138, 43, 226), color(255, 204, 0), map(n.sentiment, -1, 1, 0, 1));
    
    // plot spikes for intensity
    stroke(red(col), green(col), blue(col), 100);
    strokeWeight(1);
    line(x * 0.95, y * 0.95, x, y);

    noStroke();
    fill(col);
    ellipse(x, y, 3);
    
    // connect the path
    noFill();
    stroke(col);
    strokeWeight(0.5);
    curveVertex(x, y);
  }
  endShape();
  pop();
}

function drawLegend(cy) {
  push();
  textAlign(CENTER);
  textSize(12);
  fill(255, 80);
  text("START (12:00) ➔ CLOCKWISE ➔ END", width / 2, height - 50);
  
  // simple color key
  for(let i = 0; i < 100; i++) {
    let c = lerpColor(color(138, 43, 226), color(255, 204, 0), i/100);
    stroke(c);
    line(width/2 - 50 + i, height - 35, width/2 - 50 + i, height - 25);
  }
  noStroke();
  text("DREAD", width/2 - 75, height - 26);
  text("JOY", width/2 + 70, height - 26);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}