import { toPng } from 'html-to-image';

var FORMATS = { a0: [841, 1189], dl: [99, 210] };
var PRINT_GUTTER_MM = 20; // matches the @media print .sheet width/height reduction in styles.css
var PNG_DPI = 150;

var pageStyle = document.createElement('style');
document.head.appendChild(pageStyle);

function applyFormat(key) {
  var size = FORMATS[key];
  document.documentElement.style.setProperty('--fmt-w', size[0]);
  document.documentElement.style.setProperty('--fmt-h', size[1]);
  pageStyle.textContent = '@page{size:' + size[0] + 'mm ' + size[1] + 'mm;}';
}

var radios = document.querySelectorAll('input[name="format"]');
for (var i = 0; i < radios.length; i++) {
  radios[i].addEventListener('change', function (e) {
    applyFormat(e.target.value);
  });
}
applyFormat(document.querySelector('input[name="format"]:checked').value);

document.getElementById('export-png').addEventListener('click', function () {
  exportPng();
});

async function exportPng() {
  var button = document.getElementById('export-png');
  var key = document.querySelector('input[name="format"]:checked').value;
  var size = FORMATS[key];
  var sheet = document.querySelector('.sheet');
  var root = document.documentElement;

  var prev = {
    width: sheet.style.width,
    height: sheet.style.height,
    aspectRatio: sheet.style.aspectRatio,
  };

  // Lay the sheet out at true physical size (same formula @media print uses)
  // with print-scaled typography. html-to-image clones computed styles
  // verbatim, so moving the sheet off-screen via position:fixed wouldn't
  // work here — inside the SVG foreignObject it renders into, "fixed" is
  // relative to that foreignObject's own box, so the clone would render
  // itself off its own canvas and capture as blank. An opaque overlay
  // covers the resize instead, and the sheet stays in normal flow.
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--paper-dim);';
  document.body.appendChild(overlay);

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
    root.style.removeProperty('--fmt-scale');
    sheet.style.width = prev.width;
    sheet.style.height = prev.height;
    sheet.style.aspectRatio = prev.aspectRatio;
    overlay.remove();
    button.disabled = false;
    button.textContent = 'Export as PNG…';
  }
}
