/* ======================================================
   PLAY MUSIC THEORY PRO
   APP.JS (PART 1/3)
   Canvas Engine + State + Drawing
====================================================== */

// ---------- CONSTANTS ----------

const ROWS = 16;
let COLS = 24;

const LABEL_WIDTH = 34;
const CANVAS_HEIGHT = 430;

const NOTE_LABELS = [
  "C6","B5","A5","G5","F5","E5","D5","C5",
  "B4","A4","G4","F4","E4","D4","C4","B3"
];

const MIDI = [
  84,83,81,79,77,76,74,72,
  71,69,67,65,64,62,60,59
];

const TRACK_COLORS = [
  "#A98DF5",
  "#64D2B0",
  "#74B8FF",
  "#FF9E7A",
  "#F48B94",
  "#FFD96B",
  "#B7E3A1",
  "#D8D8D8",
  "#111827"
];

// ---------- DOM ----------

const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const playhead = document.getElementById("playhead");
const triangle = document.getElementById("playTriangle");

const bpmSlider = document.getElementById("bpmSlider");
const bpmLabel = document.getElementById("bpmLabel");

// ---------- STATE ----------

const state = {

  tool : "brush",

  currentTrack : 0,

  bpm : 120,

  zoom : 1,

  offsetX : 0,

  playing : false

};

let history = [];
let future = [];

// ---------- GRID DATA ----------

function createGrid(){

  return Array.from(
    {length:ROWS},
    ()=>Array(COLS).fill(null)
  );

}

let grid = createGrid();

// ---------- CANVAS SIZE ----------

let W = 0;
let H = CANVAS_HEIGHT;

let CELL_W = 0;
let CELL_H = 0;

function resizeCanvas(){

  const dpr = window.devicePixelRatio || 1;

  W = canvas.parentElement.clientWidth;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  canvas.style.height = H + "px";

  ctx.setTransform(dpr,0,0,dpr,0,0);

  CELL_W = ((W - LABEL_WIDTH) / COLS) * state.zoom;
  CELL_H = H / ROWS;

  draw();

}

window.addEventListener("resize",resizeCanvas);

// ---------- HISTORY ----------

function snapshot(){

  history.push(JSON.stringify(grid));

  if(history.length > 100){
    history.shift();
  }

  future = [];

}

function undo(){

  if(!history.length) return;

  future.push(JSON.stringify(grid));

  grid = JSON.parse(history.pop());

  draw();

}

function redo(){

  if(!future.length) return;

  history.push(JSON.stringify(grid));

  grid = JSON.parse(future.pop());

  draw();

}

// ---------- DRAW HELPERS ----------

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

function drawBackground(){

  ctx.fillStyle="#FCFBF8";

  ctx.fillRect(0,0,W,H);

  ctx.fillStyle="#F8F5F1";

  ctx.fillRect(0,0,LABEL_WIDTH,H);

}

function drawGrid(){

  ctx.strokeStyle="#E8E2DA";
  ctx.lineWidth=1;

  for(let r=0;r<=ROWS;r++){

    ctx.beginPath();

    ctx.moveTo(0,r*CELL_H);

    ctx.lineTo(W,r*CELL_H);

    ctx.stroke();

  }

  for(let c=0;c<=COLS;c++){

    const x = LABEL_WIDTH + c*CELL_W - state.offsetX;

    ctx.beginPath();

    ctx.moveTo(x,0);

    ctx.lineTo(x,H);

    ctx.stroke();

  }

}

function drawLabels(){

  ctx.fillStyle="#7B768A";

  ctx.font="10px Inter";

  ctx.textAlign="center";
  ctx.textBaseline="middle";

  NOTE_LABELS.forEach((note,index)=>{

    ctx.fillText(
      note,
      LABEL_WIDTH/2,
      index*CELL_H + CELL_H/2
    );

  });

}

function drawNotes(){

  for(let r=0;r<ROWS;r++){

    for(let c=0;c<COLS;c++){

      const note = grid[r][c];

      if(!note) continue;

      const x =
        LABEL_WIDTH +
        c*CELL_W -
        state.offsetX +
        3;

      const y =
        r*CELL_H + 3;

      const size =
        Math.min(CELL_W,CELL_H)-6;

      if(x + size < LABEL_WIDTH) continue;

      if(x > W) continue;

      ctx.fillStyle =
        TRACK_COLORS[note.track];

      roundRect(
        x,
        y,
        size,
        size,
        5
      );

    }

  }

}

