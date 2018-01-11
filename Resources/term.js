'use strict';

hterm.defaultStorage = new lib.Storage.Memory();

function _postMessage(op, data) {
  window.webkit.messageHandlers.interOp.postMessage({ op, data });
}

hterm.copySelectionToClipboard = function(document, content) {
  document.getSelection().removeAllRanges();
  _postMessage('copy', { content });
};

// Speedup a little bit.
hterm.Screen.prototype.syncSelectionCaret = function() {};

var t = new hterm.Terminal('blink');

t.onTerminalReady = function() {
  _postMessage('terminalReady', {
    cols: t.screenSize.width,
    rows: t.screenSize.height,
  });

  t.io.onTerminalResize = function(cols, rows) {
    _postMessage('sigwinch', { cols, rows });
  };

  t.uninstallKeyboard();
};

function term_set(key, value) {
  t.prefs_.set(key, value);
}

function term_init() {
  term_set('audible-bell-sound', '');
  term_set('receive-encoding', 'raw'); // we are UTF8
  term_set('allow-images-inline', true); // need to make it work
}

function term_decorate(element) {
  t.decorate(element);
}

function term_write(data) {
  t.interpret(data);
}

function term_clear() {
  t.clear();
}

function term_reset() {
  t.reset();
}

function term_focus() {
  t.onFocusChange_(true);
}

function term_blur() {
  t.onFocusChange_(false);
}

function term_setWidth(cols) {
  t.setWidth(cols);
}

function term_increaseFontSize() {
  var size = t.getFontSize();
  term_setFontSize(++size);
}

function term_decreaseFontSize() {
  var size = t.getFontSize();
  term_setFontSize(--size);
}

function term_resetFontSize() {
  term_setFontSize();
}

var _fontSizeOnScaleStart = 0;

function term_scaleStart() {
  _fontSizeOnScaleStart = t.getFontSize();
}

function term_scale(scale) {
  var minScale = 0.5;
  var maxScale = 2.0;
  scale = Math.max(minScale, Math.min(maxScale, scale));
  term_setFontSize(Math.round(_fontSizeOnScaleStart * scale));
}

function term_setFontSize(size) {
  term_set('font-size', size);
  _postMessage('fontSizeChanged', { size: parseInt(size) });
}

function term_setCursorBlink(state) {
  term_set('cursor-blink', state);
}

function term_setFontFamily(name) {
  term_set('font-family', name + ', Menlo');
}

function term_appendUserCss(css) {
  var current = t.prefs_.get('user-css');
  if (!current) {
    current = 'data:text/css;utf-8,';
  }
  current += '\n' + css;
  term_set('user-css', current);
}

function term_loadFontFromCss(url, name) {
  WebFont.load({
    custom: {
      families: [name],
      urls: [url],
    },
    active: function() {
      t.syncFontFamily();
    },
  });
  term_setFontFamily(name);
}