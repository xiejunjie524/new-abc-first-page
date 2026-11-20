const editor = document.querySelector('#editor');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const themes = new Map([
  ['lake', ['#176b58', '#f0f7f2']],
  ['clay', ['#a04336', '#fcf4ed']],
  ['ink', ['#394f98', '#eff2fc']],
]);
const photoUrl = new URL('./lake.jpg', document.baseURI).href;

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderPage(imageUrl) {
  const fields = new FormData(editor);
  const title = escapeHtml(fields.get('title').trim() || '\u6211\u7684\u7f51\u9875');
  const description = escapeHtml(fields.get('description').trim());
  const [accent, background] = themes.get(fields.get('theme')) || themes.get('lake');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: ${background}; color: #22312b; font: 16px/1.6 system-ui, "Microsoft YaHei", sans-serif; }
    main { max-width: 960px; margin: 0 auto; padding: 24px; }
    img { display: block; width: 100%; aspect-ratio: 2.35; object-fit: cover; border-radius: 6px; }
    h1 { margin: 16px 0 5px; color: ${accent}; font-size: 30px; line-height: 1.3; overflow-wrap: anywhere; }
    p { margin: 0; max-width: 62ch; white-space: pre-wrap; overflow-wrap: anywhere; }
    @media (max-width: 460px) { main { padding: 17px; } img { aspect-ratio: 1.65; } h1 { font-size: 23px; } }
  </style>
</head>
<body>
  <main>
    <img src="${escapeHtml(imageUrl)}" alt="\u5c71\u95f4\u7684\u6e56\u6cca\u548c\u5c0f\u5c4b">
    <h1>${title}</h1>
    ${description ? `<p>${description}</p>` : ''}
  </main>
</body>
</html>`;
}

let previewTimer;
function refreshPreview() {
  clearTimeout(previewTimer);
  preview.srcdoc = renderPage(photoUrl);
}

editor.addEventListener('input', () => {
  status.textContent = '';
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 90);
});
editor.addEventListener('reset', () => {
  status.textContent = '';
  requestAnimationFrame(refreshPreview);
});
editor.addEventListener('submit', (event) => event.preventDefault());

async function embeddedPhoto() {
  if (location.protocol === 'file:') return null;
  const response = await fetch(photoUrl);
  if (!response.ok) throw new Error('Could not load sample photo');
  const image = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(image);
  });
}

document.querySelector('#download').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const image = await embeddedPhoto().catch(() => null);
    const fallback = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&h=660&q=82';
    const file = new Blob([renderPage(image || fallback)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '\u5df2\u751f\u6210 index.html';
  } finally {
    button.disabled = false;
  }
});

window.lucide?.createIcons();
refreshPreview();
