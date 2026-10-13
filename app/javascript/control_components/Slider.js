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
