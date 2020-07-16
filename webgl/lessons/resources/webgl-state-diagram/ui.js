
/* global showdown */

import {
  addElem,
  flash,
  helpToMarkdown,
  px,
  replaceParams,
  updateElem,
} from './utils.js';
import {highlightBlock} from './code-highlight.js';
import {arrowManager} from './arrows.js';

const diagramElem = document.querySelector('#diagram');

let dragTarget;
let dragMouseStartX;
let dragMouseStartY;
let dragTargetStartX;
let dragTargetStartY;
let dragDist;


const converter = new showdown.Converter();
const hintElem = document.querySelector('#hint');
let lastWidth;
let lastHeight;
let lastHint;
let showHintOnHover = true;
let hintSubs = {};

export function setHintSubs(subs) {
  hintSubs = subs;
}

export function setHint(e, hint = '') {
  if (dragTarget) {
    hint = '';
  }
  // if the hint is visible and there is a selection just exit
  // so the user can copy text from the hint.
  if (!hintElem.style.display && window.getSelection().toString()) {
    return;
  }
  if (lastHint !== hint) {
    lastHint = hint;
    const html = converter.makeHtml(replaceParams(hint, hintSubs));
    hintElem.style.display = '';  // show it so we can measure it
    hintElem.style.left = '0';    // let it expand
    hintElem.style.top = '0';     // let it expand
    hintElem.innerHTML = html;
    hintElem.querySelectorAll('pre>code').forEach(elem => highlightBlock(elem));
    hintElem.querySelectorAll('a').forEach(elem => elem.target = '_blank');
    lastWidth = hintElem.clientWidth;
    lastHeight = hintElem.clientHeight + 10;  // +10 here will make it leave space at the bottom
  }

  // hack: If not pageX then it's the start docs so center
  if (e.pageX === undefined) {
    e.pageX = (window.innerWidth - lastWidth) / 2 | 0;
    e.pageY = (window.innerHeight - hintElem.clientHeight) / 2 | 0;
  }

  hintElem.style.left = px(e.pageX + lastWidth > window.innerWidth ? window.innerWidth - lastWidth : e.pageX + 5);
  if (e.type === 'click') {
    hintElem.style.top = px(e.pageY + lastHeight > window.innerHeight ? window.innerHeight - lastHeight : e.pageY + 5);
  } else {
    hintElem.style.top = px(e.pageY + 5);
  }
  hintElem.style.display = hint ? '' : 'none';
  showHintOnHover = hint ? e.type !== 'click' : true;
}

export function showHint(e) {
  if (e.target.nodeName === 'A' ||
      (e.type !== 'click' && !showHintOnHover)) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  const elem = e.target.closest('[data-help]');
  setHint(e, elem ? elem.dataset.help : '');
}

function toggleExpander(e) {
  e.preventDefault();
  e.stopPropagation();
  this.parentElement.classList.toggle('open');
  arrowManager.update();
  moveToFront(e.target);
}

export function moveToFront(elemToFront) {
  elemToFront = elemToFront.closest('.draggable');
  const elements = [...document.querySelectorAll('.draggable')].filter(elem => elem !== elemToFront);
  elements.sort((a, b) => a.style.zIndex - b.style.zIndex);
  elements.push(elemToFront);
  elements.forEach((elem, ndx) => {
    elem.style.zIndex = ndx + 1;
  });
}

const queuedRequests = new Map();
function updateQueuedElementPosition() {
  requestId = undefined;
  queuedRequests.forEach((value, key) => {
    const {x, y} = value;
    key.style.left = px(x);
    key.style.top = px(y);
  });
  queuedRequests.clear();
}

let requestId;
function requestUpdate() {
  if (requestId) {
    return;
  }

  arrowManager.update();

  requestId = requestAnimationFrame(updateQueuedElementPosition);
}

function requestDragUpdate(elem, x, y) {
  queuedRequests.set(elem, {x, y});
  requestUpdate();
}

function dragStart(e) {
  e.preventDefault();
  e.stopPropagation();
  const isTouch = e.type === 'touchstart';

  if (isTouch) {
    dragMouseStartX = e.touches[0].pageX;
    dragMouseStartY = e.touches[0].pageY;
  } else {
    dragMouseStartX = e.pageX;
    dragMouseStartY = e.pageY;
  }

  dragDist = 0;
  dragTarget = this.closest('.draggable');
  const rect = this.getBoundingClientRect();
  dragTargetStartX = (window.scrollX + rect.left) | 0; // parseInt(this.style.left || '0');
  dragTargetStartY = (window.scrollY + rect.top) | 0;  // parseInt(this.style.top || '0');
  moveToFront(dragTarget);

  window.addEventListener(isTouch ? 'touchmove' : 'mousemove', dragMove, {passive: false});
  window.addEventListener(isTouch ? 'touchend' : 'mouseup', dragStop, {passive: false});
}

