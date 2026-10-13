const tracks = {
  melody: { name:'Мелодия', color:'#fff19a', wave:'sine', volume:58, pan:18, echo:30, tone:78, attack:.04, decay:.2, sustain:.36, release:1.25, portamento:.04, detune:5, mute:false, solo:false },
  bass: { name:'Бас', color:'#b8e5ff', wave:'sawtooth', volume:50, pan:-10, echo:7, tone:28, attack:.01, decay:.22, sustain:.56, release:.48, portamento:.11, detune:-4, mute:false, solo:false },
  drums: { name:'Ритм', color:'#cbb6ff', wave:'square', volume:55, pan:0, echo:8, tone:72, attack:.01, decay:.12, sustain:0, release:.15, portamento:0, detune:0, mute:false, solo:false }
};

const originalTracks = JSON.parse(JSON.stringify(tracks));
const presets = {
  air: { wave:'sine', echo:32, tone:70, attack:.08, release:1.6 },
  water: { wave:'triangle', echo:54, tone:42, attack:.18, release:2.3 },
  earth: { wave:'square', echo:18, tone:36, attack:.06, release:1.1 }
};
const rhythm = {
  kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hat:  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
};
const originalRhythm = JSON.parse(JSON.stringify(rhythm));
const mainMelodies = {
  light: { name:'Свет', notes:[66,null,69,null,66,null,73,null,69,null,66,69,62,null,64,null], settings:{ wave:'sine', echo:30, tone:78, attack:.04, decay:.2, sustain:.36, release:1.25, portamento:.04, detune:5 } },
  vacuum: { name:'Вакуум', notes:[57,null,null,60,null,55,null,null,52,null,55,null,48,null,50,null], settings:{ wave:'triangle', echo:58, tone:27, attack:.2, decay:.38, sustain:.44, release:2.35, portamento:.18, detune:-8 } }
};
const bass = [38,null,null,null,38,null,45,null,35,null,null,null,35,null,40,null];
