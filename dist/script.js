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
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let selected = 'melody';
let currentMelody = 'light';
let audio, master, analyser, noiseBuffer;
let playing = false;
let currentStep = 0;
let clock;
const liveNodes = new Set();

function startAudio() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain();
    master.gain.value = .72;
    analyser = audio.createAnalyser();
    analyser.fftSize = 1024;
    master.connect(analyser);
    analyser.connect(audio.destination);
    noiseBuffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (audio.state === 'suspended') audio.resume();
}

function canHear(name) {
  const solo = Object.values(tracks).some(track => track.solo);
  return !tracks[name].mute && (!solo || tracks[name].solo);
}

function makeOutput(name) {
  const track = tracks[name];
  const filter = audio.createBiquadFilter();
  const pan = audio.createStereoPanner();
  const gain = audio.createGain();
  const delay = audio.createDelay(1);
  const feedback = audio.createGain();
  const wet = audio.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = 250 * Math.pow(48, track.tone / 100);
  pan.pan.value = track.pan / 100;
  gain.gain.value = canHear(name) ? Math.pow(track.volume / 100, 2) * .85 : 0;
  delay.delayTime.value = .29;
  feedback.gain.value = .27;
  wet.gain.value = track.echo / 100 * .48;
  filter.connect(pan); pan.connect(gain); gain.connect(master);
  filter.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(master);
  return { input:filter, parts:[filter,pan,gain,delay,feedback,wet] };
}

function finishOutput(output, seconds) {
  setTimeout(() => output.parts.forEach(node => node.disconnect()), Math.max(400, seconds * 1000 + 450));
}

function playTone(name, midi, length=.23) {
  if (!canHear(name) || midi == null) return;
  const track = tracks[name];
  const output = makeOutput(name);
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  const now = audio.currentTime;
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  osc.type = track.wave;
  osc.detune.value = track.detune;
  osc.frequency.setValueAtTime(frequency * Math.pow(2, -track.portamento / 12), now);
  osc.frequency.exponentialRampToValueAtTime(frequency, now + Math.max(.01, track.portamento));
  amp.gain.setValueAtTime(.0001, now);
  amp.gain.exponentialRampToValueAtTime(.22, now + Math.max(.01, track.attack));
  amp.gain.exponentialRampToValueAtTime(Math.max(.005, .22 * track.sustain), now + track.attack + track.decay);
  amp.gain.setValueAtTime(Math.max(.005, .22 * track.sustain), now + length);
  amp.gain.exponentialRampToValueAtTime(.0001, now + length + track.release);
  osc.connect(amp); amp.connect(output.input); osc.start(now); osc.stop(now + length + track.release + .05);
  liveNodes.add(osc);
  osc.onended = () => { liveNodes.delete(osc); osc.disconnect(); amp.disconnect(); finishOutput(output, .1); };
}

function playBass(midi) {
  if (!canHear('bass') || midi == null) return;
  const track = tracks.bass;
  const output = makeOutput('bass');
  const osc = audio.createOscillator();
  const sub = audio.createOscillator();
  const amp = audio.createGain();
  const now = audio.currentTime;
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  osc.type = track.wave;
  sub.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  sub.frequency.setValueAtTime(frequency / 2, now);
  osc.detune.value = track.detune;
  amp.gain.setValueAtTime(.0001, now);
  amp.gain.exponentialRampToValueAtTime(.15, now + .015);
  amp.gain.exponentialRampToValueAtTime(.09, now + .22);
  amp.gain.exponentialRampToValueAtTime(.0001, now + .62);
  osc.connect(amp); sub.connect(amp); amp.connect(output.input);
  osc.start(now); sub.start(now); osc.stop(now + .65); sub.stop(now + .65);
  finishOutput(output, .8);
}

function playKick() {
  if (!canHear('drums')) return;
  const output = makeOutput('drums');
  const body = audio.createOscillator();
  const bodyAmp = audio.createGain();
  const click = audio.createBufferSource();
  const clickFilter = audio.createBiquadFilter();
  const clickAmp = audio.createGain();
  const now = audio.currentTime;
  body.type = 'sine';
  body.frequency.setValueAtTime(165, now);
  body.frequency.exponentialRampToValueAtTime(47, now + .18);
  bodyAmp.gain.setValueAtTime(.42, now);
  bodyAmp.gain.exponentialRampToValueAtTime(.12, now + .12);
  bodyAmp.gain.exponentialRampToValueAtTime(.0001, now + .42);
  click.buffer = noiseBuffer;
  clickFilter.type = 'highpass'; clickFilter.frequency.value = 2400;
  clickAmp.gain.setValueAtTime(.055, now);
  clickAmp.gain.exponentialRampToValueAtTime(.0001, now + .018);
  body.connect(bodyAmp); bodyAmp.connect(output.input);
  click.connect(clickFilter); clickFilter.connect(clickAmp); clickAmp.connect(output.input);
  body.start(now); body.stop(now + .44); click.start(now); click.stop(now + .025);
  finishOutput(output, .72);
}

