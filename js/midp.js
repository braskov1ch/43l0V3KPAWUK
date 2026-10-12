'use strict';
// Browser implementation of the parts of MIDP 2.0 (lcdui / media / rms) the game uses.

const SCREEN_W = 240, SCREEN_H = 320;

class J_Displayable extends J_Object {
  $init$() { return this; }
  setCommandListener$CommandListener(l) { this.$cmdListener = l; }
  addCommand$Command(c) {}
  removeCommand$Command(c) {}
  getWidth$() { return SCREEN_W; }
  getHeight$() { return SCREEN_H; }
  isShown$() { return J_Display.INSTANCE.cur === this && !document.hidden; }
}
class J_Canvas extends J_Displayable {
  $init$() { this.$dirty = true; return this; }
  repaint$() { this.$dirty = true; }
  repaint$int_int_int_int() { this.$dirty = true; }
  serviceRepaints$() { if (this.$dirty) this.$paintNow(); }
  setFullScreenMode$boolean(b) {}
  getGameAction$int(k) {
    switch (k) { case -1: return 1; case -2: return 6; case -3: return 2; case -4: return 5; case -5: return 8; default: return 0; }
  }
  $paintNow() {
    this.$dirty = false;
    const g = J_Display.INSTANCE.$graphics();
    g.$reset();
    this.paint$Graphics(g);
  }
  showNotify$() {}
  hideNotify$() {}
  keyPressed$int(k) {}
  keyRepeated$int(k) {}
  keyReleased$int(k) {}
}
class J_GameCanvas extends J_Canvas {
  $init$boolean(b) { this.$dirty = true; return this; }
  getGraphics$() { return J_Display.INSTANCE.$graphics(); }
  flushGraphics$() {}
  getKeyStates$() { return 0; }
  paint$Graphics(g) {}
}
class J_List extends J_Displayable { getSelectedIndex$() { return 0; } }
class J_Command extends J_Object {
  $init$String_int_int(l, t, p) { this.l = l; this.t = t; this.p = p; return this; }
  getLabel$() { return this.l; }
  getPriority$() { return this.p; }
}
class J_MIDlet extends J_Object {
  $init$() { return this; }
  getAppProperty$String(k) { return (window.$props && window.$props[k]) || null; }
  platformRequest$String(u) { return false; }
  notifyDestroyed$() { if (window.$onDestroyed) window.$onDestroyed(); }
}

class J_Display extends J_Object {
  static getDisplay$MIDlet(m) { return J_Display.INSTANCE; }
  vibrate$int(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} return true; }
  getCurrent$() { return this.cur || null; }
  setCurrent$Displayable(d) {
    if (this.cur && this.cur !== d && this.cur.hideNotify$) { try { this.cur.hideNotify$(); } catch (e) { console.error(e); } }
    const changed = this.cur !== d;
    this.cur = d;
    if (d && changed) { try { d.showNotify$(); } catch (e) { console.error(e); } }
    if (d && d.repaint$) d.repaint$();
  }
  $attach(canvas) { this.canvas = canvas; this.g = new J_Graphics(canvas); }
  $graphics() { return this.g; }
}
J_Display.INSTANCE = new J_Display();

// ---------- fonts ----------
class J_Font extends J_Object {
  constructor(face, style, size) {
    super();
    this.px = size === 8 ? 10 : size === 16 ? 14 : 12;
    this.css = ((style & 1) ? 'bold ' : '') + ((style & 2) ? 'italic ' : '') + this.px + 'px sans-serif';
    this.ascent = this.px; this.height = this.px + 3;
  }
  static getDefaultFont$() { return J_Font.DEFAULT; }
  static getFont$int_int_int(f, s, z) { return new J_Font(f, s, z); }
  $measure(s) { const c = J_Font.mctx; c.font = this.css; return Math.ceil(c.measureText(s).width); }
  stringWidth$String(s) { return this.$measure(s); }
  charWidth$char(c) { return this.$measure(String.fromCharCode(c)); }
  getHeight$() { return this.height; }
  getBaselinePosition$() { return this.ascent; }
  charsWidth$charA_int_int(a, o, l) { let t = ''; for (let i = 0; i < l; i++) t += String.fromCharCode(a[o + i]); return this.$measure(t); }
}
J_Font.mctx = document.createElement('canvas').getContext('2d');
J_Font.DEFAULT = new J_Font(0, 0, 0);

