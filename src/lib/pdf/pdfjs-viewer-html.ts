const PDFJS_VERSION = '3.11.174';
const VIEWER_BACKGROUND = '#EBEBF0';

export function buildPdfJsViewerHtml(base64: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <style>
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: ${VIEWER_BACKGROUND};
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #scroller {
        width: 100%;
        height: 100%;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-x pan-y;
      }
      #viewport {
        min-height: 100%;
        padding: 20px 16px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 20px;
        transform-origin: top center;
        will-change: transform;
      }
      .page {
        background: #ffffff;
        box-shadow: 0 4px 6px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(15, 23, 42, 0.12);
        border-radius: 2px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .page canvas {
        display: block;
        width: 100%;
        height: auto;
      }
      #status {
        color: #8E8E93;
        font-size: 15px;
        padding: 48px 24px;
        text-align: center;
      }
      #status.error { color: #FF3B30; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"></script>
  </head>
  <body>
    <div id="scroller">
      <div id="viewport">
        <div id="status">Chargement du document…</div>
      </div>
    </div>
    <script>
      (function () {
        const PDF_DATA = atob('${base64}');
        const statusEl = document.getElementById('status');
        const viewportEl = document.getElementById('viewport');
        const scrollerEl = document.getElementById('scroller');

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';

        let scale = 1;
        let minScale = 1;
        let maxScale = 4;
        let lastDistance = 0;
        let panStartX = 0;
        let panStartY = 0;
        let scrollStartX = 0;
        let scrollStartY = 0;
        let isPanning = false;
        let isPinching = false;

        function postMessage(payload) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }

        function getDistance(touches) {
          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }

        function applyScale(nextScale, focalX, focalY) {
          const clamped = Math.min(Math.max(nextScale, minScale), maxScale);
          if (clamped === scale) return;

          const rect = viewportEl.getBoundingClientRect();
          const originX = focalX - rect.left;
          const originY = focalY - rect.top;
          const ratio = clamped / scale;

          scrollerEl.scrollLeft = (scrollerEl.scrollLeft + originX) * ratio - originX;
          scrollerEl.scrollTop = (scrollerEl.scrollTop + originY) * ratio - originY;
          scale = clamped;
          viewportEl.style.transform = 'scale(' + scale + ')';
        }

        scrollerEl.addEventListener('touchstart', function (event) {
          if (event.touches.length === 2) {
            isPinching = true;
            lastDistance = getDistance(event.touches);
            postMessage({ type: 'gesture-start' });
            event.preventDefault();
            return;
          }

          if (event.touches.length === 1 && scale > 1.01) {
            isPanning = true;
            panStartX = event.touches[0].clientX;
            panStartY = event.touches[0].clientY;
            scrollStartX = scrollerEl.scrollLeft;
            scrollStartY = scrollerEl.scrollTop;
            postMessage({ type: 'gesture-start' });
          }
        }, { passive: false });

        scrollerEl.addEventListener('touchmove', function (event) {
          if (event.touches.length === 2) {
            event.preventDefault();
            const distance = getDistance(event.touches);
            const midpointX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            const midpointY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
            applyScale(scale * (distance / lastDistance), midpointX, midpointY);
            lastDistance = distance;
            return;
          }

          if (isPanning && event.touches.length === 1 && scale > 1.01) {
            const dx = event.touches[0].clientX - panStartX;
            const dy = event.touches[0].clientY - panStartY;
            scrollerEl.scrollLeft = scrollStartX - dx;
            scrollerEl.scrollTop = scrollStartY - dy;
          }
        }, { passive: false });

        scrollerEl.addEventListener('touchend', function (event) {
          if (!event.touches.length) {
            isPanning = false;
            isPinching = false;
            postMessage({ type: 'gesture-end' });
          }
        });

        scrollerEl.addEventListener('dblclick', function (event) {
          const next = scale > 1.2 ? 1 : 2;
          applyScale(next, event.clientX, event.clientY);
        });

        async function renderPdf() {
          try {
            const bytes = new Uint8Array(PDF_DATA.length);
            for (let i = 0; i < PDF_DATA.length; i++) {
              bytes[i] = PDF_DATA.charCodeAt(i);
            }

            const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
            statusEl.remove();
            viewportEl.innerHTML = '';

            const containerWidth = Math.max(scrollerEl.clientWidth - 32, 280);
            const containerHeight = Math.max(scrollerEl.clientHeight - 40, 360);
            const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
              const page = await pdf.getPage(pageNumber);
              const baseViewport = page.getViewport({ scale: 1 });
              const fitScale = Math.min(
                containerWidth / baseViewport.width,
                containerHeight / baseViewport.height,
              );
              const renderScale = fitScale * pixelRatio;
              const viewport = page.getViewport({ scale: renderScale });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d', { alpha: false });

              canvas.width = Math.floor(viewport.width);
              canvas.height = Math.floor(viewport.height);
              canvas.style.width = Math.floor(viewport.width / pixelRatio) + 'px';
              canvas.style.height = Math.floor(viewport.height / pixelRatio) + 'px';

              const pageShell = document.createElement('div');
              pageShell.className = 'page';
              pageShell.appendChild(canvas);
              viewportEl.appendChild(pageShell);

              await page.render({ canvasContext: context, viewport }).promise;
            }

            postMessage({ type: 'loaded', pageCount: pdf.numPages });
          } catch (error) {
            statusEl.className = 'error';
            statusEl.textContent = 'Impossible d’afficher le PDF.';
            postMessage({ type: 'error', message: String(error) });
          }
        }

        renderPdf();
      })();
    </script>
  </body>
</html>`;
}
