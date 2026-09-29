import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

var FORMATS = { a1: [594, 841], dl: [99, 210], big: [700, 1000] };
var BLEED_MM = 3; // print-ready PDF: 3mm bleed added beyond the trim size on every side
var MARK_LEN_MM = 5; // crop-mark stroke length, drawn in an extra margin beyond the bleed box
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
document.getElementById('export-pdf').addEventListener('click', function () {
  exportPdf();
});

// Lays the sheet out at a given physical size (same technique @media print
// uses) for the duration of `fn`, then restores it. html-to-image clones
// computed styles verbatim, so moving the sheet off-screen via
// position:fixed wouldn't work here — inside the SVG foreignObject it
// renders into, "fixed" is relative to that foreignObject's own box, so
// the clone would render itself off its own canvas and capture as blank.
// An opaque overlay covers the resize instead, and the sheet stays in
// normal flow. `scaleRefWidthMm` drives --fmt-scale (the baseline for
// fixed-px clamp minimums) independently of the sheet's own mm size, so a
// bleed-enlarged sheet (see exportPdf) doesn't itself skew that scale —
// it should always track the nominal format width.
async function withSheetSized(sheetSizeMm, scaleRefWidthMm, fn) {
  var prev = {
    width: sheet.style.width,
    height: sheet.style.height,
    aspectRatio: sheet.style.aspectRatio,
  };

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:var(--paper-dim);';
  document.body.appendChild(overlay);

  // Set --fmt-scale directly rather than waiting on the ResizeObserver
  // above (which only fires on the next frame), so the capture below is
  // correct immediately.
  root.style.setProperty('--fmt-scale', String(scaleRefWidthMm / 210));
  sheet.style.width = sheetSizeMm[0] + 'mm';
  sheet.style.height = sheetSizeMm[1] + 'mm';
  sheet.style.aspectRatio = 'auto';

  try {
    return await fn();
  } finally {
    sheet.style.width = prev.width;
    sheet.style.height = prev.height;
    sheet.style.aspectRatio = prev.aspectRatio;
    overlay.remove();
  }
}

// e.g. size [594, 841] + 'pdf' -> 'BikeBox_Grindelwald_Rental_594x841.pdf'
function exportFilename(size, ext) {
  return 'BikeBox_Grindelwald_Rental_' + size[0] + 'x' + size[1] + '.' + ext;
}

async function exportPng() {
  var button = document.getElementById('export-png');
  var key = document.querySelector('input[name="format"]:checked').value;
  var size = FORMATS[key];

  button.disabled = true;
  button.textContent = 'Exporting…';

  try {
    // Exact trim size, filling the image edge-to-edge — no inner padding.
    await withSheetSized(size, size[0], async function () {
      var dataUrl = await toPng(sheet, {
        pixelRatio: PNG_DPI / 96,
        backgroundColor: '#ffffff',
      });
      var a = document.createElement('a');
      a.href = dataUrl;
      a.download = exportFilename(size, 'png');
      a.click();
    });
  } finally {
    button.disabled = false;
    button.textContent = 'Export as PNG';
  }
}

// Draws standard corner crop marks: a horizontal + vertical stroke at each
// of the 4 trim corners, each running outward from the bleed box edge for
// `markLen`. They live entirely in the extra margin outside the bleed box
// (added on top of it via `outset`), so they never touch bleed artwork —
// the bleed box itself is what keeps them clear of the exact trim corner.
function drawCropMarks(pdf, pageW, pageH, outset, markLen) {
  var tx = outset;
  var tx2 = pageW - outset;
  var ty = outset;
  var ty2 = pageH - outset;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.15);
  [
    [0, ty, markLen, ty], // top-left, horizontal
    [tx, 0, tx, markLen], // top-left, vertical
    [pageW - markLen, ty, pageW, ty], // top-right, horizontal
    [tx2, 0, tx2, markLen], // top-right, vertical
    [0, ty2, markLen, ty2], // bottom-left, horizontal
    [tx, pageH - markLen, tx, pageH], // bottom-left, vertical
    [pageW - markLen, ty2, pageW, ty2], // bottom-right, horizontal
    [tx2, pageH - markLen, tx2, pageH], // bottom-right, vertical
  ].forEach(function (m) {
    pdf.line(m[0], m[1], m[2], m[3]);
  });
}

async function exportPdf() {
  var button = document.getElementById('export-pdf');
  var key = document.querySelector('input[name="format"]:checked').value;
  var size = FORMATS[key];

  button.disabled = true;
  button.textContent = 'Exporting…';

  try {
    // Render the sheet itself at trim + 2×BLEED_MM, so the design's own
    // artwork (hero photo, solid backgrounds) fills all the way to the
    // bleed edge instead of leaving blank padding there — that's what
    // makes it real bleed rather than an oversized white border.
    var bleedW = size[0] + BLEED_MM * 2;
    var bleedH = size[1] + BLEED_MM * 2;

    await withSheetSized([bleedW, bleedH], size[0], async function () {
      var dataUrl = await toPng(sheet, {
        pixelRatio: PNG_DPI / 96,
        backgroundColor: '#ffffff',
      });

      // The PDF page adds MARK_LEN_MM more of blank margin around the
      // bleed box, purely to give the crop marks room to be drawn outside
      // the artwork — trimming at those marks lands exactly on the
      // intended trim size, with BLEED_MM of real artwork having covered
      // the cut.
      var pageW = bleedW + MARK_LEN_MM * 2;
      var pageH = bleedH + MARK_LEN_MM * 2;

      var pdf = new jsPDF({
        unit: 'mm',
        format: [pageW, pageH],
        orientation: pageW <= pageH ? 'p' : 'l',
        compress: true,
      });
      pdf.addImage(dataUrl, 'PNG', MARK_LEN_MM, MARK_LEN_MM, bleedW, bleedH);
      drawCropMarks(pdf, pageW, pageH, BLEED_MM + MARK_LEN_MM, MARK_LEN_MM);
      pdf.save(exportFilename(size, 'pdf'));
    });
  } finally {
    button.disabled = false;
    button.textContent = 'Export as PDF';
  }
}