function playNoise(kind) {
  if (!canHear('drums')) return;
  const output = makeOutput('drums');
  const now = audio.currentTime;

  if (kind === 'hat') {
    const source = audio.createBufferSource();
    const high = audio.createBiquadFilter();
    const color = audio.createBiquadFilter();
    const amp = audio.createGain();
    source.buffer = noiseBuffer;
    high.type = 'highpass'; high.frequency.value = 3200;
    color.type = 'bandpass'; color.Q.value = .55;
    color.frequency.setValueAtTime(7600, now);
    color.frequency.exponentialRampToValueAtTime(3900, now + .3);
    amp.gain.setValueAtTime(.0001, now);
    amp.gain.exponentialRampToValueAtTime(.052, now + .012);
    amp.gain.exponentialRampToValueAtTime(.0001, now + .3);
    source.connect(high); high.connect(color); color.connect(amp); amp.connect(output.input);
    source.start(now); source.stop(now + .32);
  } else {
    [0,.032,.067].forEach((delay,index) => {
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const amp = audio.createGain();
      source.buffer = noiseBuffer;
      filter.type = 'bandpass'; filter.frequency.value = 1450 + index * 240; filter.Q.value = .65;
      amp.gain.setValueAtTime(.13 - index * .025, now + delay);
      amp.gain.exponentialRampToValueAtTime(.0001, now + delay + .032);
      source.connect(filter); filter.connect(amp); amp.connect(output.input);
      source.start(now + delay); source.stop(now + delay + .04);
    });
    const tail = audio.createBufferSource();
    const tailFilter = audio.createBiquadFilter();
    const tailAmp = audio.createGain();
    tail.buffer = noiseBuffer;
    tailFilter.type = 'highpass'; tailFilter.frequency.value = 780;
    tailAmp.gain.setValueAtTime(.045, now + .07);
    tailAmp.gain.exponentialRampToValueAtTime(.0001, now + .25);
    tail.connect(tailFilter); tailFilter.connect(tailAmp); tailAmp.connect(output.input);
    tail.start(now + .07); tail.stop(now + .26);
  }
  finishOutput(output, .72);
}

function tick() {
  startAudio();
  playTone('melody', mainMelodies[currentMelody].notes[currentStep], currentMelody === 'vacuum' ? .3 : .18);
  playBass(bass[currentStep]);
  if (rhythm.kick[currentStep]) playKick();
  if (rhythm.snare[currentStep]) playNoise('snare');
  if (rhythm.hat[currentStep]) playNoise('hat');
  showStep(currentStep);
  currentStep = (currentStep + 1) % 16;
}

function intervalTime() { return 60000 / Number(document.getElementById('tempo').value) / 4; }
function runClock() { clearInterval(clock); if (playing) clock = setInterval(tick, intervalTime()); }
function startLoop() {
  startAudio();
  playing = true;
  document.getElementById('play').setAttribute('aria-pressed','true');
  document.getElementById('play-icon').textContent = '■';
  document.getElementById('play-text').textContent = 'Остановить';
  tick(); runClock();
}
function stopLoop() {
  playing = false; clearInterval(clock);
  document.getElementById('play').setAttribute('aria-pressed','false');
  document.getElementById('play-icon').textContent = '▶';
  document.getElementById('play-text').textContent = 'Запустить';
  liveNodes.forEach(node => { try { node.stop(); } catch (error) {} });
  showStep(-1);
}

function sliderHtml(id, label, min, max, step, value) {
  return '<div class="slider"><label for="'+id+'">'+label+' <output id="'+id+'-value">'+formatValue(id,value)+'</output></label><div class="track"><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></div></div>';
}
function formatValue(id, value) {
  const key = id.replace('env-','');
  if (id.includes('pan')) return value == 0 ? 'центр' : (value < 0 ? 'Л ' : 'П ') + Math.abs(value) + '%';
  if (['attack','decay','release','portamento'].includes(key)) return Number(value).toFixed(2) + ' с';
  if (key === 'sustain') return Math.round(value * 100) + '%';
  if (key === 'detune') return value + ' ct';
  return value + '%';
}