function dragMove(e) {
  if (dragTarget) {
    e.preventDefault();
    e.stopPropagation();
    dragTarget.classList.add('dragging');
    const isTouch = e.type === 'touchmove';
    const dx = ((isTouch ? e.touches[0].pageX : e.pageX) - dragMouseStartX);
    const dy = ((isTouch ? e.touches[0].pageY : e.pageY) - dragMouseStartY);
    dragDist += dx + dy;
    const x = dragTargetStartX + dx;
    const y = dragTargetStartY + dy;
    requestDragUpdate(dragTarget, x, y);
  }
}

function dragStop(e) {
  if (dragTarget) {
    e.preventDefault();
    e.stopPropagation();
    const isTouch = e.type === 'touchend';
    dragTarget.classList.remove('dragging');
    dragTarget = undefined;
    window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', dragMove);
    window.removeEventListener(isTouch ? 'touchend' : 'mouseup', dragStop);
    if (isTouch && dragDist === 0) {
      const clickElem = document.elementFromPoint(dragMouseStartX, dragMouseStartY);
     clickElem.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: dragMouseStartX,
        clientY: dragMouseStartY,
     }));
    }
  }
}


const relRE = /(\w+):(\w+)([-+]\d+)/;
function computeRelativePosition(elem, base, desc) {
  const [, elemSide, baseSide, offset] = relRE.exec(desc);
  const rect = elem.getBoundingClientRect();
  const elemRect = {
    left: 0,
    top: 0,
    right: -rect.width,
    bottom: -rect.height,
  };
  const baseRect = base.getBoundingClientRect();
  return elemRect[elemSide] + baseRect[baseSide] + parseInt(offset) | 0;
}

function getWindowElem(name) {
  const nameElem = [...diagramElem.querySelectorAll('.name')].find(elem => elem.textContent.indexOf(name) >= 0);
  if (nameElem) {
    return nameElem.closest('.draggable');
  }
  return name === '#diagram' ? diagramElem : null;
}

// format for position is selfSide:baseSide:offset.
// eg.: left:right-10 = put our left side - 10 units from right of base
let windowCount = 0;
let windowPositions;
function getNextWindowPosition(elem) {
  const info = windowPositions[windowCount++];
  let x = windowCount * 10;
  let y = windowCount * 10;
  if (info) {
    const {base, x: xDesc, y: yDesc} = info;
    const baseElem = getWindowElem(base);
    if (baseElem) {
      x = computeRelativePosition(elem, baseElem, xDesc);
      y = computeRelativePosition(elem, baseElem, yDesc);
    }
  }
  return {x, y};
}

export function setWindowPositions(positions) {
  windowPositions = positions;
}

export function makeDraggable(elem) {
  const div = addElem('div', elem.parentElement, {
    className: 'draggable',
  });
  elem.remove();
  div.appendChild(elem);
  const pos = getNextWindowPosition(div);
  div.style.left = px(pos.x);
  div.style.top = px(pos.y);
  div.addEventListener('mousedown', () => moveToFront(div), {passive: false});
  div.addEventListener('mousedown', dragStart, {passive: false});
  div.addEventListener('touchstart', dragStart, {passing: false});
  div.addEventListener('wheel', () => {
    requestUpdate();
  });
  moveToFront(div);
  return div;
}

export function createExpander(parent, title, attrs = {}, help) {
  const outer = addElem('div', parent, Object.assign({className: 'expander'}, attrs));
  const titleLine = addElem('div', outer, {className: 'expander-name-line'});
  addElem('div', titleLine, {
    className: 'expander-name',
    textContent: title,
  });
  if (help) {
    const helpElem = addElem('div', titleLine, {
      className: 'expander-help',
      textContent: '?',
      dataset: {
        help: helpToMarkdown(help),
      },
    });
    helpElem.addEventListener('click', showHint);
  }
  const inner = addElem('div', outer, {className: 'expander-content'});
  titleLine.addEventListener('click', toggleExpander);
  return inner;
}

export function collapseOrExpand(inner, open) {
  const action = open ? 'add' : 'remove';
  const elem = inner.parentElement;
  if (elem.classList.contains('expander')) {
    elem.classList[action]('open');
  } else {
    elem.querySelector('.expander').classList[action]('open');
  }
  return elem;
}
export const expand = (elem) => collapseOrExpand(elem, true);
export const collapse = (elem) => collapseOrExpand(elem, false);

export function flashExpanderIfClosed(elem) {
  const expander = elem.closest('.expander');
  if (!expander.classList.contains('open')) {
    flash(expander.children[0]);
  }
}

export function flashSelfAndExpanderIfClosed(elem) {
  flash(elem);
  flashExpanderIfClosed(elem);
}

export function updateElemAndFlashExpanderIfClosed(elem, value, flashOnChange = true) {
  const changed = updateElem(elem, value, flashOnChange);
  if (changed && flashOnChange) {
    flashExpanderIfClosed(elem);
  }
  return changed;
}
