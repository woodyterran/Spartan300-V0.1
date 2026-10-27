import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../viewport.js', import.meta.url), 'utf8');
function touchHarness() {
  const listeners = new Map();
  const root = { style: { setProperty() {} } };
  const scroller = { parentElement: root, scrollHeight: 1800, clientHeight: 600, scrollTop: 100, overflowY: 'auto' };
  const element = tag => ({
    nodeType: 1, parentElement: scroller, scrollHeight: 20, clientHeight: 20,
    closest(selectors) { return selectors.split(',').some(s => s.trim() === tag) ? this : null; },
  });
  const document = {
    documentElement: root, activeElement: null,
    addEventListener(type, fn, options) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, options });
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { userAgent: 'iPhone Safari', platform: 'iPhone', maxTouchPoints: 5 },
    window: { innerWidth: 390, innerHeight: 844, addEventListener() {} },
    getComputedStyle: node => ({ overflowY: node.overflowY || 'visible' }),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout() {},
  });
  const emit = (type, x, y, target, fingers = 1) => {
    const event = {
      target, cancelable: true, prevented: false,
      touches: Array.from({ length: fingers }, () => ({ clientX: x, clientY: y })),
      preventDefault() { this.prevented = true; },
    };
    for (const { fn } of listeners.get(type) || []) fn(event);
    return event;
  };
  return { emit, element, scroller, listeners };
}

test('horizontal page drag is cancelled by a non-passive handler', () => {
  const h = touchHarness(), target = h.element('div');
  assert.equal(h.emit('touchstart', 180, 300, target).prevented, false);
  assert.equal(h.emit('touchmove', 215, 302, target).prevented, true);
  const options = h.listeners.get('touchmove')[0].options;
  assert.equal(options.passive, false); assert.equal(options.capture, true);
});

test('interior vertical scrolling remains native', () => {
  const h = touchHarness(), target = h.element('div');
  h.emit('touchstart', 180, 300, target);
  assert.equal(h.emit('touchmove', 182, 240, target).prevented, false);
  assert.equal(h.scroller.scrollTop, 100);
});

test('vertical overscroll at a content boundary cannot pan the document', () => {
  const h = touchHarness(), target = h.element('div');
  h.scroller.scrollTop = 1200;
  h.emit('touchstart', 180, 300, target);
  assert.equal(h.emit('touchmove', 181, 250, target).prevented, true);
});

test('iPhone edge gutter blocks navigation starts but supports local vertical scrolling', () => {
  const h = touchHarness(), target = h.element('div');
  assert.equal(h.emit('touchstart', 5, 300, target).prevented, true);
  assert.equal(h.emit('touchmove', 6, 240, target).prevented, true);
  assert.equal(h.scroller.scrollTop, 160);
});

test('buttons and text fields at the edge retain their native taps', () => {
  const h = touchHarness();
  assert.equal(h.emit('touchstart', 5, 300, h.element('button')).prevented, false);
  assert.equal(h.emit('touchstart', 5, 300, h.element('input')).prevented, false);
});

test('horizontal caret movement inside a text field is preserved', () => {
  const h = touchHarness(), target = h.element('input');
  h.emit('touchstart', 80, 300, target);
  assert.equal(h.emit('touchmove', 120, 301, target).prevented, false);
});

test('pinch gestures remain blocked', () => {
  const h = touchHarness(), target = h.element('div');
  assert.equal(h.emit('touchstart', 180, 300, target, 2).prevented, true);
  assert.equal(h.emit('touchmove', 200, 300, target, 2).prevented, true);
});