// ---------- images ----------
class J_Image extends J_Object {
  static $fromRGBA(w, h, rgba) {
    const im = new J_Image(); im.w = w; im.h = h; im.mutable = false;
    im.cv = document.createElement('canvas'); im.cv.width = w; im.cv.height = h;
    im.cv.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
    return im;
  }
  static createImage$int_int(w, h) {
    const im = new J_Image(); im.w = w; im.h = h; im.mutable = true;
    im.cv = document.createElement('canvas'); im.cv.width = Math.max(1, w); im.cv.height = Math.max(1, h);
    const c = im.cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    return im;
  }
  static createRGBImage$intA_int_int_boolean(rgb, w, h, alpha) {
    const px = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const v = rgb[i]; px[i * 4] = (v >> 16) & 255; px[i * 4 + 1] = (v >> 8) & 255; px[i * 4 + 2] = v & 255; px[i * 4 + 3] = alpha ? (v >>> 24) : 255;
    }
    return J_Image.$fromRGBA(w, h, px);
  }
  static createImage$String(path) {
    const b = $res.get(path);
    if (!b) throw new J_IOException().$init$String(path);
    return J_Image.createImage$byteA_int_int(b, 0, b.length);
  }
  static createImage$byteA_int_int(bytes, off, len) {
    const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    let d;
    try { d = $decodePNG(u.subarray(off, off + len)); } catch (e) { if (location.search.indexOf('debug') >= 0) console.log('BADIMG', off, len, u.length, Array.from(u.subarray(off, off + 12)).join(','), e.message); throw new J_IllegalArgumentException().$init$String('bad image: ' + e.message); }
    return J_Image.$fromRGBA(d.w, d.h, d.rgba);
  }
  getGraphics$() { if (!this.g) this.g = new J_Graphics(this.cv); this.g.$reset(); return this.g; }
  getWidth$() { return this.w; }
  getHeight$() { return this.h; }
}
class J_IllegalArgumentException extends J_RuntimeException {}