function renderChannels() {
  const box = document.getElementById('channels');
  box.innerHTML = Object.entries(tracks).map(([id, track]) => '<article class="channel '+(id===selected?'selected':'')+'" style="--color:'+track.color+'"><div class="channel-top"><button class="channel-name" data-select="'+id+'">'+track.name+'</button><div class="channel-buttons"><button data-mute="'+id+'" aria-pressed="'+track.mute+'">Выкл.</button><button data-solo="'+id+'" aria-pressed="'+track.solo+'">Соло</button></div></div>'+sliderHtml('channel-volume-'+id,'Громкость',0,100,1,track.volume)+sliderHtml('channel-pan-'+id,'Панорама',-100,100,1,track.pan)+'</article>').join('');
  box.querySelectorAll('[data-select]').forEach(button => button.onclick = () => selectTrack(button.dataset.select));
  box.querySelectorAll('[data-mute]').forEach(button => button.onclick = () => { tracks[button.dataset.mute].mute = !tracks[button.dataset.mute].mute; renderChannels(); });
  box.querySelectorAll('[data-solo]').forEach(button => button.onclick = () => { tracks[button.dataset.solo].solo = !tracks[button.dataset.solo].solo; renderChannels(); });
  box.querySelectorAll('input').forEach(input => bindSlider(input, value => {
    const parts = input.id.split('-');
    tracks[parts[2]][parts[1] === 'volume' ? 'volume' : 'pan'] = value;
  }));
}

function renderEnvelope() {
  const track = tracks[selected];
  const names = { attack:'Атака', decay:'Спад', sustain:'Удержание', portamento:'Скольжение', release:'Распад' };
  const ranges = { attack:[0.01,1,.01], decay:[.01,1,.01], sustain:[0,1,.01], portamento:[0,.5,.01], release:[.05,3,.05] };
  document.getElementById('edit-title').textContent = track.name + ' / движение звука';
  const box = document.getElementById('envelope-sliders');
  box.innerHTML = Object.keys(names).map(name => sliderHtml('env-'+name,names[name],...ranges[name],track[name])).join('');
  box.querySelectorAll('input').forEach(input => {
    if (selected === 'drums') input.disabled = true;
    bindSlider(input, value => { tracks[selected][input.id.replace('env-','')] = value; clearPreset(); });
  });
}

function renderRhythm() {
  const rows = [{id:'numbers',name:''},{id:'kick',name:'Бочка',color:'#fff19a'},{id:'snare',name:'Хлопок',color:'#b8e5ff'},{id:'hat',name:'Шорох',color:'#cbb6ff'}];
  document.getElementById('rhythm-grid').innerHTML = rows.map(row => '<div class="rhythm-row" style="--row:'+(row.color||'#171916')+'"><span class="row-name">'+row.name+'</span>'+Array.from({length:16},(_,i) => row.id === 'numbers' ? '<span class="beat-number" data-step="'+i+'">'+String(i+1).padStart(2,'0')+'</span>' : '<button class="beat" data-row="'+row.id+'" data-step="'+i+'" aria-label="'+row.name+', шаг '+(i+1)+'" aria-pressed="'+Boolean(rhythm[row.id][i])+'"></button>').join('')+'</div>').join('');
  document.querySelectorAll('.beat').forEach(button => button.onclick = () => { const row=button.dataset.row; const step=Number(button.dataset.step); rhythm[row][step]=rhythm[row][step]?0:1; button.setAttribute('aria-pressed',Boolean(rhythm[row][step])); });
}

function showStep(step) {
  document.querySelectorAll('[data-step]').forEach(item => item.classList.toggle('current', Number(item.dataset.step) === step));
  document.getElementById('position').textContent = step < 0 ? '— / 16' : String(step+1).padStart(2,'0') + ' / 16';
}

function selectTrack(name) {
  selected = name; renderChannels(); renderEnvelope(); updateTop();
  document.getElementById('note-name').textContent = name === 'melody' ? mainMelodies[currentMelody].name + ' · твоя орбита' : tracks[name].name;
}

function updateTop() {
  const track = tracks[selected];
  const values = { volume:track.volume, echo:track.echo, tone:track.tone, release:track.release };
  Object.entries(values).forEach(([id,value]) => {
    const input=document.getElementById(id); input.value=value; paintSlider(input);
    document.getElementById(id+'-value').textContent = id === 'release' ? Number(value).toFixed(2)+' с' : value+'%';
  });
  document.querySelectorAll('[data-wave]').forEach(button => { const on=button.dataset.wave===track.wave; button.classList.toggle('selected',on); button.setAttribute('aria-pressed',on); });
}

function clearPreset() { document.querySelectorAll('[data-preset]').forEach(button => { button.classList.remove('selected'); button.setAttribute('aria-pressed','false'); }); }
function setPreset(name) {
  Object.assign(tracks[selected],presets[name]); clearPreset();
  const button=document.querySelector('[data-preset="'+name+'"]'); button.classList.add('selected'); button.setAttribute('aria-pressed','true');
  renderEnvelope(); updateTop();
}

