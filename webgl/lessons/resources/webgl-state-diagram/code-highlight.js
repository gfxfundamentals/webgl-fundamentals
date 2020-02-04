/* global Prism */

import { addElem } from './utils.js';

export function highlightDocument() {
  // hljs.initHighlightingOnLoad();
  Prism.highlightAll();
}

export function highlightBlock(elem) {
  //hljs.highlightBlock(elem);
  const html = Prism.highlight(elem.textContent, Prism.languages.javascript, 'javascript');
  elem.innerHTML = '';
  addElem('pre', elem, {className: 'language-js', innerHTML: html});
  //elem.innerHTML = html;
}