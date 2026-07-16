const PDFJS_VERSION = '3.11.174';
const VIEWER_BACKGROUND = '#EBEBF0';

type PdfJsViewerInput =
  | { mode: 'base64'; base64: string }
  | { mode: 'url'; pdfUrl: string };

export function buildPdfJsViewerHtml(input: PdfJsViewerInput): string {
  const pdfUrl = input.mode === 'url' ? input.pdfUrl : '';
  const pdfDataLiteral =
    input.mode === 'base64' ? `atob('${input.base64}')` : 'null';

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
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
      }
      #viewport {
        min-height: 100%;
        padding: 20px 16px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .page {
        background: #ffffff;
        box-shadow: 0 4px 6px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(15, 23, 42, 0.12);
        border-radius: 2px;
        flex-shrink: 0;
        line-height: 0;
      }
      .page canvas {
        display: block;
      }
      #status {
        color: #8E8E93;
        font-size: 15px;
        padding: 48px 24px;
        text-align: center;
      }
      #status.error { color: #FF3B30; }
    </style>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js"
      onerror="window.__pdfJsLoadFailed = true"
    ></script>
  </head>
  <body>
    <div id="scroller">
      <div id="viewport">
        <div id="status">Chargement du document…</div>
      </div>
    </div>
    <script>
      (function () {
        const PDF_URL = ${pdfUrl ? `'${pdfUrl.replace(/'/g, "\\'")}'` : 'null'};
        const PDF_DATA = ${pdfDataLiteral};
        const statusEl = document.getElementById('status');
        const viewportEl = document.getElementById('viewport');
        const scrollerEl = document.getElementById('scroller');

        let pdfDoc = null;
        let zoomMultiplier = 1;
        let fitScale = 1;
        let minZoom = 0.5;
        let maxZoom = 3;
        let renderGeneration = 0;
        let lastDistance = 0;
        let isPinching = false;
        let resizeTimer = null;

        function postMessage(payload) {
          const serialized = JSON.stringify(payload);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(serialized);
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(serialized, '*');
          }
        }

        function getContainerSize() {
          const width = Math.max(scrollerEl.clientWidth - 32, 120);
          const height = Math.max(scrollerEl.clientHeight - 40, 120);
          return { width, height };
        }

        function getDistance(touches) {
          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }

        async function loadPdfDocument() {
          if (window.__pdfJsLoadFailed || typeof pdfjsLib === 'undefined') {
            throw new Error('pdf.js indisponible');
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js';

          if (PDF_URL) {
            return pdfjsLib.getDocument({ url: PDF_URL }).promise;
          }

          const bytes = new Uint8Array(PDF_DATA.length);
          for (let i = 0; i < PDF_DATA.length; i++) {
            bytes[i] = PDF_DATA.charCodeAt(i);
          }

          return pdfjsLib.getDocument({ data: bytes }).promise;
        }

        async function renderPages() {
          if (!pdfDoc) {
            return;
          }

          const generation = ++renderGeneration;
          const { width: containerWidth, height: containerHeight } = getContainerSize();
          const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 3);

          viewportEl.innerHTML = '';

          for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
            if (generation !== renderGeneration) {
              return;
            }

            const page = await pdfDoc.getPage(pageNumber);
            const baseViewport = page.getViewport({ scale: 1 });
            fitScale = Math.min(
              containerWidth / baseViewport.width,
              containerHeight / baseViewport.height,
            );

            const renderScale = fitScale * zoomMultiplier * pixelRatio;
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

          postMessage({ type: 'loaded', pageCount: pdfDoc.numPages });
        }

        function scheduleRender() {
          if (resizeTimer) {
            clearTimeout(resizeTimer);
          }

          resizeTimer = setTimeout(function () {
            void renderPages();
          }, 120);
        }

        function setZoom(nextZoom, focalX, focalY) {
          const clamped = Math.min(Math.max(nextZoom, minZoom), maxZoom);
          if (Math.abs(clamped - zoomMultiplier) < 0.01) {
            return;
          }

          const beforeX = scrollerEl.scrollLeft + (focalX || scrollerEl.clientWidth / 2);
          const beforeY = scrollerEl.scrollTop + (focalY || scrollerEl.clientHeight / 2);
          const ratio = clamped / zoomMultiplier;
          zoomMultiplier = clamped;

          void renderPages().then(function () {
            scrollerEl.scrollLeft = beforeX * ratio - (focalX || scrollerEl.clientWidth / 2);
            scrollerEl.scrollTop = beforeY * ratio - (focalY || scrollerEl.clientHeight / 2);
          });
        }

        scrollerEl.addEventListener('touchstart', function (event) {
          if (event.touches.length === 2) {
            isPinching = true;
            lastDistance = getDistance(event.touches);
            postMessage({ type: 'gesture-start' });
            event.preventDefault();
          }
        }, { passive: false });

        scrollerEl.addEventListener('touchmove', function (event) {
          if (event.touches.length === 2) {
            event.preventDefault();
            const distance = getDistance(event.touches);
            const midpointX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            const midpointY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
            const next = zoomMultiplier * (distance / lastDistance);
            lastDistance = distance;
            setZoom(next, midpointX, midpointY);
          }
        }, { passive: false });

        scrollerEl.addEventListener('touchend', function () {
          if (isPinching) {
            isPinching = false;
            postMessage({ type: 'gesture-end' });
          }
        });

        scrollerEl.addEventListener('dblclick', function (event) {
          const next = zoomMultiplier > 1.2 ? 1 : 2;
          setZoom(next, event.clientX, event.clientY);
        });

        scrollerEl.addEventListener('wheel', function (event) {
          if (!event.ctrlKey && !event.metaKey) {
            return;
          }

          event.preventDefault();
          const delta = event.deltaY > 0 ? 0.92 : 1.08;
          setZoom(zoomMultiplier * delta, event.clientX, event.clientY);
        }, { passive: false });

        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(function () {
            scheduleRender();
          });
          observer.observe(scrollerEl);
        } else {
          window.addEventListener('resize', scheduleRender);
        }

        async function boot() {
          try {
            await new Promise(function (resolve) {
              requestAnimationFrame(function () {
                requestAnimationFrame(resolve);
              });
            });

            pdfDoc = await loadPdfDocument();
            if (statusEl) {
              statusEl.remove();
            }
            zoomMultiplier = 1;
            await renderPages();
          } catch (error) {
            if (statusEl) {
              statusEl.className = 'error';
              statusEl.textContent = 'Impossible d’afficher le PDF.';
            }
            postMessage({ type: 'error', message: String(error) });
          }
        }

        boot();
      })();
    </script>
  </body>
</html>`;
}
