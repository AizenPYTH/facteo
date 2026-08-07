export function buildSignaturePadHtml(width: number, height: number): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; touch-action: none; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100%; background: #fff; border: 1px solid #d7dce3; border-radius: 12px; }
  </style>
</head>
<body>
  <canvas id="pad"></canvas>
  <script>
    const canvas = document.getElementById('pad');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let hasInk = false;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = ${width} * ratio;
      canvas.height = ${height} * ratio;
      canvas.style.width = '${width}px';
      canvas.style.height = '${height}px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return {
        x: source.clientX - rect.left,
        y: source.clientY - rect.top,
      };
    }

    function startDraw(event) {
      drawing = true;
      const point = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      event.preventDefault();
    }

    function draw(event) {
      if (!drawing) return;
      const point = getPoint(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      if (!hasInk) {
        hasInk = true;
        post({ type: 'ink' });
      }
      event.preventDefault();
    }

    function endDraw() {
      drawing = false;
    }

    function clearPad() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk = false;
      post({ type: 'cleared' });
    }

    function exportSignature() {
      if (!hasInk) {
        post({ type: 'error', message: 'Veuillez signer avant de valider.' });
        return;
      }
      post({ type: 'export', dataUri: canvas.toDataURL('image/png') });
    }

    function post(payload) {
      const message = JSON.stringify(payload);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      }
      // Fallback web (iframe srcDoc) + tests Playwright
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
    }

    window.addEventListener('message', (event) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload && payload.type === 'command' && typeof payload.command === 'string') {
          if (payload.command === 'clearPad') clearPad();
          if (payload.command === 'exportSignature') exportSignature();
        }
      } catch (_) {}
    });

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    window.clearPad = clearPad;
    window.exportSignature = exportSignature;
    resize();
    post({ type: 'ready' });
  </script>
</body>
</html>`;
}
