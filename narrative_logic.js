let showTimeline = true;

function drawNarrativeTimeline(nodes, scrollX, len) {
  if (!showTimeline || !nodes || nodes.length === 0) return;

  const m = 100;
  const y = height - 70;
  const w = width - (m * 2);

  push();
  resetMatrix(); 
  
  noStroke();
  fill(255, 20); 
  rect(m, y, w, 2, 1);

  let p = map(abs(scrollX), 0, len, 0, 1, true);
  let px = m + (p * w);

  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'white';
  fill(255, 220);
  ellipse(px, y + 1, 10, 10);
  drawingContext.shadowBlur = 0;

  // find current scene based on screen center
  let center = -scrollX + (width / 2);
  let idx = 0;
  let minDist = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    let d = abs(nodes[i].x - center);
    if (d < minDist) {
      minDist = d;
      idx = i;
    }
  }

  let n = nodes[idx];
  textAlign(CENTER, BOTTOM);
  textFont('Crimson Text');

  fill(255, 100);
  textSize(12);
  text(`CHAPTER ${n.chapter || "I"}`, width / 2, y - 35);

  fill(255, 240);
  textSize(18);
  textStyle(ITALIC);
  text((n.scene || "Transition...").toUpperCase(), width / 2, y - 12);

  // chapter markers
  let lastCh = "";
  for (let node of nodes) {
    if (node.chapter !== lastCh) {
      let tx = m + (map(node.x, nodes[0].x, len, 0, 1) * w);
      stroke(255, 50);
      line(tx, y - 5, tx, y + 5);
      lastCh = node.chapter;
    }
  }

  pop();
}

function toggleTimeline() {
  showTimeline = !showTimeline;
}