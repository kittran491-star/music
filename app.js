/* =========================================================
   PLAY MUSIC THEORY PRO
   app.js — Part 1/3
   Canvas Engine + Drawing
========================================================= */

// ---------- CONFIG ----------

const CONFIG = {
  rows: 16,
  cols: 24,
  labelWidth: 34,
  canvasHeight: 430,
  maxHistory: 100
};

const NOTE_LABELS = [
  "C6","B5","A5","G5","F5","E5","D5","C5",
  "B4","A4","G4","F4","E4","D4","C4","B3"
];

const TRACK_COLORS = [
  "#A98DF5","#64D2B0","#74B8FF",
  "#FF9E7A","#F48B94","#FFD96B",
  "#B7E3A1","#D8D8D8","#111827"
];

// ---------- DOM ----------

const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const brushBtn = document.getElementById("brushTool");
const eraserBtn = document.getElementById("eraserTool");
const selectBtn = document.getElementById("selectTool");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const bpmSlider = document.getElementById("bpmSlider");
const bpmLabel = document.getElementById("bpmLabel");

const palette = document.querySelectorAll(".color");
const tracks = document.querySelectorAll(".track");

// ---------- STATE ----------

const state = {
  tool: "brush",
  track: 0,
  bpm: 120,
  zoom: 1,
  offsetX: 0,
  playing: false
};

let history = [];
let future = [];

// ---------- GRID ----------

function createGrid() {
  return Array.from(
    { length: CONFIG.rows },
    () => Array(CONFIG.cols).fill(null)
  );
}

let grid = createGrid();

// ---------- CANVAS ----------

let WIDTH = 0;
let HEIGHT = CONFIG.canvasHeight;

let CELL_W = 0;
let CELL_H = 0;

function resizeCanvas() {

  const dpr = window.devicePixelRatio || 1;

  WIDTH = canvas.parentElement.clientWidth;

  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;

  canvas.style.width = WIDTH + "px";
  canvas.style.height = HEIGHT + "px";

  ctx.setTransform(dpr,0,0,dpr,0,0);

  CELL_W =
    ((WIDTH - CONFIG.labelWidth) / CONFIG.cols) *
    state.zoom;

  CELL_H =
    HEIGHT / CONFIG.rows;

  draw();

}

window.addEventListener("resize", resizeCanvas);

// ---------- HISTORY ----------

function pushHistory(){

  history.push(JSON.stringify(grid));

  if(history.length > CONFIG.maxHistory){
    history.shift();
  }

  future = [];

}

function undo(){

  if(history.length===0) return;

  future.push(JSON.stringify(grid));

  grid = JSON.parse(history.pop());

  draw();

}

function redo(){

  if(future.length===0) return;

  history.push(JSON.stringify(grid));

  grid = JSON.parse(future.pop());

  draw();

}

undoBtn.onclick = undo;
redoBtn.onclick = redo;

// ---------- DRAW ----------

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
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  ctx.fillStyle="#F8F5F1";
  ctx.fillRect(0,0,CONFIG.labelWidth,HEIGHT);

}

function drawGrid(){

  ctx.strokeStyle="#E8E2DA";
  ctx.lineWidth=1;

  for(let r=0;r<=CONFIG.rows;r++){

    const y=r*CELL_H;

    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(WIDTH,y);
    ctx.stroke();

  }

  for(let c=0;c<=CONFIG.cols;c++){

    const x=
      CONFIG.labelWidth+
      c*CELL_W-
      state.offsetX;

    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,HEIGHT);
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
      CONFIG.labelWidth/2,
      index*CELL_H+CELL_H/2
    );

  });

}