function draw(){

  ctx.clearRect(0,0,W,H);

  drawBackground();

  drawGrid();

  drawLabels();

  drawNotes();

}

// ---------- POINTER ----------

let drawing = false;

function pointerToCell(e){

  const rect =
    canvas.getBoundingClientRect();

  const px = e.clientX - rect.left;

  const py = e.clientY - rect.top;

  if(px < LABEL_WIDTH) return null;

  const col = Math.floor(
    (px + state.offsetX - LABEL_WIDTH)
    / CELL_W
  );

  const row = Math.floor(py / CELL_H);

  if(row<0 || row>=ROWS) return null;
  if(col<0 || col>=COLS) return null;

  return {row,col};

}

function paint(cell){

  if(!cell) return;

  const {row,col}=cell;

  if(state.tool==="brush"){

    grid[row][col]={
      track:state.currentTrack
    };

  }

  else if(state.tool==="erase"){

    grid[row][col]=null;

  }

  draw();

}

canvas.addEventListener("pointerdown",e=>{

  drawing=true;

  snapshot();

  paint(pointerToCell(e));

});

canvas.addEventListener("pointermove",e=>{

  if(!drawing) return;

  paint(pointerToCell(e));

});

window.addEventListener("pointerup",()=>{

  drawing=false;

});

// ---------- TOOLBAR ----------

document.getElementById("brushTool").onclick=()=>{

  state.tool="brush";

  brushTool.classList.add("active");

  eraserTool.classList.remove("active");

};

document.getElementById("eraserTool").onclick=()=>{

  state.tool="erase";

  eraserTool.classList.add("active");

  brushTool.classList.remove("active");

};

document.getElementById("undoBtn").onclick=undo;

document.getElementById("redoBtn").onclick=redo;

// ---------- PALETTE ----------

document
.querySelectorAll(".color")
.forEach(btn=>{

  btn.onclick=()=>{

    document
    .querySelectorAll(".color")
    .forEach(c=>c.classList.remove("active"));

    btn.classList.add("active");

    state.currentTrack=
      Number(btn.dataset.track);

  };

});

// ---------- BPM ----------

bpmSlider.oninput=()=>{

  state.bpm=
    Number(bpmSlider.value);

  bpmLabel.textContent=
    state.bpm;

};

// ---------- GRID SIZE ----------

document.getElementById("gridSelect").onchange=e=>{

  COLS = Number(e.target.value);

  grid = createGrid();

  resizeCanvas();

};

// ---------- INIT ----------

resizeCanvas();
/* ======================================================
   APP.JS (PART 2/3)
   Pan + Pinch Zoom + Selection
====================================================== */

// ---------- VIEWPORT ----------

const viewport = {
  minZoom: 0.75,
  maxZoom: 3
};

let pointers = new Map();
let pinchStartDistance = 0;
let pinchStartZoom = 1;
let panStartOffset = 0;
let panStartX = 0;

// ---------- DISTANCE ----------

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------- CLAMP ----------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ---------- UPDATE CELL ----------

function updateGridSize() {

  CELL_W =
    ((W - LABEL_WIDTH) / COLS) *
    state.zoom;

  draw();

}

// ---------- PINCH START ----------

canvas.addEventListener("pointerdown", e => {

  pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  if (pointers.size === 2) {

    const pts = [...pointers.values()];

    pinchStartDistance = distance(
      pts[0],
      pts[1]
    );

    pinchStartZoom = state.zoom;

  }

});

// ---------- POINTER MOVE ----------

canvas.addEventListener("pointermove", e => {

  if (!pointers.has(e.pointerId)) return;

  pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  // pinch zoom
  if (pointers.size === 2) {

    const pts = [...pointers.values()];

    const current = distance(
      pts[0],
      pts[1]
    );

    const scale =
      current /
      pinchStartDistance;

    state.zoom = clamp(
      pinchStartZoom * scale,
      viewport.minZoom,
      viewport.maxZoom
    );

    updateGridSize();

    return;

  }

  // pan tool
  if (
    state.tool === "select" &&
    pointers.size === 1
  ) {

    const dx =
      e.clientX - panStartX;

    state.offsetX =
      clamp(
        panStartOffset - dx,
        0,
        Math.max(0, COLS * CELL_W - (W - LABEL_WIDTH))
      );

    draw();

  }

});

