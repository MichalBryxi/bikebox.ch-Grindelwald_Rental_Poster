import { toPng } from 'html-to-image';

var FORMATS = { a0: [841, 1189], dl: [99, 210] };
var PRINT_GUTTER_MM = 20; // matches the @media print .sheet width/height reduction in styles.css
var PNG_DPI = 150;
var A4_WIDTH_PX = 210 * 96 / 25.4; // 210mm at 96dpi — the baseline --fmt-scale is relative to

var pageStyle = document.createElement('style');
document.head.appendChild(pageStyle);
var sheet = document.querySelector('.sheet');
var root = document.documentElement;

function applyFormat(key) {
  var size = FORMATS[key];
  root.setAttribute('data-format', key);
  root.style.setProperty('--fmt-w', size[0]);
  root.style.setProperty('--fmt-h', size[1]);
  pageStyle.textContent = '@page{size:' + size[0] + 'mm ' + size[1] + 'mm;}';
}

var radios = document.querySelectorAll('input[name="format"]');
for (var i = 0; i < radios.length; i++) {
  radios[i].addEventListener('change', function (e) {
    applyFormat(e.target.value);
  });
}
applyFormat(document.querySelector('input[name="format"]:checked').value);

// Type/spacing throughout the sheet is sized off --fmt-scale, which has to
// track how large the sheet is *actually rendered* right now rather than
// just which format is selected: .sheet shrinks to fit the window, so on a
// typical screen it's well under true physical size most of the time.
// Without this, fonts stay sized for whatever --fmt-scale last resolved to
// instead of scaling down together with the sheet, and preview proportions
// look wrong until you actually export or print. --fmt-scale is cleared
// around printing (see beforeprint/afterprint below) so the pure-CSS
// @media print rule — which knows the sheet prints at true physical size —
// applies instead of a stale on-screen value (an inline style, which is
// what this sets, would otherwise always win over it).
new ResizeObserver(function (entries) {
  root.style.setProperty('--fmt-scale', String(entries[0].contentRect.width / A4_WIDTH_PX));
}).observe(sheet);

window.addEventListener('beforeprint', function () {
  root.style.removeProperty('--fmt-scale');
});
window.addEventListener('afterprint', function () {
  root.style.setProperty('--fmt-scale', String(sheet.getBoundingClientRect().width / A4_WIDTH_PX));
});

document.getElementById('export-png').addEventListener('click', function () {
  exportPng();
});

async function exportPng() {
  var button = document.getElementById('export-png');
  var key = document.querySelector('input[name="format"]:checked').value;
  var size = FORMATS[key];

  var prev = {
    width: sheet.style.width,
    height: sheet.style.height,
    aspectRatio: sheet.style.aspectRatio,
  };

  // Lay the sheet out at true physical size (same formula @media print uses).
  // html-to-image clones computed styles verbatim, so moving the sheet
  // off-screen via position:fixed wouldn't work here — inside the SVG
  // foreignObject it renders into, "fixed" is relative to that
  // foreignObject's own box, so the clone would render itself off its own
  // canvas and capture as blank. An opaque overlay covers the resize
  // instead, and the sheet stays in normal flow.
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--paper-dim);';
  document.body.appendChild(overlay);

  // Set --fmt-scale directly rather than waiting on the ResizeObserver
  // above (which only fires on the next frame), so the capture below is
  // correct immediately.
  root.style.setProperty('--fmt-scale', String(size[0] / 210));
  sheet.style.width = (size[0] - PRINT_GUTTER_MM) + 'mm';
  sheet.style.height = (size[1] - PRINT_GUTTER_MM) + 'mm';
  sheet.style.aspectRatio = 'auto';

  button.disabled = true;
  button.textContent = 'Exporting…';

  try {
    var dataUrl = await toPng(sheet, {
      pixelRatio: PNG_DPI / 96,
      backgroundColor: '#ffffff',
    });
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'bikebox-flyer-' + key + '.png';
    a.click();
  } finally {
    sheet.style.width = prev.width;
    sheet.style.height = prev.height;
    sheet.style.aspectRatio = prev.aspectRatio;
    overlay.remove();
    button.disabled = false;
    button.textContent = 'Export as PNG…';
  }
}
