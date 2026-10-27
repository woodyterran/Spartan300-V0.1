// Keep the phone page at one scale and let only its vertical content area scroll.
(() => {
  const preventZoom = event => {
    if (event.cancelable) event.preventDefault();
  };
  const options = { passive: false, capture: true };
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let gesture = null;
  const verticalScroller = (target, delta) => {
    for (let node = target; node && node !== document.documentElement; node = node.parentElement) {
      if (node.scrollHeight <= node.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(node).overflowY)) continue;
      const limit = node.scrollHeight - node.clientHeight;
      if ((delta > 0 && node.scrollTop < limit - 1) || (delta < 0 && node.scrollTop > 0)) return node;
    }
    return null;
  };
  document.addEventListener('touchstart', event => {
    gesture = null;
    if (event.touches.length !== 1) { preventZoom(event); return; }
    const touch = event.touches[0];
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const interactive = target?.closest('a,button,input,textarea,select,summary,[role="button"],[contenteditable="true"]');
    const editing = Boolean(target?.closest('input,textarea,[contenteditable="true"]'));
    const edge = isIOS && !interactive && (touch.clientX <= 20 || touch.clientX >= window.innerWidth - 20);
    gesture = { x: touch.clientX, y: touch.clientY, lastY: touch.clientY, axis: null, target, edge, editing };
    // Safari begins its history swipe on touchstart. Reserve the page-edge gutter,
    // while keeping button taps and text editing native.
    if (edge) preventZoom(event);
  }, options);
  document.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) { preventZoom(event); return; }
    if (!gesture) return;
    const touch = event.touches[0];
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    const delta = gesture.lastY - touch.clientY;
    gesture.lastY = touch.clientY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 3) return;
    gesture.axis ||= Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (gesture.axis === 'x') {
      // A focused text field may scroll its own text/caret; the page cannot pan.
      if (!gesture.editing) preventZoom(event);
      return;
    }
    const scroller = verticalScroller(gesture.target, delta);
    if (!scroller) { preventZoom(event); return; }
    if (gesture.edge) {
      // Cancelled edge starts need local vertical scrolling instead of page panning.
      preventZoom(event);
      scroller.scrollTop += delta;
    }
  }, options);
  document.addEventListener('touchend', () => { gesture = null; }, { capture: true, passive: true });
  document.addEventListener('touchcancel', () => { gesture = null; }, { capture: true, passive: true });
  for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(name, preventZoom, options);
  }

  const ensureFocusedFieldVisible = () => {
    const field = document.activeElement;
    if (!field?.matches('input, textarea, [contenteditable="true"]')) return;
    const scroller = field.closest('.main, .auth-layout, .sheet');
    if (!scroller) return;
    const target = field.closest('.composer') || field;
    const area = scroller.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const header = scroller.classList.contains('sheet') ? scroller.querySelector('.sheet-head') : null;
    const top = area.top + (header?.offsetHeight || 0) + 16;
    const bottom = area.bottom - 16;
    if (rect.bottom > bottom) scroller.scrollTop += rect.bottom - bottom;
    else if (rect.top < top) scroller.scrollTop -= top - rect.top;
  };

  let frame;
  const updateViewport = () => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--app-height', `${Math.round(viewport?.height || window.innerHeight)}px`);
    root.style.setProperty('--app-top', `${Math.round(viewport?.offsetTop || 0)}px`);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(ensureFocusedFieldVisible);
  };
  window.visualViewport?.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('scroll', updateViewport);
  window.addEventListener('resize', updateViewport);
  window.addEventListener('pageshow', updateViewport);
  document.addEventListener('focusin', () => {
    updateViewport();
    // iOS keyboard transitions continue after focus; keep the whole message row visible.
    setTimeout(updateViewport, 150);
    setTimeout(updateViewport, 350);
  });
  document.addEventListener('focusout', () => requestAnimationFrame(updateViewport));
  updateViewport();
})();