// ---------- POINTER UP ----------

window.addEventListener("pointerup", e => {

  pointers.delete(e.pointerId);

});

// ---------- SELECT TOOL ----------

const selectBtn =
  document.getElementById("selectTool");

selectBtn.onclick = () => {

  state.tool = "select";

  document
    .querySelectorAll(".tool")
    .forEach(t => t.classList.remove("active"));

  selectBtn.classList.add("active");

};

brushTool.onclick = () => {

  state.tool = "brush";

  document
    .querySelectorAll(".tool")
    .forEach(t => t.classList.remove("active"));

  brushTool.classList.add("active");

};

eraserTool.onclick = () => {

  state.tool = "erase";

  document
    .querySelectorAll(".tool")
    .forEach(t => t.classList.remove("active"));

  eraserTool.classList.add("active");

};

// ---------- PAN START ----------

canvas.addEventListener("pointerdown", e => {

  if (state.tool !== "select") return;

  panStartX = e.clientX;
  panStartOffset = state.offsetX;

});

// ---------- DOUBLE TAP DELETE ----------

let lastTap = 0;

canvas.addEventListener("pointerup", e => {

  const now = Date.now();

  if (now - lastTap < 260) {

    const cell = pointerToCell(e);

    if (!cell) return;

    snapshot();

    grid[cell.row][cell.col] = null;

    draw();

  }

  lastTap = now;

});

// ---------- TRACK SELECT ----------

document
  .querySelectorAll(".track")
  .forEach(trackBtn => {

    trackBtn.onclick = () => {

      document
        .querySelectorAll(".track")
        .forEach(t => t.classList.remove("active"));

      trackBtn.classList.add("active");

      state.currentTrack =
        Number(trackBtn.dataset.track);

      document
        .querySelectorAll(".color")
        .forEach(c => c.classList.remove("active"));

      document
        .querySelector(
          `.color[data-track="${state.currentTrack}"]`
        )
        .classList.add("active");

    };

  });

// ---------- NEW PROJECT ----------

document.getElementById("newProjectBtn").onclick = () => {

  if (!confirm("Create new project?")) return;

  snapshot();

  grid = createGrid();

  state.offsetX = 0;
  state.zoom = 1;

  updateGridSize();

};

// ---------- MOUSE WHEEL ZOOM ----------

canvas.addEventListener("wheel", e => {

  e.preventDefault();

  const dir =
    e.deltaY > 0 ? -0.1 : 0.1;

  state.zoom = clamp(
    state.zoom + dir,
    viewport.minZoom,
    viewport.maxZoom
  );

  updateGridSize();

}, { passive: false });

// ---------- RESET VIEW ----------

menuBtn.onclick = () => {

  state.zoom = 1;
  state.offsetX = 0;

  updateGridSize();

};
/* ======================================================
   APP.JS (PART 3/3)
   Sequencer + Tone.js + Save
====================================================== */

// ---------- AUDIO ENGINE ----------

let synth = null;

function createInstrument(name){

  if(synth) synth.dispose();

  const config = {
    "Music Box":{
      oscillator:{type:"triangle"},
      envelope:{attack:0.01,decay:0.08,sustain:0.15,release:0.4}
    },
    "Piano":{
      oscillator:{type:"sine4"},
      envelope:{attack:0.005,decay:0.12,sustain:0.25,release:0.7}
    },
    "Synth":{
      oscillator:{type:"sawtooth"},
      envelope:{attack:0.01,release:0.25}
    },
    "Bell":{
      oscillator:{type:"triangle8"},
      envelope:{attack:0.001,release:1.2}
    },
    "Marimba":{
      oscillator:{type:"square"},
      envelope:{attack:0.002,decay:0.15,sustain:0.1,release:0.5}
    }
  };

  synth = new Tone.PolySynth(
    Tone.Synth,
    config[name]
  ).toDestination();

}

createInstrument("Music Box");

instrumentSelect.onchange = e=>{
  createInstrument(e.target.value);
};

// ---------- PLAYHEAD ----------

let playPosition = 0;
let animationId = null;

function updatePlayhead(){

  const x =
    LABEL_WIDTH +
    playPosition * CELL_W -
    state.offsetX;

  playhead.style.left = x + "px";
  playTriangle.style.left = (x-7) + "px";

}

