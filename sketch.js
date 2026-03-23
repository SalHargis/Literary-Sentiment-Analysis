let storyData, previewBox;
let nodes = [];
let particles = [];
let scrollX = 0;
let particleLayer, vignetteLayer;
let highIntensityMode = true;

// config
const bookTitle = "The Great Gatsby";
const bookAuthor = "F. Scott Fitzgerald";
const numParticles = 1800;
const noiseScale = 0.0006;
const waveFreq = 0.02;

let currentParticleColor;
let targetParticleColor;

function preload() {
  storyData = loadJSON('narrative_flow.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  vignetteLayer = createGraphics(windowWidth, windowHeight);
  particleLayer = createGraphics(windowWidth, windowHeight);
  particleLayer.background(10, 10, 20);
  
  initVignette();
  
  currentParticleColor = color(100, 100, 150);
  textFont('Crimson Text');
  previewBox = select('#preview-box');
  
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  
  if (storyData && storyData.nodes) {
    const spacing = 180;
    const xOffset = 550;
    nodes = storyData.nodes.map((d, i) => ({
      x: (i + 1) * spacing + xOffset,
      baseY: height / 2 + (d.sentiment * -350),
      sentiment: d.sentiment,
      size: 14,
      text: d.preview,
      keyWords: d.weightedWords,
      weight: d.wordLength || 5
    }));
  }
}

function draw() {
  background(10, 10, 20);

  if (mouseIsPressed) {
    scrollX += (mouseX - pmouseX);
  }
  
  if (nodes.length > 0) {
    const totalLength = nodes[nodes.length - 1].x;
    scrollX = constrain(scrollX, -(totalLength + width * 1.3), 0);

    // track center node for color/particle state
    let viewCenter = -scrollX + width / 2;
    let closestDist = Infinity;
    let centerIdx = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      let d = abs(nodes[i].x - viewCenter);
      if (d < closestDist) {
        closestDist = d;
        centerIdx = i;
      }
    }
    
    let localData = nodes[centerIdx];
    targetParticleColor = lerpColor(color(138, 43, 226), color(255, 204, 0), map(localData.sentiment, -1, 1, 0, 1));
    currentParticleColor = lerpColor(currentParticleColor, targetParticleColor, 0.04);

    particleLayer.background(10, 10, 20, 15);
    for (let p of particles) {
      p.update(localData.sentiment);
      p.display(particleLayer, currentParticleColor, localData.sentiment);
    }

    image(particleLayer, 0, 0);
    drawZoneGuides();

    push();
    translate(scrollX, 0);
    drawTitleCard();
    drawLuminescentPath();

    let activeNode = null;
    for (let n of nodes) {
      let amp = map(n.weight, 4, 8, 5, 50);
      let currentY = n.baseY + sin(n.x * waveFreq + frameCount * 0.04) * amp;
      let d = dist(mouseX - scrollX, mouseY, n.x, currentY);
      let col = lerpColor(color(138, 43, 226), color(255, 204, 0), map(n.sentiment, -1, 1, 0, 1));
      
      if (d < 55) {
        activeNode = { ...n, currentY: currentY };
        renderHoverState(n.x, currentY, n.size, col);
      } else {
        renderDefaultState(n.x, currentY, n.size, col);
      }
    }

    drawMandala(totalLength + 850);
    drawMandalaKey(totalLength + 580);
    pop();

    image(vignetteLayer, 0, 0);
    handleUI(activeNode);
    drawStyleLegend();
  }
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
    this.streamID = floor(random(3));
    this.baseSize = random(0.5, 1.5);
    this.baseSpeed = 0.4;
    this.joySpeedBoost = 0.35;
    this.sadSlowdown = 0.1;
    this.baseSizeRef = 1.5;
    this.joySizeBoost = 10.0;
    this.sadShrink = 0.01;
  }

  update(sentiment) {
    let maxSpd = this.baseSpeed + (sentiment > 0 ? sentiment * this.joySpeedBoost : sentiment * this.sadSlowdown);
    maxSpd = max(maxSpd, 0.05);

    let t = frameCount * 0.002;
    let angle = noise(this.pos.x * noiseScale, this.pos.y * noiseScale, t) * TWO_PI * 4;
    let wave = sin(this.pos.x * 0.005 + t + this.streamID) * 150;
    let targetY = (height / 2) + wave + (this.streamID - 1) * 100;
    
    let acc = p5.Vector.fromAngle(angle);
    acc.y += (targetY - this.pos.y) * 0.005;

    this.vel.add(acc).limit(maxSpd);
    this.pos.add(this.vel);
    
    if (this.pos.x > width) this.pos.x = 0; else if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0; else if (this.pos.y < 0) this.pos.y = height;
  }

  display(pg, col, sentiment) {
    let sz = this.baseSizeRef + this.baseSize + (sentiment > 0 ? sentiment * 5 : sentiment * 0.005);
    sz = max(sz, 0.5);
    let a = map(sz, 0.5, 12, 30, 5);
    pg.stroke(red(col), green(col), blue(col), a);
    pg.strokeWeight(sz);
    pg.point(this.pos.x, this.pos.y);
  }
}

// visuals & helpers
function renderHoverState(x, y, sz, col) {
  let p = sin(frameCount * 0.05) * 6;
  noStroke();
  for (let r = 5; r > 0; r--) {
    fill(red(col), green(col), blue(col), 20 * r);
    ellipse(x, y, (sz * 1.5) + (r * 10) + p);
  }
  fill(col);
  ellipse(x, y, sz + 6 + (p * 0.5));
}

function renderDefaultState(x, y, sz, col) {
  fill(red(col), green(col), blue(col), 40);
  noStroke();
  ellipse(x, y, sz * 2.5);
  fill(col);
  ellipse(x, y, sz);
}

