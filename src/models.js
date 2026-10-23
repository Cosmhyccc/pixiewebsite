const routes = {
 talk: {label:'MUSIC PLAYBACK',steps:[['Your request','VOICE','Ask Pixie to play music, or name a song and artist.'],['GPT-6 Luna','RESPONSES DELEGATE','The delegated request selects a music tool. A specific song request can use catalog lookup to find a match.'],['Music playback','ON YOUR MAC','Pixie’s native music handler starts playback through the supported music integration, subject to access and availability.'],['Playback result','RETURN PATH','The tool returns playing, an ambiguous match, or an error. Pixie uses that result to respond rather than assuming the music started.']]},
 screen:{label:'SCREEN CONTEXT',steps:[['Your question','VOICE','Ask about something on your screen.'],['Requested context','ON YOUR MAC','Pixie can capture the requested screen image using macOS screen-recording permission.'],['GPT-6 Luna','CLOUD INFERENCE','The Responses delegate reasons over the supplied question and screen context.'],['Explanation','VOICE + TOOLS','The result can return to the conversation, with supported annotation tools used when appropriate.']]},
 act:{label:'TOOL EXECUTION',steps:[['Your request','VOICE','“Open Notes” enters through Pixie’s voice conversation.'],['GPT-6 Luna','RESPONSES DELEGATE','The delegated task selects an available tool and its arguments.'],['Native handler','ON YOUR MAC','Pixie’s open_app handler asks macOS to open the target app. The model itself doesn’t click your desktop.'],['Tool result','RETURN PATH','The handler returns a result or error to inform the response. A request and a successful action are different states.']]},
 write:{label:'DICTATION',steps:[['Your speech','ON YOUR MAC','Hold the dictation shortcut and speak. Audio enters the transcription path.'],['Live Transcribe','CLOUD INFERENCE','The transcription model produces text from the audio stream.'],['Text finishing','CODE / GPT-4.1 NANO','Straightforward cases use Pixie’s formatting logic; model-based formatting is used when needed.'],['Your text field','ON YOUR MAC','Pixie inserts the result into the selected field using the permissions you grant.']]}
};
let current='talk',step=0, playback;
function stopPlayback(){clearInterval(playback);playback=undefined;document.querySelector('#replay').textContent='Replay ↻';}
function play(){stopPlayback();selectStep(0);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.querySelector('#replay').textContent='Pause Ⅱ';playback=setInterval(()=>{if(step>=routes[current].steps.length-1){stopPlayback();return;}selectStep(step+1)},1800);}
const nodes=document.querySelector('#route-nodes');
function selectStep(index){step=index;const data=routes[current].steps[index];document.querySelector('#step-number').textContent=String(index+1).padStart(2,'0');document.querySelector('#step-title').textContent=data[0];document.querySelector('#step-description').textContent=data[2];nodes.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});}
function render(key){stopPlayback();current=key;document.querySelector('#trace-id').textContent='/ '+routes[key].label;document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===key)));nodes.replaceChildren();routes[key].steps.forEach((data,i)=>{const b=document.createElement('button');b.className='route-node';const label=document.createElement('small');label.textContent=String(i+1).padStart(2,'0')+' / '+data[1];b.append(label,document.createTextNode(data[0]));b.addEventListener('click',()=>{stopPlayback();selectStep(i)});nodes.append(b)});selectStep(0);}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.route)));
document.querySelector('#next-step').addEventListener('click',()=>{stopPlayback();selectStep((step+1)%routes[current].steps.length)});
document.querySelector('#replay').addEventListener('click',()=>playback?stopPlayback():play());
render('talk');

// Match the homepage's small, pixel-stepped gaze without moving the eye silhouettes.
const faceDiagram = document.querySelector('.mind svg');
const pupils = document.querySelector('.model-pupils');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let gazeFrame = 0;
function resetGaze(){cancelAnimationFrame(gazeFrame);pupils.removeAttribute('transform');}
window.addEventListener('pointermove', event => {
  if(event.pointerType !== 'mouse' || motionPreference.matches) return;
  cancelAnimationFrame(gazeFrame);
  gazeFrame = requestAnimationFrame(() => {
    const box = faceDiagram.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const distance = Math.max(180, Math.hypot(dx, dy));
    pupils.setAttribute('transform', `translate(${Math.round(dx / distance * 3)} ${Math.round(dy / distance * 3)})`);
  });
}, {passive:true});
document.documentElement.addEventListener('pointerleave', resetGaze);
window.addEventListener('blur', resetGaze);
motionPreference.addEventListener('change', resetGaze);