// ---------- graphics ----------
class J_Graphics extends J_Object {
  constructor(cv) {
    super(); this.cv = cv; this.W = cv.width; this.H = cv.height;
    this.ctx = cv.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.ctx.save(); this.$reset();
  }
  $reset() {
    this.ctx.restore(); this.ctx.save();
    this.tx = 0; this.ty = 0; this.cx = 0; this.cy = 0; this.cw = this.W; this.ch = this.H;
    this.font = J_Font.DEFAULT; this.setColor$int(0);
  }
  setColor$int(rgb) { this.rgb = rgb; const s = '#' + ('00000' + (rgb & 0xFFFFFF).toString(16)).slice(-6); this.ctx.fillStyle = s; this.ctx.strokeStyle = s; this.style = s; }
  getColor$() { return this.rgb & 0xFFFFFF; }
  setFont$Font(f) { this.font = f; }
  getFont$() { return this.font; }
  setClip$int_int_int_int(x, y, w, h) {
    const c = this.ctx;
    c.restore(); c.save(); c.fillStyle = this.style; c.strokeStyle = this.style;
    c.beginPath(); c.rect(x + this.tx, y + this.ty, Math.max(0, w), Math.max(0, h)); c.clip();
    c.translate(this.tx, this.ty);
    this.cx = x; this.cy = y; this.cw = w; this.ch = h;
  }
  translate$int_int(x, y) { this.tx += x; this.ty += y; this.ctx.translate(x, y); this.cx -= x; this.cy -= y; }
  getTranslateX$() { return this.tx; } getTranslateY$() { return this.ty; }
  getClipX$() { return this.cx; } getClipY$() { return this.cy; } getClipWidth$() { return this.cw; } getClipHeight$() { return this.ch; }
  fillRect$int_int_int_int(x, y, w, h) { if (w > 0 && h > 0) this.ctx.fillRect(x, y, w, h); }
  drawRect$int_int_int_int(x, y, w, h) {
    if (w < 0 || h < 0) return; const c = this.ctx;
    c.fillRect(x, y, w + 1, 1); if (h > 0) c.fillRect(x, y + h, w + 1, 1);
    if (h > 1) { c.fillRect(x, y + 1, 1, h - 1); if (w > 0) c.fillRect(x + w, y + 1, 1, h - 1); }
  }
  drawLine$int_int_int_int(x1, y1, x2, y2) {
    const c = this.ctx;
    if (x1 === x2) { c.fillRect(x1, Math.min(y1, y2), 1, Math.abs(y2 - y1) + 1); return; }
    if (y1 === y2) { c.fillRect(Math.min(x1, x2), y1, Math.abs(x2 - x1) + 1, 1); return; }
    let dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1, err = dx + dy;
    for (;;) { c.fillRect(x1, y1, 1, 1); if (x1 === x2 && y1 === y2) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x1 += sx; } if (e2 <= dx) { err += dx; y1 += sy; } }
  }
  drawArc$int_int_int_int_int_int(x, y, w, h, s, a) {
    if (w < 0 || h < 0) return; const c = this.ctx; c.lineWidth = 1; c.beginPath();
    const r = Math.PI / 180; c.ellipse(x + w / 2 + 0.5, y + h / 2 + 0.5, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, -s * r, -(s + a) * r, a > 0); c.stroke();
  }
  $text(s, x, y, a) {
    const f = this.font, c = this.ctx; c.font = f.css; c.textBaseline = 'alphabetic';
    const w = Math.ceil(c.measureText(s).width);
    if (a & 8) x -= w; else if (a & 1) x -= (w >> 1);
    let by;
    if (a & 64) by = y; else if (a & 32) by = y - f.height + f.ascent; else if (a & 2) by = y - (f.height >> 1) + f.ascent; else by = y + f.ascent;
    c.fillText(s, x, by);
  }
  drawString$String_int_int_int(s, x, y, a) { this.$text(s, x, y, a); }
  drawChars$charA_int_int_int_int_int(arr, o, l, x, y, a) { let t = ''; for (let i = 0; i < l; i++) t += String.fromCharCode(arr[o + i]); this.$text(t, x, y, a); }
  drawImage$Image_int_int_int(img, x, y, a) {
    if (!img) return;
    if (a & 8) x -= img.w; else if (a & 1) x -= (img.w >> 1);
    if (a & 32) y -= img.h; else if (a & 2) y -= (img.h >> 1);
    this.ctx.drawImage(img.cv, x, y);
  }
  drawRegion$Image_int_int_int_int_int_int_int_int(img, xs, ys, w, h, t, x, y, a) {
    if (!img || w <= 0 || h <= 0) return;
    if (xs < 0 || ys < 0 || xs + w > img.w || ys + h > img.h) throw new J_IllegalArgumentException().$init$String('region');
    const dw = (t & 4) ? h : w, dh = (t & 4) ? w : h;
    if (a & 8) x -= dw; else if (a & 1) x -= (dw >> 1);
    if (a & 32) y -= dh; else if (a & 2) y -= (dh >> 1);
    const c = this.ctx;
    if (t === 0) { c.drawImage(img.cv, xs, ys, w, h, x, y, w, h); return; }
    const M = [[1, 0, 0, 1, 0, 0], [1, 0, 0, -1, 0, h], [-1, 0, 0, 1, w, 0], [-1, 0, 0, -1, w, h], [0, 1, 1, 0, 0, 0], [0, 1, -1, 0, h, 0], [0, -1, 1, 0, 0, w], [0, -1, -1, 0, h, w]][t];
    c.save(); c.translate(x, y); c.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
    c.drawImage(img.cv, xs, ys, w, h, 0, 0, w, h); c.restore();
  }
}