function drawTitleCard() {
  let a = map(abs(scrollX), 0, 400, 255, 0, true);
  if (a <= 0) return;
  
  push();
  textAlign(LEFT, CENTER);
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = "white";
  fill(255, a);
  textSize(64);
  textStyle(BOLD);
  text(bookTitle.toUpperCase(), 150, height / 2 - 20);
  
  drawingContext.shadowBlur = 0;
  textSize(24);
  textStyle(ITALIC);
  fill(255, a * 0.7);
  text(`by ${bookAuthor}`, 155, height / 2 + 40);
  stroke(255, a * 0.4);
  line(150, height / 2 + 75, 450, height / 2 + 75);
  pop();
}

function drawZoneGuides() {
  push();
  translate(0, height / 2);
  textAlign(RIGHT);
  textSize(10);
  const zones = [
    { y: -280, txt: "EXALTATION", c: color(255, 204, 0, 40) },
    { y: -100, txt: "STABILITY", c: color(255, 255, 255, 20) },
    { y: 100, txt: "MELANCHOLY", c: color(255, 255, 255, 20) },
    { y: 280, txt: "DESPAIR", c: color(138, 43, 226, 40) }
  ];
  for (let z of zones) {
    stroke(z.c);
    for (let i = 0; i < width; i += 20) line(i, z.y, i + 10, z.y);
    noStroke();
    fill(255, 100);
    text(z.txt, width - 20, z.y - 5);
  }
  pop();
}

function drawLuminescentPath() {
  for (let i = 0; i < nodes.length - 1; i++) {
    let n1 = nodes[i], n2 = nodes[i + 1];
    let intensity = abs(n1.sentiment);
    if (highIntensityMode) {
      drawingContext.shadowBlur = map(pow(intensity, 2), 0, 1, 0, 40);
      drawingContext.shadowColor = color(255, 255, 255, 150);
    }
    stroke(255, 200);
    strokeWeight(map(n1.weight, 4, 8, 2, 10));
    noFill();
    beginShape();
    for (let x = n1.x; x <= n2.x; x += 8) {
      let inter = map(x, n1.x, n2.x, 0, 1);
      let y = lerp(n1.baseY, n2.baseY, inter);
      let a = lerp(map(n1.weight, 4, 8, 5, 50), map(n2.weight, 4, 8, 5, 50), inter);
      vertex(x, y + sin(x * waveFreq + frameCount * 0.04) * a);
    }
    endShape();
    drawingContext.shadowBlur = 0;
  }
}

function drawStyleLegend() {
  let x = 30, y = height - 190;
  push();
  noStroke();
  fill(10, 10, 20, 200);
  rect(x, y, 280, 160, 15);
  fill(255);
  textSize(16);
  textStyle(BOLD);
  text("NARRATIVE CIPHER", x + 20, y + 30);
  textStyle(NORMAL);
  textSize(12);
  fill(255, 180);
  text("ATMOSPHERE & PARTICLES", x + 20, y + 55);
  for (let i = 0; i < 100; i++) {
    stroke(lerpColor(color(138, 43, 226), color(255, 204, 0), i / 100));
    line(x + 20 + i, y + 65, x + 20 + i, y + 75);
  }
  noStroke();
  fill(255, 150);
  text("JOY: Bloom & Fast Flow", x + 20, y + 105);
  text("SAD: Constrict & Slow Flow", x + 20, y + 125);
  text("AMPLITUDE: Complexity", x + 20, y + 145);
  pop();
}

function drawMandala(cx) {
  let cy = height / 2, rBase = 220;
  push();
  translate(cx, cy);
  rotate(frameCount * 0.002);
  noFill();
  beginShape();
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    let ang = map(i, 0, nodes.length, 0, TWO_PI);
    let r = rBase + (n.sentiment * 140);
    let x = r * cos(ang), y = r * sin(ang);
    let col = lerpColor(color(138, 43, 226), color(255, 204, 0), map(n.sentiment, -1, 1, 0, 1));
    stroke(red(col), green(col), blue(col), 150);
    strokeWeight(map(n.weight, 4, 8, 1, 5));
    curveVertex(x, y);
    if (i % 2 == 0) line(x * 0.92, y * 0.92, x, y);
  }
  endShape(CLOSE);
  pop();
}

function drawMandalaKey(x) {
  let y = height / 2 - 100;
  push();
  fill(255, 8);
  rect(x - 25, y - 25, 280, 220, 15);
  fill(255); textSize(16); text("MANDALA ANALYSIS", x, y);
  textSize(12); fill(255, 180);
  text("• GOLD: Joy / PURPLE: Dread", x, y + 40);
  text("• RADIAL: Sentiment Variance", x, y + 65);
  text("• WEIGHT: Word Complexity", x, y + 90);
  pop();
}

function handleUI(node) {
  if (!node) {
    previewBox.style('opacity', '0');
    return;
  }
  let txt = node.text;
  if (node.keyWords) {
    node.keyWords.forEach(w => {
      txt = txt.replace(new RegExp(`\\b(${w})\\b`, "gi"), "<b>$1</b>");
    });
  }
  previewBox.html(txt).position(node.x + scrollX, node.currentY).style('display', 'block').style('opacity', '1');
  if (node.currentY < 150) previewBox.addClass('below'); else previewBox.removeClass('below');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  vignetteLayer.resizeCanvas(windowWidth, windowHeight);
  initVignette();
}

function initVignette() {
  let ctx = vignetteLayer.drawingContext;
  let g = ctx.createRadialGradient(width/2, height/2, width*0.1, width/2, height/2, width*0.75);
  g.addColorStop(0, 'rgba(10, 10, 20, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  ctx.fillStyle = g;
  vignetteLayer.rect(0, 0, width, height);
}