async function playSong(){

  if(state.playing) return;

  await Tone.start();

  state.playing = true;

  document.body.classList.add("playing");

  playBtn.innerText = "❚❚";

  const stepTime = 60000 / state.bpm / 2;

  for(
    playPosition=0;
    playPosition<COLS;
    playPosition++
  ){

    updatePlayhead();

    const notes=[];

    for(let r=0;r<ROWS;r++){

      const note =
        grid[r][playPosition];

      if(note){

        notes.push(
          Tone.Frequency(
            MIDI[r],
            "midi"
          )
        );

      }

    }

    if(notes.length){

      synth.triggerAttackRelease(
        notes,
        "8n"
      );

    }

    await new Promise(res=>{
      setTimeout(res,stepTime);
    });

    if(!state.playing) break;

  }

  stopSong();

}

function stopSong(){

  state.playing=false;

  playPosition=0;

  cancelAnimationFrame(animationId);

  playhead.style.left="34px";
  playTriangle.style.left="27px";

  document.body.classList.remove("playing");

  playBtn.innerText="▶";

}

playBtn.onclick=()=>{

  if(state.playing){

    stopSong();

  }else{

    playSong();

  }

};

// ---------- BPM ----------

bpmSlider.oninput=()=>{

  state.bpm =
    Number(bpmSlider.value);

  bpmLabel.innerText =
    state.bpm;

  saveLocal();

};

// ---------- AUTOSAVE ----------

function saveLocal(){

  const project={

    bpm:state.bpm,

    zoom:state.zoom,

    offset:state.offsetX,

    cols:COLS,

    instrument:
      instrumentSelect.value,

    grid

  };

  localStorage.setItem(
    "PMT_PROJECT",
    JSON.stringify(project)
  );

}

function loadLocal(){

  const raw =
    localStorage.getItem("PMT_PROJECT");

  if(!raw) return;

  const p = JSON.parse(raw);

  COLS = p.cols;

  grid = p.grid;

  state.bpm = p.bpm;

  state.zoom = p.zoom;

  state.offsetX = p.offset;

  bpmSlider.value = p.bpm;
  bpmLabel.innerText = p.bpm;

  instrumentSelect.value =
    p.instrument;

  createInstrument(p.instrument);

  resizeCanvas();

}

window.addEventListener(
  "beforeunload",
  saveLocal
);

loadLocal();

// ---------- SAVE JSON ----------

saveProjectBtn.onclick=()=>{

  saveLocal();

  const blob=new Blob(
    [JSON.stringify({

      bpm:state.bpm,

      cols:COLS,

      instrument:
        instrumentSelect.value,

      grid

    },null,2)],
    {type:"application/json"}
  );

  const a=document.createElement("a");

  a.href=
    URL.createObjectURL(blob);

  a.download="PMT_Project.json";

  a.click();

};

// ---------- LOAD JSON ----------

newProjectBtn.ondblclick=()=>{

  const input=document.createElement("input");

  input.type="file";
  input.accept=".json";

  input.onchange=e=>{

    const file=e.target.files[0];

    const reader=new FileReader();

    reader.onload=()=>{

      const p=
        JSON.parse(reader.result);

      grid=p.grid;

      COLS=p.cols;

      state.bpm=p.bpm;

      bpmSlider.value=p.bpm;
      bpmLabel.innerText=p.bpm;

      instrumentSelect.value=p.instrument;

      createInstrument(p.instrument);

      resizeCanvas();

    };

    reader.readAsText(file);

  };

  input.click();

};

// ---------- MIDI DATA ----------

function buildMidiData(){

  const events=[];

  for(let c=0;c<COLS;c++){

    for(let r=0;r<ROWS;r++){

      if(!grid[r][c]) continue;

      events.push({

        tick:c,

        note:MIDI[r],

        length:1,

        track:grid[r][c].track

      });

    }

  }

  return events;

}

exportMidiBtn.onclick=()=>{

  const blob=new Blob(
    [JSON.stringify(
      buildMidiData(),
      null,
      2
    )],
    {type:"application/json"}
  );

  const a=document.createElement("a");

  a.href=
    URL.createObjectURL(blob);

  a.download="PMT_MIDI.json";

  a.click();

};

// ---------- WAV ----------

exportWavBtn.onclick=()=>{

  alert(
`Tone.js không thể render WAV trực tiếp trong một file JS đơn.

Ở Part 7 mình sẽ thêm OfflineAudioContext để xuất WAV thật.`
  );

};
