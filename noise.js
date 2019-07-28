const width = 512;
const height = 512;
const size = 128;
const mask = size - 1;

let xGrads = [];
let yGrads = [];
let perm = [];

for(let i = 0; i < size; i++){
  perm.push(i);
}

const initializeGradients = () =>{
  // slow but understandable array shuffle
  for(let i = size; i ; i--){
    j = Math.floor(i * Math.random());
    x = perm[i - 1];
    perm[i - 1] = perm[j];
    perm[j] = x;
  }

   // duplicate permutation for some reason?
  for(let i = size; i < 2 * size; i++){
    perm[i] = perm[i - size];
  }

  for(let i = 0; i < size; i++){
      xGrads[i] = Math.cos( 2.0 * Math.PI * (i / size));
      yGrads[i] = Math.sin( 2.0 * Math.PI * (i / size));
    }
}


const f = (v) =>{ // clamping function
  // This actually returns the absolute value of 1 - (some polynomial function of its input)
  // so its greatest values are for t ~= 0
  let t = Math.abs(v);
  return t >= 1 ? 0 : 1.0 - ( ( 6.0* t - 15.0) * t + 10.0) * t * t * t;
}

const surflet = (x, y, grad_x, grad_y) => {
  let b = f(Math.sqrt(x * x + y * y)) * (grad_x * x + grad_y * y);
  return b;
  // eg dot product * smoothed abs value of point
}

const noise = (nx, ny) => {
  const xa = Math.floor(nx);
  const ya = Math.floor(ny);

  let result = 0;

  for(let gY = ya; gY <= ya + 1; ++gY){
    for(let gX = xa; gX <= xa + 1; ++gX){
      let hash = perm[ (perm[gX & mask] + gY) & mask];
      result += surflet(nx - gX, ny - gY, xGrads[hash], yGrads[hash])
    }
  }
  return result;
}


const fullNoise = (position, octaves) => {
  let x = position.x / 128;
  let y = position.y / 128;
  let amplitude = 1.0;

  let result = 0;
  let total = 0;

  for(let o = 0; o < octaves; o++){
    result += amplitude * noise(x, y);
    total += amplitude * 0.5;
    x *= 2.0;
    y *= 2.0;
    amplitude *= 0.5
  }

  return result / total;
}
