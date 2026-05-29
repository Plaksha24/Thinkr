let currentMode = 'braindump';
let canvasCtx = null;
let isDrawing = false;
let currentTool = 'draw';
let canvas = null;
 
// ── Mode Switching ──────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  
  // Update UI
  document.querySelectorAll('.mode').forEach(m => m.classList.remove('active'));
  document.getElementById(mode + 'Mode').classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (mode === 'braindump') {
    document.getElementById('navBrain').classList.add('active');
  } else {
    document.getElementById('navMood').classList.add('active');
  }
  
  // Initialize canvas if moodboard
  if (mode === 'moodboard' && !canvas) {
    initCanvas();
  }
}
 
// ── BrainDump Functions ─────────────────────────
const dumpInput = document.getElementById('dumpInput');
const charCount = document.getElementById('charCount');
 
dumpInput.addEventListener('input', () => {
  const words = dumpInput.value.trim().split(/\s+/).filter(w => w.length > 0).length;
  charCount.textContent = words + ' word' + (words !== 1 ? 's' : '');
});
 
async function organize() {
  const text = dumpInput.value.trim();
  if (!text) {
    showError('Please type something first!');
    return;
  }
 
  const btn = document.getElementById('organizeBtn');
  btn.disabled = true;
  showLoading('Organizing your thoughts...');
 
  try {
    const response = await fetch('/api/organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
 
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
 
    const data = await response.json();
    if (data.error) throw new Error(data.error);
 
    displayResults(data.categories);
    document.getElementById('resultsEmpty').style.display = 'none';
    document.getElementById('resultsContent').style.display = 'block';
 
  } catch (err) {
    showError(err.message || 'Something went wrong');
  } finally {
    btn.disabled = false;
    hideLoading();
  }
}
 
function displayResults(categories) {
  const output = document.getElementById('categoriesOutput');
  output.innerHTML = '';
 
  for (const [category, items] of Object.entries(categories)) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <div class="category-title">${category}</div>
      <ul class="category-items">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
    output.appendChild(card);
  }
}
 
function copyResults() {
  const categories = document.getElementById('categoriesOutput');
  const text = categories.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  });
}
 
function clearAll() {
  dumpInput.value = '';
  charCount.textContent = '0 words';
  document.getElementById('resultsEmpty').style.display = 'block';
  document.getElementById('resultsContent').style.display = 'none';
  document.getElementById('errorBox').classList.remove('visible');
}
 
function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.classList.add('visible');
}
 
// ── MoodBoard Functions ─────────────────────────
function initCanvas() {
  canvas = document.getElementById('moodCanvas');
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = Math.min(500, window.innerHeight * 0.6);
  
  canvasCtx = canvas.getContext('2d');
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseout', stopDraw);
}
 
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tool' + tool.charAt(0).toUpperCase() + tool.slice(1)).classList.add('active');
}
 
function startDraw(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  canvasCtx.beginPath();
  canvasCtx.moveTo(x, y);
}
 
function draw(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const color = document.getElementById('colorPicker').value;
  const size = document.getElementById('brushSize').value;
  
  if (currentTool === 'draw') {
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = size;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    canvasCtx.lineTo(x, y);
    canvasCtx.stroke();
  } else if (currentTool === 'erase') {
    canvasCtx.clearRect(x - size/2, y - size/2, size, size);
  }
}
 
function stopDraw() {
  isDrawing = false;
  canvasCtx.closePath();
}
 
function clearCanvas() {
  if (confirm('Clear everything?')) {
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
 
function downloadCanvas() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = 'thinkr-board.png';
  link.click();
}
 
function addImageToCanvas(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      canvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
 
async function generatePalette() {
  const btn = document.getElementById('paletteBtn');
  btn.disabled = true;
  showLoading('Extracting your palette...');
 
  try {
    const imageData = canvas.toDataURL('image/png');
    const base64 = imageData.split(',')[1];
 
    const response = await fetch('/api/palette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
    });
 
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
 
    const data = await response.json();
    if (data.error) throw new Error(data.error);
 
    displayPalette(data);
    document.getElementById('paletteEmpty').style.display = 'none';
    document.getElementById('paletteContent').style.display = 'block';
 
  } catch (err) {
    const errorBox = document.getElementById('paletteError');
    errorBox.textContent = err.message || 'Failed to generate palette';
    errorBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    hideLoading();
  }
}
 
function displayPalette(data) {
  const colorsHtml = data.colors.map(color => `
    <div class="color-swatch">
      <div class="swatch-box" style="background:${color.hex};" title="Click to copy" onclick="copyColor('${color.hex}')"></div>
      <div class="swatch-info">
        <div class="swatch-hex">${color.hex}</div>
        <div class="swatch-name">${color.name}</div>
      </div>
    </div>
  `).join('');
 
  const vibeHtml = `
    <h4>Vibe</h4>
    <p>${data.vibe}</p>
    <div class="font-suggestion">
      <strong>Fonts:</strong> ${data.fonts}
    </div>
  `;
 
  document.getElementById('paletteColors').innerHTML = colorsHtml;
  document.getElementById('paletteDetails').innerHTML = vibeHtml;
}
 
function copyColor(hex) {
  navigator.clipboard.writeText(hex).then(() => {
    alert(hex + ' copied!');
  });
}
 
// ── Loading ─────────────────────────────────────
function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  document.getElementById('loadingText').textContent = text;
  overlay.classList.add('visible');
}
 
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('visible');
}