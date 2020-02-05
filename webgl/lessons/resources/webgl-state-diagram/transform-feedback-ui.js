
/* global gl */

import {
  addElem,
  createTable,
  createTemplate,
  getColorForWebGLObject,
  helpToMarkdown,
  setName,
  updateElem,
} from './utils.js';

import {
  formatWebGLObject,
  getWebGLObjectInfo,
} from './context-wrapper.js';

import {
  createExpander,
  expand,
  makeDraggable,
} from './ui.js';

import {
  globals,
} from './globals.js';

import {arrowManager} from './arrows.js';

export function createTransformFeedbackDisplay(parent, name /*, transformFeedback*/) {
  const tfElem = createTemplate(parent, '#transform-feedback-template');
  setName(tfElem, name);
  const tfNote = helpToMarkdown(`
  `);
  const attrExpander = createExpander(tfElem.querySelector('.state-table'), 'varyings');
  expand(attrExpander);
  const attrsElem = createTable(attrExpander, ['offset', 'size', 'buffer']);
  const arrows = [];
  const maxAttribs = globals.isWebGL2 ? gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS) : 0;

  for (let i = 0; i < maxAttribs; ++i) {
    const tr = addElem('tr', attrsElem);

    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
        where in the buffer to start reading or writing data.
        ${tfNote}`),
      },
    });
    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
        how much of the buffer to use
        ${tfNote}`),
      },
    });
    addElem('td', tr, {
      textContent: 'null',
      dataset: {
        help: helpToMarkdown(`
        The buffer that will receive data
        ${tfNote}`),
      },
    });
  }

  // note: size = -1 means use entire buffer
  const updateUnit = (target, index, buffer, offset, size) => {
    const rowElem = attrsElem.rows[index];
    updateElem(rowElem.cells[0], offset || 0);
    updateElem(rowElem.cells[1], size === undefined ? 'all' : size);
    updateElem(rowElem.cells[2], formatWebGLObject(buffer));
    const oldArrow = arrows[index];
    if (oldArrow) {
      arrowManager.remove(oldArrow);
      arrows[index] = null;
    }
    if (buffer) {
      const targetInfo = getWebGLObjectInfo(buffer);
      if (!targetInfo.deleted) {
        arrows[index] = arrowManager.add(
            rowElem.cells[2],
            targetInfo.ui.elem.querySelector('.name'),
            getColorForWebGLObject(buffer, targetInfo.ui.elem, index / maxAttribs));
      }
    }
  };

  makeDraggable(tfElem);

  return {
    elem: tfElem,
    updateUnit,
  };
}

