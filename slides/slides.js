/* Adapted from yifzhang.com/slides-rlt (0e76b21): fixed canvas, overview,
   keyboard/touch navigation and figure zoom. No external services required. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const locale = JSON.parse($('presentation-locale')?.textContent || '{}');
  const defaults = {
    overview: '{main} main slides · {backup} backup slides · Esc to close',
    slide: 'Slide {index} of {total}',
    tile: 'Slide {index}: {title}',
    planned: 'Planned: {duration} min · Talk progress: {start}–{end} min',
    backup: 'Backup slide · Use as needed for questions'
  };
  const label = (key, values = {}) => (locale[key] || defaults[key]).replace(/\{(\w+)\}/g, (_, name) => values[name]);
  const deck = $('deck'), stage = $('stage');
  const slides = [...deck.querySelectorAll('.slide')];
  const total = slides.length, mainCount = slides.filter(s => s.dataset.main === 'true').length;
  const overview = $('overview'), help = $('help'), notes = $('notes-viewer'), figure = $('figure-viewer');
  $('overview-title').querySelector('span').textContent = label('overview', {main: mainCount, backup: total - mainCount});
  const dialogs = [overview, help, notes, figure];
  let current = 0, overviewReady = false, touchStart = null, idleTimer, zoom = 1;

  function fit() {
    deck.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1280, innerHeight / 720)})`;
    if (overview.open) fitThumbnails();
    if (figure.open) sizeFigure();
  }
  function hashIndex() {
    const match = /^#(\d+)$/.exec(location.hash);
    return match ? Math.max(0, Math.min(total - 1, Number(match[1]) - 1)) : 0;
  }
  function show(index, updateHash = true) {
    current = Math.max(0, Math.min(total - 1, index));
    slides.forEach((s, i) => {
      const active = i === current;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.inert = !active;
    });
    const backup = current >= mainCount;
    $('count').textContent = backup ? `B${current - mainCount + 1} / ${total - mainCount}` : `${current + 1} / ${mainCount}`;
    $('count').title = label('slide', {index: current + 1, total});
    const languageSwitch = $('language-switch');
    if (languageSwitch) languageSwitch.href = `${languageSwitch.dataset.href}#${current + 1}`;
    $('bar').style.width = `${(current + 1) / total * 100}%`;
    $('prev').disabled = current === 0;
    $('next').disabled = current === total - 1;
    if (updateHash) {
      try { history.replaceState(null, '', '#' + (current + 1)); }
      catch { location.hash = String(current + 1); }
    }
    [...$('grid').children].forEach((tile, i) => tile.classList.toggle('current', i === current));
  }
  function next() { show(current + 1); }
  function prev() { show(current - 1); }
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  function fitThumbnails() {
    $('grid').querySelectorAll('.thumb').forEach(thumb => {
      const scale = thumb.clientWidth / 1280;
      thumb.style.height = `${720 * scale}px`;
      thumb.firstElementChild.style.transform = `scale(${scale})`;
    });
  }
  async function openOverview() {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    if (!overviewReady) {
      slides.forEach((s, i) => {
        const tile = document.createElement('button');
        tile.type = 'button'; tile.className = 'tile';
        tile.setAttribute('aria-label', label('tile', {index: i + 1, title: s.dataset.title}));
        const thumb = document.createElement('div'); thumb.className = 'thumb'; thumb.setAttribute('aria-hidden', 'true');
        const scaler = document.createElement('div'); scaler.className = 'scaler';
        const clone = s.cloneNode(true); clone.inert = true;
        clone.removeAttribute('aria-hidden'); clone.classList.remove('is-active');
        clone.querySelectorAll('[id]').forEach((el, n) => { el.id = `thumb-${i}-${n}`; });
        // MathJax uses local IDs in <use>; preserve the rendered equations while
        // avoiding duplicate IDs in overview thumbnails by replacing SVGs with images.
        clone.querySelectorAll('mjx-container svg').forEach((svg, index) => {
          const original = s.querySelectorAll('mjx-container svg')[index];
          if (!original) return;
          const img = document.createElement('img');
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(original));
          img.style.cssText = svg.style.cssText;
          img.style.width = svg.getAttribute('width');
          img.style.height = svg.getAttribute('height');
          svg.replaceWith(img);
        });
        scaler.appendChild(clone); thumb.appendChild(scaler); tile.appendChild(thumb);
        const meta = document.createElement('div'); meta.className = 'tnum';
        const pageLabel = i < mainCount ? String(i + 1).padStart(2, '0') : `B${i - mainCount + 1}`;
        meta.textContent = `${pageLabel} · ${s.dataset.title}`;
        tile.appendChild(meta);
        tile.addEventListener('click', () => { overview.close(); show(i); });
        $('grid').appendChild(tile);
      });
      overviewReady = true;
    }
    overview.showModal(); show(current); fitThumbnails();
    $('grid').children[current]?.scrollIntoView({block:'nearest'});
  }
  function openNotes() {
    $('notes-title').textContent = `${current + 1} · ${slides[current].dataset.title}`;
    window.MathJax?.typesetClear?.([$('notes-content')]);
    $('notes-content').replaceChildren(...[...slides[current].querySelector('.speaker-notes').children].map(node => node.cloneNode(true)));
    const timing = document.createElement('p');
    timing.className = 'note-timing';
    if (current < mainCount) {
      const start = slides.slice(0, current).reduce((sum, s) => sum + Number(s.dataset.minutes || 0), 0);
      const duration = Number(slides[current].dataset.minutes || 0);
      timing.textContent = label('planned', {duration, start, end: start + duration});
    } else timing.textContent = label('backup');
    $('notes-content').prepend(timing);
    notes.showModal();
    window.MathJax?.typesetPromise?.([$('notes-content')]);
  }
  function sizeFigure() {
    const image = $('figure-image'), scroller = $('figure-scroll');
    const ratio = image.naturalWidth / image.naturalHeight || 1;
    image.style.width = `${Math.max(1, Math.min(scroller.clientWidth - 36, (scroller.clientHeight - 36) * ratio) * zoom)}px`;
  }
  function openFigure(trigger) {
    const image = $('figure-image');
    $('figure-caption').textContent = trigger.dataset.caption;
    $('figure-source').href = trigger.dataset.figure;
    image.alt = trigger.dataset.caption;
    zoom = 1; image.onload = sizeFigure; image.src = trigger.dataset.figure;
    figure.showModal(); $('figure-scroll').scrollTop = $('figure-scroll').scrollLeft = 0;
    if (image.complete) sizeFigure();
  }
  $('prev').addEventListener('click', prev); $('next').addEventListener('click', next);
  $('fs').addEventListener('click', fullscreen); $('ov').addEventListener('click', openOverview);
  $('notes').addEventListener('click', openNotes); $('hl').addEventListener('click', () => help.showModal());
  $('overview-close').addEventListener('click', () => overview.close());
  $('help-close').addEventListener('click', () => help.close());
  $('notes-close').addEventListener('click', () => notes.close());
  $('figure-close').addEventListener('click', () => figure.close());
  $('figure-in').addEventListener('click', () => { zoom = Math.min(5, zoom * 1.5); sizeFigure(); });
  $('figure-out').addEventListener('click', () => { zoom = Math.max(1, zoom / 1.5); sizeFigure(); });
  $('figure-fit').addEventListener('click', () => { zoom = 1; sizeFigure(); $('figure-scroll').scrollTop = $('figure-scroll').scrollLeft = 0; });
  deck.addEventListener('click', e => {
    const trigger = e.target.closest('[data-figure]');
    if (trigger) { openFigure(trigger); return; }
    if (e.target.closest('a,button,input,select,textarea') || String(window.getSelection())) return;
    next();
  });
  document.addEventListener('keydown', e => {
    if (dialogs.some(d => d.open)) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input,textarea,select')) return;
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button,a')) return;
    const actions = {
      ArrowRight: next, ArrowDown: next, PageDown: next, ' ': next,
      ArrowLeft: prev, ArrowUp: prev, PageUp: prev,
      Home: () => show(0), End: () => show(total - 1),
      f: fullscreen, F: fullscreen, o: openOverview, O: openOverview,
      n: openNotes, N: openNotes, '?': () => help.showModal(), h: () => help.showModal(), H: () => help.showModal()
    };
    if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
  });
  stage.addEventListener('touchstart', e => {
    if (e.target.closest('button,a')) return;
    const t = e.changedTouches[0]; touchStart = [t.clientX,t.clientY];
  }, {passive:true});
  stage.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0], dx = t.clientX-touchStart[0], dy = t.clientY-touchStart[1];
    touchStart = null;
    if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) { e.preventDefault(); dx<0 ? next() : prev(); }
  }, {passive:false});
  function wake() {
    stage.classList.remove('idle'); clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!dialogs.some(d => d.open)) stage.classList.add('idle'); }, 3000);
  }
  ['mousemove','pointerdown','keydown','touchstart'].forEach(name => document.addEventListener(name,wake,{passive:true}));
  window.addEventListener('resize', fit); window.addEventListener('hashchange', () => show(hashIndex(),false));
  dialogs.forEach(dialog => dialog.addEventListener('close',wake));
  fit(); show(hashIndex()); wake();
})();