// ---------- record store (localStorage) ----------
const $rmsMem = {};
function $rmsLoad(name) {
  const k = 'sm3:rms:' + name;
  try { const s = localStorage.getItem(k); if (s) return JSON.parse(s); } catch (e) { if ($rmsMem[k]) return JSON.parse($rmsMem[k]); }
  return $rmsMem[k] ? JSON.parse($rmsMem[k]) : null;
}
function $rmsSave(name, st) {
  const k = 'sm3:rms:' + name, s = JSON.stringify(st);
  $rmsMem[k] = s;
  try { localStorage.setItem(k, s); } catch (e) { /* storage unavailable: keep in memory */ }
}
const $b64 = {
  enc(b) { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i] & 255); return btoa(s); },
  dec(s) { const t = atob(s), o = new Int8Array(t.length); for (let i = 0; i < t.length; i++) o[i] = t.charCodeAt(i); return o; },
};
class J_RecordStore extends J_Object {
  static openRecordStore$String_boolean(name, create) {
    let st = $rmsLoad(name);
    if (!st) { if (!create) throw new J_RecordStoreNotFoundException().$init$String(name); st = { next: 1, recs: {} }; $rmsSave(name, st); }
    const rs = new J_RecordStore(); rs.name = name; rs.st = st; return rs;
  }
  static deleteRecordStore$String(name) {
    const k = 'sm3:rms:' + name; delete $rmsMem[k]; try { localStorage.removeItem(k); } catch (e) {}
  }
  closeRecordStore$() {}
  addRecord$byteA_int_int(d, o, l) { const id = this.st.next++; this.st.recs[id] = $b64.enc(d.subarray ? d.subarray(o, o + l) : d.slice(o, o + l)); $rmsSave(this.name, this.st); return id; }
  setRecord$int_byteA_int_int(id, d, o, l) { if (!(id in this.st.recs)) throw new J_InvalidRecordIDException().$init$String(String(id)); this.st.recs[id] = $b64.enc(d.subarray ? d.subarray(o, o + l) : d.slice(o, o + l)); $rmsSave(this.name, this.st); }
  getRecord$int(id) { if (!(id in this.st.recs)) throw new J_InvalidRecordIDException().$init$String(String(id)); return $b64.dec(this.st.recs[id]); }
  getRecord$int_byteA_int(id, buf, off) { const r = this.getRecord$int(id); for (let i = 0; i < r.length; i++) buf[off + i] = r[i]; return r.length; }
  static listRecordStores$() {
    const names = new Set();
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('sm3:rms:')) names.add(k.slice(8)); } } catch (e) {}
    for (const k in $rmsMem) if (k.startsWith('sm3:rms:') && $rmsMem[k]) names.add(k.slice(8));
    return names.size ? Array.from(names) : null;
  }
  getRecordSize$int(id) { return this.getRecord$int(id).length; }
  getNumRecords$() { return Object.keys(this.st.recs).length; }
}

// ---------- media ----------
class J_Manager extends J_Object {
  static createPlayer$InputStream_String(s, type) {
    const bytes = []; const buf = new Int8Array(4096); let n;
    while ((n = s.read$byteA_int_int(buf, 0, buf.length)) > 0) for (let i = 0; i < n; i++) bytes.push(buf[i] & 255);
    return new J_Player(Uint8Array.from(bytes), type);
  }
}
class J_Player extends J_Object {
  constructor(bytes, type) { super(); this.bytes = bytes; this.type = type; this.loops = 1; this.listener = null; this.h = null; this.state = 100; }
  addPlayerListener$PlayerListener(l) { this.listener = l; }
  removePlayerListener$PlayerListener(l) { if (this.listener === l) this.listener = null; }
  setLoopCount$int(n) { this.loops = n; }
  realize$() { if (this.state < 200) this.state = 200; }
  prefetch$() { if (this.state < 300) this.state = 300; }
  setMediaTime$long(t) { return t; }
  getState$() { return this.state; }
  start$() {
    if (!window.$midi) return;
    this.state = 400;
    this.h = window.$midi.play(this.bytes, this.loops, () => {
      if (this.state === 400) this.state = 300;
      if (this.listener) this.listener.playerUpdate$Player_String_Object(this, 'endOfMedia', null);
    });
  }
  stop$() { if (this.h) { this.h.stop(); this.h = null; } if (this.state === 400) this.state = 300; }
  deallocate$() { this.stop$(); }
  close$() { this.stop$(); this.state = 0; }
}
