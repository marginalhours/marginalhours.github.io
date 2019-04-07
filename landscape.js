const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;


const BOX = 16;
const BOX2 = BOX / 2;

const CONTOUR_HEIGHTS = [
    [0.0, 0.05], 
    [0.1, 0.15], 
    [0.2, 0.25], 
    [0.3, 0.35], 
    [0.4, 0.45], 
    [0.5, 0.55], 
    [0.6, 0.65], 
    [0.7, 0.75], 
    [0.8, 0.85], 
    [0.9, 0.95]
];

const sample = (position) => {
    const octaves = 1;
    const exponent = 0.9;
    const noiseComponent = 1 + fullNoise(position, octaves);
    const distanceComponent = 1 - Math.pow(distance(position, {x: document.body.clientWidth / 2, y: position.y}) / (document.body.clientWidth / 2), exponent);
    return (0.5 * noiseComponent) + (1.0 * distanceComponent);
}

const distance = (a, b) => Math.sqrt(((a.x - b.x) * (a.x - b.x)) + ((a.y - b.y) * (a.y - b.y)))

const inverseLerp = (a, b, target) => {
  if (a === b) {
    return target;
  }
  if (a > target && b > target) {
    return 0.5;
  }
  return (target - a) / (b - a)
}

const maskToLineSegments = (mask, p, lowerThreshold, upperThreshold) => {
  let maskAsBits = 0;
  
  for (let i = 0; i < 4; i++){
    maskAsBits |= (upperThreshold > mask[i] >= lowerThreshold) ? (1 << (3 - i)) : 0;   
  }
  
  const topFrac = inverseLerp(mask[0], mask[1], upperThreshold);  
  const bottomFrac = inverseLerp(mask[3], mask[2], upperThreshold);
  const leftFrac =  inverseLerp(mask[0], mask[3], upperThreshold); 
  const rightFrac = inverseLerp(mask[1], mask[2], upperThreshold);
  
  const topPosition = {x: p.x - BOX2 + (BOX * topFrac), y: p.y - BOX2};
  const bottomPosition = {x: p.x - BOX2 + (BOX * bottomFrac), y: p.y + BOX2};
  const leftPosition = {x: p.x - BOX2, y: p.y - BOX2 + (BOX * leftFrac)};
  const rightPosition = {x: p.x + BOX2, y: p.y - BOX2 + (BOX * rightFrac)}
  
  // all relative to box center! 
  switch(maskAsBits) {
    case 0:
    case 15:
      // completely outside or completely inside
      return [];
    case 6:
    case 9:
      // vertical line down box.
      return [[topPosition,bottomPosition]];
    case 3:
    case 12:
      // horizontal(ish) line across box.
      return [[leftPosition, rightPosition]];
    case 1:
    case 14:
      // bottom-left corner -- 
      return [[bottomPosition, leftPosition]];
    case 2: 
    case 13:
      // bottom-right corner
      return [[bottomPosition, rightPosition]];
    case 4:
    case 11:
      // top-right corner
      return [[topPosition, rightPosition]];
    case 7:
    case 8:
      // top-left corner
      return [[topPosition, leftPosition]];
    case 5:
      // top-left + bottom-right
      return [[topPosition, leftPosition],[bottomPosition, rightPosition]];
    case 10:
      // top-right + bottom-left
      return [[topPosition, rightPosition],[bottomPosition, leftPosition]];
    default: 
      return [];
  }
}

class Box {
  constructor (position, sampleFunction, contourIntervals) {
    this.sample = sampleFunction;
    this.contourIntervals = contourIntervals;
    this.position = position;
    this.topLeft = {
      x: position.x - BOX2,
      y: position.y - BOX2
    };
    this.topRight = {
      x: position.x + BOX2,
      y: position.y - BOX2
    };
    this.bottomLeft = {
      x: position.x - BOX2,
      y: position.y + BOX2
    };
    this.bottomRight = {
      x: position.x + BOX2,
      y: position.y + BOX2
    }
    this.mask = 0;
  }
  maskFromSample () {
    this.mask = [
        this.sample(this.topLeft),
        this.sample(this.topRight),
        this.sample(this.bottomRight),
        this.sample(this.bottomLeft)
    ];
  }
  
  draw (ctx) {
    this.contourIntervals.map((height, index) => {
      const lines = maskToLineSegments(this.mask, this.position, height[0], height[1]);
      lines.map(l => drawLine(ctx, l[0], l[1], index));
    });
  }
}

const drawLine = (ctx, start, end, index) => {
  ctx.save();
  ctx.strokeStyle = `rgba(181, 101, 29, ${1.0 - (0.03 * index)})`;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

const boxes = [];

for(let i = 0; i < document.body.clientWidth / BOX; i++){
  for(let j = 0; j < document.body.clientHeight / BOX; j++){
    boxes.push(new Box({
      x: i * BOX,
      y: j * BOX
    }, sample, CONTOUR_HEIGHTS));
  }
}

const render = (dt) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const f = Math.min(dt, 16) / 1000;

  boxes.map(b => {
    b.maskFromSample();
    b.draw(ctx);
  });
}

(function() {
    let throttle = function(type, name, obj) {
        obj = obj || window;
        let running = false;
        let func = function() {
            if (running) { return; }
            running = true;
             requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    /* initialize - you can initialize any event */
    throttle("resize", "optimizedResize");
})();

// handle event
window.addEventListener("optimizedResize", function() {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  render();
});

initializeGradients();
render();