// ==========================
// PLAY MUSIC THEORY PRO
// ==========================

const ROWS = 16;
const COLS = 24;
const LABEL_W = 34;

const NOTE_LABELS = [
  "C6","B5","A5","G5","F5","E5","D5","C5",
  "B4","A4","G4","F4","E4","D4","C4","B3"
];

const MIDI = [84,83,81,79,77,76,74,72,71,69,67,65,64,62,60,59];

const COLORS = [
  "#A98DF5","#64D2B0","#74B8FF","#FF9E7A",
  "#F48B94","#FFD96B","#B7E3A1","#D8D8D8","#111827"
];

// ---------- STATE ----------
let grid = Array.from({length:ROWS},()=>Array(COLS).fill(null));
let undoStack = [];
let redoStack = [];

let tool = "brush";
let track = 0;
let bpm = 120;
let playing = false;

// ---------- DOM ----------
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const playBtn = document.getElementById("playBtn");
const playhead = document.getElementById("playhead");
const triangle = document.getElementById("playTriangle");
const bpmSlider = document.getElementById("bpmSlider");
const bpmLabel = document.getElementById("bpmLabel");

let W,H,CELL_W,CELL_H;

// ---------- AUDIO ----------
let synth;

function createSynth(name){

  if(synth) synth.dispose();

  if(name==="Piano"){
    synth = new Tone.PolySynth(Tone.Synth,{
      oscillator:{type:"sine4"},
      envelope:{attack:0.01,release:0.6}
    }).toDestination();
  }

  else if(name==="Synth"){
    synth = new Tone.PolySynth(Tone.Synth,{
      oscillator:{type:"sawtooth"}
    }).toDestination();
  }

  else if(name==="Bell"){
    synth = new Tone.PolySynth(Tone.Synth,{
      oscillator:{type:"triangle8"}
    }).toDestination();
  }

  else{
    synth = new Tone.PolySynth(Tone.Synth,{
      oscillator:{type:"triangle"},
      envelope:{attack:0.01,release:0.35}
    }).toDestination();
  }
}

createSynth("Music Box");

// ---------- CANVAS ----------
function resize(){

  const dpr = window.devicePixelRatio || 1;

  W = canvas.parentElement.clientWidth;
  H = 430;

  canvas.width = W*dpr;
  canvas.height = H*dpr;
  canvas.style.height = "430px";

  ctx.setTransform(dpr,0,0,dpr,0,0);

  CELL_W = (W-LABEL_W)/COLS;
  CELL_H = H/ROWS;

  draw();
}

window.addEventListener("resize",resize);

function draw(){

  ctx.clearRect(0,0,W,H);

  // label
  ctx.fillStyle="#F8F5F1";
  ctx.fillRect(0,0,LABEL_W,H);

  // grid
  ctx.strokeStyle="#E8E2DA";
  ctx.lineWidth=1;

  for(let r=0;r<=ROWS;r++){
    ctx.beginPath();
    ctx.moveTo(0,r*CELL_H);
    ctx.lineTo(W,r*CELL_H);
    ctx.stroke();
  }

  for(let c=0;c<=COLS;c++){
    ctx.beginPath();
    ctx.moveTo(LABEL_W+c*CELL_W,0);
    ctx.lineTo(LABEL_W+c*CELL_W,H);
    ctx.stroke();
  }

  // labels
  ctx.fillStyle="#7B768A";
  ctx.font="10px Inter";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  NOTE_LABELS.forEach((n,i)=>{
    ctx.fillText(n,LABEL_W/2,i*CELL_H+CELL_H/2);
  });

  // notes
  for(let r=0;r<ROWS;r++){

    for(let c=0;c<COLS;c++){

      const cell = grid[r][c];

      if(!cell) continue;

      ctx.fillStyle = COLORS[cell.track];

      roundRect(
        LABEL_W+c*CELL_W+3,
        r*CELL_H+3,
        Math.min(CELL_W,CELL_H)-6,
        Math.min(CELL_W,CELL_H)-6,
        5
      );

    }

  }

}