function setMainMelody(name) {
  currentMelody = name;
  Object.assign(tracks.melody, mainMelodies[name].settings);
  document.querySelectorAll('.melody-buttons [data-melody]').forEach(button => {
    const on = button.dataset.melody === name;
    button.classList.toggle('selected', on);
    button.setAttribute('aria-pressed', on);
  });
  clearPreset();
  const airButton = document.querySelector('[data-preset="air"]');
  airButton.classList.add('selected');
  airButton.setAttribute('aria-pressed','true');
  renderChannels();
  if (selected === 'melody') { renderEnvelope(); updateTop(); }
  document.getElementById('note-name').textContent = mainMelodies[name].name + ' · твоя орбита';
}

function paintSlider(input) {
  const fill=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100;
  input.style.setProperty('--fill',fill+'%'); input.dataset.old=input.value;
  const output=document.getElementById(input.id+'-value');
  if (output && !['volume','echo','tone','release','tempo'].includes(input.id)) output.textContent=formatValue(input.id, input.value);
}

function makeTrail(input, oldValue) {
  if (reducedMotion) return;
  const track=input.parentElement; const width=input.clientWidth-18;
  const place=value => 9+(value-input.min)/(input.max-input.min)*width;
  const oldX=place(oldValue); const x=place(input.value);
  const trail=document.createElement('span'); trail.className='trail'; trail.style.left=Math.min(x,oldX)+'px'; trail.style.width=Math.max(4,Math.abs(x-oldX))+'px';
  if (x<oldX) trail.style.background='linear-gradient(90deg,#fff,transparent)';
  const spark=document.createElement('span'); spark.className='spark'; spark.textContent='✦'; spark.style.left=(x-4)+'px'; spark.style.top='2px';
  track.append(trail,spark); setTimeout(()=>{trail.remove();spark.remove();},750);
}

function bindSlider(input, onValue) {
  paintSlider(input);
  input.addEventListener('input', () => { const old=Number(input.dataset.old); makeTrail(input,old); onValue(Number(input.value)); paintSlider(input); });
}

document.querySelectorAll('[data-preset]').forEach(button => button.onclick=()=>setPreset(button.dataset.preset));
document.querySelectorAll('.melody-buttons [data-melody]').forEach(button => button.onclick=()=>setMainMelody(button.dataset.melody));
document.querySelectorAll('[data-wave]').forEach(button => button.onclick=()=>{ tracks[selected].wave=button.dataset.wave; clearPreset(); updateTop(); });
['volume','echo','tone','release'].forEach(id => bindSlider(document.getElementById(id), value => {
  tracks[selected][id]=value; clearPreset();
  document.getElementById(id+'-value').textContent=id==='release'?value.toFixed(2)+' с':value+'%';
  if (id==='volume') renderChannels(); if (id==='release') renderEnvelope();
}));
bindSlider(document.getElementById('tempo'), value => { document.getElementById('tempo-value').textContent=value+' BPM'; runClock(); });
document.getElementById('play').onclick=()=>playing?stopLoop():startLoop();
document.getElementById('reset').onclick=()=>{
  stopLoop(); Object.keys(tracks).forEach(name=>Object.assign(tracks[name],JSON.parse(JSON.stringify(originalTracks[name]))));
  Object.keys(rhythm).forEach(row=>rhythm[row]=[...originalRhythm[row]]); currentStep=0; selected='melody'; currentMelody='light';
  document.getElementById('tempo').value=105; document.getElementById('tempo-value').textContent='105 BPM';
  document.querySelectorAll('.melody-buttons [data-melody]').forEach(button=>{ const on=button.dataset.melody==='light'; button.classList.toggle('selected',on); button.setAttribute('aria-pressed',on); });
  renderChannels(); renderEnvelope(); renderRhythm(); updateTop(); paintSlider(document.getElementById('tempo'));
  document.getElementById('note-name').textContent='Свет · твоя орбита';
};
const canvas=document.getElementById('wave'); const pen=canvas.getContext('2d'); const samples=new Uint8Array(1024);
function drawWave() {
  const width=canvas.clientWidth, height=canvas.clientHeight, scale=devicePixelRatio||1;
  if (canvas.width!==Math.round(width*scale)||canvas.height!==Math.round(height*scale)) { canvas.width=Math.round(width*scale); canvas.height=Math.round(height*scale); }
  pen.setTransform(scale,0,0,scale,0,0); pen.clearRect(0,0,width,height); pen.beginPath(); pen.strokeStyle='#171916'; pen.lineWidth=1;
  if (analyser) analyser.getByteTimeDomainData(samples);
  for (let x=0;x<width;x++) { const amount=analyser&&!reducedMotion?(samples[Math.floor(x/width*samples.length)]-128)/128:0; const y=height/2+amount*height*1.7; x?pen.lineTo(x,y):pen.moveTo(x,y); }
  pen.stroke(); requestAnimationFrame(drawWave);
}

renderChannels(); renderEnvelope(); renderRhythm(); updateTop(); drawWave();
