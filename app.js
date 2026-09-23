// ===== PLAY MUSIC THEORY PRO =====

const ROWS = 16;
const COLS = 24;
const LABEL_WIDTH = 34;

const NOTE_LABELS = [
  "C6","B5","A5","G5","F5","E5","D5","C5",
  "B4","A4","G4","F4","E4","D4","C4","B3"
];

const MIDI = [
  84,83,81,79,77,76,74,72,
  71,69,67,65,64,62,60,59
];

// ---------- State ----------

let grid = Array.from({length:ROWS},()=>Array(COLS).fill(null));

let undoStack=[];
let redoStack=[];

let tool="brush";
let currentTrack=0;
let bpm=120;
let playing=false;

// ---------- Canvas ----------

const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let cellW=0;
let cellH=0;
let width=0;
let height=0;

// ---------- Tone ----------

let synth;

createInstrument("Music Box");

function createInstrument(name){

  if(synth) synth.dispose();

  switch(name){

    case "Piano":
      synth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"sine4"},
        envelope:{
          attack:0.005,
          decay:0.12,
          sustain:0.2,
          release:0.6
        }
      }).toDestination();
      break;

    case "Synth":
      synth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"sawtooth"}
      }).toDestination();
      break;

    case "Bell":
      synth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"triangle8"}
      }).toDestination();
      break;

    default:
      synth = new Tone.PolySynth(Tone.Synth,{
        oscillator:{type:"triangle"},
        envelope:{
          attack:0.01,
          release:0.35
        }
      }).toDestination();

  }

}

// ---------- Resize ----------

function resize(){

  const dpr = window.devicePixelRatio || 1;

  width = canvas.parentElement.clientWidth;
  height = 430;

  canvas.width = width*dpr;
  canvas.height = height*dpr;

  canvas.style.height="430px";

  ctx.setTransform(dpr,0,0,dpr,0,0);

  cellW = (width-LABEL_WIDTH)/COLS;
  cellH = height/ROWS;

  draw();

}

window.addEventListener("resize",resize);

// ---------- Draw ----------

function draw(){

  ctx.clearRect(0,0,width,height);

  ctx.fillStyle="#F8F5F1";
  ctx.fillRect(0,0,LABEL_WIDTH,height);

  ctx.strokeStyle="#E8E2DA";
  ctx.lineWidth=1;

  for(let r=0;r<=ROWS;r++){

    ctx.beginPath();
    ctx.moveTo(0,r*cellH);
    ctx.lineTo(width,r*cellH);
    ctx.stroke();

  }

  for(let c=0;c<=COLS;c++){

    ctx.beginPath();
    ctx.moveTo(LABEL_WIDTH+c*cellW,0);
    ctx.lineTo(LABEL_WIDTH+c*cellW,height);
    ctx.stroke();

  }

  ctx.fillStyle="#7B768A";
  ctx.font="10px Inter";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  NOTE_LABELS.forEach((n,i)=>{
    ctx.fillText(n,LABEL_WIDTH/2,i*cellH+cellH/2);
  });

  grid.forEach((row,r)=>{

    row.forEach((cell,c)=>{

      if(!cell) return;

      const colors=[
        "#A98DF5","#64D2B0","#74B8FF",
        "#FF9E7A","#F48B94","#FFD96B",
        "#B7E3A1","#D8D8D8","#111827"
      ];

      ctx.fillStyle=colors[cell.track];

      roundRect(
        LABEL_WIDTH+c*cellW+3,
        r*cellH+3,
        Math.min(cellW,cellH)-6,
        Math.min(cellW,cellH)-6,
        5
      );

    });

  });

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

// ---------- Pointer ----------

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

function paint(e){

  const p=getCell(e);

  if(!p) return;

  saveState();

  if(tool==="brush"){

    grid[p.r][p.c]={
      track:currentTrack
    };

  }else{

    grid[p.r][p.c]=null;

  }

  draw();

}

function getCell(e){

  const rect=canvas.getBoundingClientRect();

  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(x<LABEL_WIDTH) return null;

  const c=Math.floor((x-LABEL_WIDTH)/cellW);
  const r=Math.floor(y/cellH);

  if(r<0||r>=ROWS||c<0||c>=COLS) return null;

  return {r,c};

}

// ---------- Undo ----------

function saveState(){

  undoStack.push(JSON.stringify(grid));

  if(undoStack.length>100)
    undoStack.shift();

  redoStack=[];

}

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

// ---------- Tools ----------

const brushBtn=document.getElementById("brushTool");
const eraseBtn=document.getElementById("eraseTool");

brushBtn.onclick=()=>{

  tool="brush";

  brushBtn.classList.add("active");
  eraseBtn.classList.remove("active");

};

eraseBtn.onclick=()=>{

  tool="erase";

  eraseBtn.classList.add("active");
  brushBtn.classList.remove("active");

};

document.getElementById("clearBtn").onclick=()=>{

  saveState();

  grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));

  draw();

};

// ---------- Palette ----------

document.querySelectorAll(".color").forEach(btn=>{

  btn.onclick=()=>{

    document
      .querySelectorAll(".color")
      .forEach(b=>b.classList.remove("active"));

    btn.classList.add("active");

    currentTrack=Number(btn.dataset.track);

  };

});

// ---------- BPM ----------

const slider=document.getElementById("bpmSlider");

slider.oninput=()=>{

  bpm=Number(slider.value);

  document.getElementById("bpmLabel").innerText=bpm;

};

// ---------- Instrument ----------

document.getElementById("instrumentSelect")
.onchange=e=>{

  createInstrument(e.target.value);

};

// ---------- Playback ----------

const playhead=document.getElementById("playhead");
const triangle=document.getElementById("playTriangle");

document.getElementById("playBtn").onclick=play;

async function play(){

  if(playing) return;

  playing=true;

  await Tone.start();

  const step=60000/bpm/2;

  for(let c=0;c<COLS;c++){

    const left=LABEL_WIDTH+c*cellW;

    playhead.style.left=left+"px";
    triangle.style.left=(left-7)+"px";

    const notes=[];

    for(let r=0;r<ROWS;r++){

      const cell=grid[r][c];

      if(cell){

        notes.push(
          Tone.Frequency(MIDI[r],"midi")
        );

      }

    }

    if(notes.length){

      synth.triggerAttackRelease(
        notes,
        "8n"
      );

    }

    await new Promise(res=>setTimeout(res,step));

  }

  playhead.style.left="34px";
  triangle.style.left="27px";

  playing=false;

}

// ---------- Save ----------

document.getElementById("saveBtn").onclick=()=>{

  const blob=new Blob(
    [JSON.stringify(grid)],
    {type:"application/json"}
  );

  const a=document.createElement("a");

  a.href=URL.createObjectURL(blob);
  a.download="project.json";
  a.click();

};

// ---------- Init ----------

resize();