function drawNotes(){

  for(let r=0;r<CONFIG.rows;r++){

    for(let c=0;c<CONFIG.cols;c++){

      const note=grid[r][c];

      if(!note) continue;

      const x=
        CONFIG.labelWidth+
        c*CELL_W-
        state.offsetX+
        3;

      const y=r*CELL_H+3;

      const size=
        Math.min(CELL_W,CELL_H)-6;

      if(x>WIDTH) continue;
      if(x+size<CONFIG.labelWidth) continue;

      ctx.fillStyle=
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

  ctx.clearRect(0,0,WIDTH,HEIGHT);

  drawBackground();
  drawGrid();
  drawLabels();
  drawNotes();

}

// ---------- POINTER ----------

let drawing=false;

function pointerToCell(e){

  const rect=
    canvas.getBoundingClientRect();

  const px=e.clientX-rect.left;
  const py=e.clientY-rect.top;

  if(px<CONFIG.labelWidth) return null;

  const col=Math.floor(
    (px+state.offsetX-CONFIG.labelWidth)/CELL_W
  );

  const row=Math.floor(py/CELL_H);

  if(row<0||row>=CONFIG.rows) return null;
  if(col<0||col>=CONFIG.cols) return null;

  return {row,col};

}

function paint(cell){

  if(!cell) return;

  if(state.tool==="brush"){

    grid[cell.row][cell.col]={
      track:state.track
    };

  }

  if(state.tool==="erase"){

    grid[cell.row][cell.col]=null;

  }

  draw();

}

canvas.addEventListener("pointerdown",e=>{

  if(state.tool==="select") return;

  drawing=true;

  pushHistory();

  paint(pointerToCell(e));

});

canvas.addEventListener("pointermove",e=>{

  if(!drawing) return;

  paint(pointerToCell(e));

});

window.addEventListener("pointerup",()=>{

  drawing=false;

});

// ---------- TOOLS ----------

function activateTool(name){

  state.tool=name;

  [brushBtn,eraserBtn,selectBtn]
    .forEach(b=>b.classList.remove("active"));

  if(name==="brush") brushBtn.classList.add("active");
  if(name==="erase") eraserBtn.classList.add("active");
  if(name==="select") selectBtn.classList.add("active");

}

brushBtn.onclick=()=>activateTool("brush");
eraserBtn.onclick=()=>activateTool("erase");
selectBtn.onclick=()=>activateTool("select");

// ---------- TRACK ----------

palette.forEach(btn=>{

  btn.onclick=()=>{

    palette.forEach(b=>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    state.track=
      Number(btn.dataset.track);

    tracks.forEach(t=>
      t.classList.remove("active")
    );

    tracks[state.track]
      .classList.add("active");

  };

});

tracks.forEach(btn=>{

  btn.onclick=()=>{

    tracks.forEach(t=>
      t.classList.remove("active")
    );

    btn.classList.add("active");

    state.track=
      Number(btn.dataset.track);

    palette.forEach(p=>
      p.classList.remove("active")
    );

    palette[state.track]
      .classList.add("active");

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

  CONFIG.cols=
    Number(e.target.value);

  grid=createGrid();

  resizeCanvas();

};

// ---------- INIT ----------

resizeCanvas();
/* =========================================================
   PLAY MUSIC THEORY PRO
   app.js — Part 2/3
   Zoom + Pan + Selection
========================================================= */

// ---------- VIEWPORT ----------

const viewport = {
  minZoom: 0.75,
  maxZoom: 3
};

let pointers = new Map();

let pinchDistance = 0;
let pinchZoom = 1;

let panStartX = 0;
let panStartOffset = 0;

// ---------- HELPERS ----------

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function getDistance(a,b){

  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx*dx + dy*dy);

}

function updateGridSize(){

  CELL_W =
    ((WIDTH - CONFIG.labelWidth) / CONFIG.cols)
    * state.zoom;

  draw();

}

// ---------- POINTER TRACKING ----------

canvas.addEventListener("pointerdown",e=>{

  pointers.set(e.pointerId,{
    x:e.clientX,
    y:e.clientY
  });

  if(pointers.size===2){

    const pts=[...pointers.values()];

    pinchDistance =
      getDistance(pts[0],pts[1]);

    pinchZoom = state.zoom;

  }

  if(state.tool==="select"){

    panStartX = e.clientX;
    panStartOffset = state.offsetX;

  }

});

canvas.addEventListener("pointermove",e=>{

  if(!pointers.has(e.pointerId)) return;

  pointers.set(e.pointerId,{
    x:e.clientX,
    y:e.clientY
  });

  // ---------- PINCH ----------

  if(pointers.size===2){

    const pts=[...pointers.values()];

    const current =
      getDistance(pts[0],pts[1]);

    const scale =
      current / pinchDistance;

    state.zoom = clamp(
      pinchZoom * scale,
      viewport.minZoom,
      viewport.maxZoom
    );

    updateGridSize();

    return;

  }

  // ---------- PAN ----------

  if(
    state.tool==="select" &&
    pointers.size===1
  ){

    const dx =
      e.clientX - panStartX;

    const maxOffset = Math.max(
      0,
      CONFIG.cols * CELL_W -
      (WIDTH - CONFIG.labelWidth)
    );

    state.offsetX = clamp(
      panStartOffset - dx,
      0,
      maxOffset
    );

    draw();

  }

});

window.addEventListener("pointerup",e=>{

  pointers.delete(e.pointerId);

});

// ---------- DOUBLE TAP DELETE ----------

let lastTap = 0;

canvas.addEventListener("pointerup",e=>{

  const now = Date.now();

  if(now - lastTap < 250){

    const cell = pointerToCell(e);

    if(cell){

      pushHistory();

      grid[cell.row][cell.col]=null;

      draw();

    }

  }

  lastTap = now;

});

// ---------- WHEEL ZOOM ----------

canvas.addEventListener("wheel",e=>{

  e.preventDefault();

  const delta =
    e.deltaY > 0 ? -0.1 : 0.1;

  state.zoom = clamp(
    state.zoom + delta,
    viewport.minZoom,
    viewport.maxZoom
  );

  updateGridSize();

},{passive:false});

// ---------- TRACK PANEL ----------

tracks.forEach(track=>{

  track.addEventListener("dblclick",()=>{

    const name = prompt(
      "Rename Track",
      track.children[1].textContent
    );

    if(!name) return;

    track.children[1].textContent = name;

  });

});

// ---------- NEW PROJECT ----------

document
.getElementById("newProjectBtn")
.onclick=()=>{

  const ok = confirm(
    "Create new project?"
  );

  if(!ok) return;

  history=[];
  future=[];

  grid=createGrid();

  state.zoom=1;
  state.offsetX=0;
  state.track=0;

  updateGridSize();

};

// ---------- RESET VIEW ----------

document
.getElementById("menuBtn")
.ondblclick=()=>{

  state.zoom=1;
  state.offsetX=0;

  updateGridSize();

};

// ---------- SELECTION BOX ----------

const selectionBox =
  document.getElementById("selectionBox");

let selecting=false;
let selectStart=null;

canvas.addEventListener("pointerdown",e=>{

  if(state.tool!=="select") return;

  selecting=true;

  selectStart={
    x:e.offsetX,
    y:e.offsetY
  };

  selectionBox.hidden=false;

});

canvas.addEventListener("pointermove",e=>{

  if(!selecting) return;

  const x=Math.min(selectStart.x,e.offsetX);
  const y=Math.min(selectStart.y,e.offsetY);

  const w=Math.abs(e.offsetX-selectStart.x);
  const h=Math.abs(e.offsetY-selectStart.y);

  selectionBox.style.left=x+"px";
  selectionBox.style.top=y+"px";
  selectionBox.style.width=w+"px";
  selectionBox.style.height=h+"px";

});

window.addEventListener("pointerup",()=>{

  if(!selecting) return;

  selecting=false;

  selectionBox.hidden=true;

});

/* =========================================================
   PLAY MUSIC THEORY PRO
   app.js — Part 3/3
   Tone.js + Playhead + Save
========================================================= */

// ---------- MIDI ----------

const MIDI = [
  84,83,81,79,77,76,74,72,
  71,69,67,65,64,62,60,59
];

// ---------- DOM ----------

const playBtn = document.getElementById("playBtn");
const playhead = document.getElementById("playhead");
const playTriangle = document.getElementById("playTriangle");

const saveBtn = document.getElementById("saveProjectBtn");
const exportMidiBtn = document.getElementById("exportMidiBtn");

// ---------- AUDIO ----------

let synth;

function createInstrument(name){

  if(synth) synth.dispose();

  const preset={

    "Music Box":{
      oscillator:{type:"triangle"},
      envelope:{
        attack:0.01,
        decay:0.08,
        sustain:0.18,
        release:0.4
      }
    },

    Piano:{
      oscillator:{type:"sine4"},
      envelope:{
        attack:0.005,
        decay:0.15,
        sustain:0.2,
        release:0.8
      }
    },

    Synth:{
      oscillator:{type:"sawtooth"},
      envelope:{
        attack:0.01,
        release:0.25
      }
    },

    Bell:{
      oscillator:{type:"triangle8"},
      envelope:{
        attack:0.001,
        release:1.2
      }
    },

    Marimba:{
      oscillator:{type:"square"},
      envelope:{
        attack:0.002,
        decay:0.2,
        sustain:0.1,
        release:0.5
      }
    }

  };

  synth=new Tone.PolySynth(
    Tone.Synth,
    preset[name]
  ).toDestination();

}

createInstrument("Music Box");

instrumentSelect.onchange=e=>{
  createInstrument(e.target.value);
  saveLocal();
};

// ---------- PLAYBACK ----------

let playColumn=0;

function updatePlayhead(){

  const x=
    CONFIG.labelWidth+
    playColumn*CELL_W-
    state.offsetX;

  playhead.style.left=x+"px";
  playTriangle.style.left=(x-7)+"px";

}

async function playSong(){

  if(state.playing) return;

  await Tone.start();

  state.playing=true;

  playBtn.textContent="❚❚";

  const step=
    60000/state.bpm/2;

  for(
    playColumn=0;
    playColumn<CONFIG.cols;
    playColumn++
  ){

    if(!state.playing) break;

    updatePlayhead();

    const notes=[];

    for(let r=0;r<CONFIG.rows;r++){

      const cell=grid[r][playColumn];

      if(cell){

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

    await new Promise(res=>
      setTimeout(res,step)
    );

  }

  stopSong();

}

function stopSong(){

  state.playing=false;

  playColumn=0;

  playBtn.textContent="▶";

  playhead.style.left="34px";
  playTriangle.style.left="27px";

}

playBtn.onclick=()=>{

  if(state.playing){
    stopSong();
  }else{
    playSong();
  }

};

// ---------- AUTOSAVE ----------

function saveLocal(){

  const project={

    bpm:state.bpm,
    zoom:state.zoom,
    offsetX:state.offsetX,

    cols:CONFIG.cols,

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

  const raw=
    localStorage.getItem(
      "PMT_PROJECT"
    );

  if(!raw) return;

  const p=JSON.parse(raw);

  CONFIG.cols=p.cols;

  grid=p.grid;

  state.bpm=p.bpm;
  state.zoom=p.zoom;
  state.offsetX=p.offsetX;

  bpmSlider.value=p.bpm;
  bpmLabel.textContent=p.bpm;

  instrumentSelect.value=
    p.instrument;

  createInstrument(
    p.instrument
  );

  resizeCanvas();

}

window.addEventListener(
  "beforeunload",
  saveLocal
);

// ---------- SAVE JSON ----------

saveBtn.onclick=()=>{

  saveLocal();

  const blob=new Blob(

    [JSON.stringify({

      bpm:state.bpm,

      cols:CONFIG.cols,

      instrument:
        instrumentSelect.value,

      grid

    },null,2)],

    {
      type:"application/json"
    }

  );

  const a=document.createElement("a");

  a.href=
    URL.createObjectURL(blob);

  a.download="PMT_Project.json";

  a.click();

};

// ---------- OPEN JSON ----------

saveBtn.ondblclick=()=>{

  const input=
    document.createElement("input");

  input.type="file";
  input.accept=".json";

  input.onchange=e=>{

    const file=e.target.files[0];

    const reader=new FileReader();

    reader.onload=()=>{

      const p=
        JSON.parse(reader.result);

      CONFIG.cols=p.cols;

      grid=p.grid;

      state.bpm=p.bpm;

      bpmSlider.value=p.bpm;
      bpmLabel.textContent=p.bpm;

      instrumentSelect.value=
        p.instrument;

      createInstrument(
        p.instrument
      );

      resizeCanvas();

    };

    reader.readAsText(file);

  };

  input.click();

};

// ---------- EXPORT MIDI EVENTS ----------

function buildMidiEvents(){

  const events=[];

  for(
    let c=0;
    c<CONFIG.cols;
    c++
  ){

    for(
      let r=0;
      r<CONFIG.rows;
      r++
    ){

      const note=grid[r][c];

      if(!note) continue;

      events.push({

        tick:c,

        midi:MIDI[r],

        track:note.track,

        length:1

      });

    }

  }

  return events;

}

exportMidiBtn.onclick=()=>{

  const blob=new Blob(

    [
      JSON.stringify(
        buildMidiEvents(),
        null,
        2
      )
    ],

    {
      type:"application/json"
    }

  );

  const a=document.createElement("a");

  a.href=
    URL.createObjectURL(blob);

  a.download="PMT_MIDI_Events.json";

  a.click();

};

// ---------- WAV PLACEHOLDER ----------

document
.getElementById("exportWavBtn")
.onclick=()=>{

  alert(
`Bản hiện tại đã có sequencer.

WAV export sẽ cần OfflineAudioContext ở audio.js.`
  );

};

// ---------- INIT ----------

loadLocal();

resizeCanvas();

draw();
```