function roundRect(x,y,w,h,r){

  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();

}

// ---------- DRAW ----------
let drawing=false;

canvas.addEventListener("pointerdown",e=>{
  drawing=true;
  paint(e);
});

canvas.addEventListener("pointermove",e=>{
  if(drawing) paint(e);
});

window.addEventListener("pointerup",()=>{
  drawing=false;
});

function getCell(e){

  const rect=canvas.getBoundingClientRect();

  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(x<LABEL_W) return null;

  const c=Math.floor((x-LABEL_W)/CELL_W);
  const r=Math.floor(y/CELL_H);

  if(r<0||r>=ROWS||c<0||c>=COLS) return null;

  return {r,c};

}

function paint(e){

  const p=getCell(e);

  if(!p) return;

  saveState();

  if(tool==="brush"){
    grid[p.r][p.c]={track};
  }else{
    grid[p.r][p.c]=null;
  }

  draw();

}

// ---------- HISTORY ----------
function saveState(){

  undoStack.push(JSON.stringify(grid));

  if(undoStack.length>80) undoStack.shift();

  redoStack=[];

}

// ---------- BUTTONS ----------
document.getElementById("brushTool").onclick=()=>{
  tool="brush";
  brushTool.classList.add("active");
  eraseTool.classList.remove("active");
};

document.getElementById("eraseTool").onclick=()=>{
  tool="erase";
  eraseTool.classList.add("active");
  brushTool.classList.remove("active");
};

document.getElementById("clearBtn").onclick=()=>{
  saveState();
  grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  draw();
};

document.getElementById("undoBtn").onclick=()=>{
  if(!undoStack.length) return;
  redoStack.push(JSON.stringify(grid));
  grid=JSON.parse(undoStack.pop());
  draw();
};

document.getElementById("redoBtn").onclick=()=>{
  if(!redoStack.length) return;
  undoStack.push(JSON.stringify(grid));
  grid=JSON.parse(redoStack.pop());
  draw();
};

// ---------- COLORS ----------
document.querySelectorAll(".color").forEach(btn=>{

  btn.onclick=()=>{

    document
      .querySelectorAll(".color")
      .forEach(c=>c.classList.remove("active"));

    btn.classList.add("active");

    track=Number(btn.dataset.track);

  };

});

// ---------- BPM ----------
bpmSlider.oninput=()=>{

  bpm=Number(bpmSlider.value);

  bpmLabel.innerText=bpm;

};

// ---------- INSTRUMENT ----------
document.getElementById("instrumentSelect").onchange=(e)=>{
  createSynth(e.target.value);
};

// ---------- PLAY ----------
playBtn.onclick=async()=>{

  if(playing) return;

  playing=true;

  playBtn.innerText="❚❚";

  await Tone.start();

  const step = 60000/bpm/2;

  for(let c=0;c<COLS;c++){

    const left=LABEL_W+c*CELL_W;

    playhead.style.left=left+"px";
    triangle.style.left=(left-7)+"px";

    const notes=[];

    for(let r=0;r<ROWS;r++){

      if(grid[r][c]){

        notes.push(
          Tone.Frequency(MIDI[r],"midi")
        );

      }

    }

    if(notes.length){

      synth.triggerAttackRelease(notes,"8n");

    }

    await new Promise(res=>setTimeout(res,step));

  }

  playhead.style.left="34px";
  triangle.style.left="27px";

  playBtn.innerText="▶";

  playing=false;

};

// ---------- SAVE ----------
document.getElementById("saveBtn").onclick=()=>{

  const blob=new Blob([JSON.stringify(grid)],{
    type:"application/json"
  });

  const a=document.createElement("a");

  a.href=URL.createObjectURL(blob);
  a.download="project.json";
  a.click();

};

resize();
