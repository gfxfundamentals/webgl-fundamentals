/* eslint no-undef: "error" */

/* global gl */

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  addElem,
  createTable,
  createTemplate,
  formatUniformValue,
  getColorForWebGLObject,
  setName,
} from './webgl-state-diagram-utils.js';

import {
  formatWebGLObject,
  getWebGLObjectInfo,
} from './webgl-state-diagram-context-wrapper.js';

import {
  collapseOrExpand,
  createExpander,
  expand,
  flashSelfAndExpanderIfClosed,
  makeDraggable,
} from './webgl-state-diagram-ui.js';
import {
  globals,
} from './webgl-state-diagram-globals.js';
import {arrowManager} from './webgl-state-diagram-arrows.js';

const glEnumToString = twgl.glEnumToString;

export function createBufferDisplay(parent, name /*, webglObject */) {
  const bufElem = createTemplate(parent, '#buffer-template');
  setName(bufElem, name);
  const dataExpander = createExpander(bufElem, 'data');
  const dataElem = addElem('code', dataExpander, {className: 'data'});

  const updateData = (dataOrSize) => {
    const maxValues = 9;
    const data = typeof dataOrSize === 'number' ? new Array(maxValues).fill(0) : dataOrSize;
    expand(dataExpander);
    flashSelfAndExpanderIfClosed(dataElem);
    const value = formatUniformValue(Array.from(data).slice(0, maxValues));
    dataElem.textContent = `${value}${data.length > maxValues ? ', ...' : ''}`;
  };

  makeDraggable(bufElem);
  return {
    elem: bufElem,
    updateData,
  };
}

export function createRenderbufferDisplay(parent, name /*, renderbuffer */) {
  const renderbufferElem = createTemplate(parent, '#renderbuffer-template');
  setName(renderbufferElem, name);

  const formatElem = renderbufferElem.querySelector('.format');

  function updateStorage(target) {
    const width = gl.getRenderbufferParameter(target, gl.RENDERBUFFER_WIDTH);
    const height = gl.getRenderbufferParameter(target, gl.RENDERBUFFER_HEIGHT);
    const format = gl.getRenderbufferParameter(target, gl.RENDERBUFFER_INTERNAL_FORMAT);
    formatElem.textContent = `${width} x ${height} : ${glEnumToString(gl, format)}`;
  }

  makeDraggable(renderbufferElem);
  return {
    elem: renderbufferElem,
    updateStorage,
    updateContentsAfterBeingRenderedTo() {
      // blank!
    },
  };
}

export function createFramebufferDisplay(parent, name /*, webglObject */) {
  const fbElem = createTemplate(parent, '#framebuffer-template');
  setName(fbElem, name);

  const attachmentExpander = createExpander(fbElem, 'attachment');
  const attachmentsTbody = createTable(attachmentExpander, ['attachment point', 'level', 'face', 'attachment']);
  const maxDrawBuffers = globals.isWebGL2 ? gl.getParameter(gl.MAX_DRAW_BUFFERS) : 1;
  const attachmentPoints = [];
  for (let i = 0; i < maxDrawBuffers; ++i) {
    attachmentPoints.push(gl.COLOR_ATTACHMENT0 + i);
  }
  attachmentPoints.push(gl.DEPTH_ATTACHMENT);
  attachmentPoints.push(gl.STENCIL_ATTACHMENT);
  attachmentPoints.push(gl.DEPTH_STENCIL_ATTACHMENT);

  let arrows = [];
  let oldAttachmentInfos = new Map();

  const updateAttachments = (target) => {
    attachmentsTbody.innerHTML = '';
    const newAttachmentInfos = new Map();

    arrows.forEach(arrow => arrowManager.remove(arrow));

    for (const attachmentPoint of attachmentPoints) {
      let level = 'N/A';
      let face = 'N/A';
      let rawFace;
      const type = gl.getFramebufferAttachmentParameter(target, attachmentPoint, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
      switch (type) {
        case gl.NONE:
          continue;
        case gl.TEXTURE:
          level = gl.getFramebufferAttachmentParameter(target, attachmentPoint, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL);
          rawFace = gl.getFramebufferAttachmentParameter(target, attachmentPoint, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE);
          face = rawFace ? glEnumToString(gl, rawFace) : 'N/A';
          break;
        case gl.RENDERBUFFER:
          break;
        default:
          throw new Error('unknown attachment type');
      }
      const attachment = gl.getFramebufferAttachmentParameter(target, attachmentPoint, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
      const tr = addElem('tr', attachmentsTbody);
      addElem('td', tr, {textContent: glEnumToString(gl, attachmentPoint)});
      addElem('td', tr, {textContent: level});
      addElem('td', tr, {textContent: face});
      addElem('td', tr, {textContent: formatWebGLObject(attachment)});
      const targetInfo = getWebGLObjectInfo(attachment);
      if (!targetInfo.deleted) {
        arrows.push(arrowManager.add(
            tr,
            targetInfo.ui.elem.querySelector('.name'),
            getColorForWebGLObject(attachment, targetInfo.ui.elem)));
      }

      const oldAttachmentInfo = oldAttachmentInfos.get(attachmentPoint);
      if (oldAttachmentInfo && attachment !== oldAttachmentInfo.attachment) {
        flashSelfAndExpanderIfClosed(tr);
      }
      newAttachmentInfos.set(attachmentPoint, {attachment, level, face: rawFace});
    }

    collapseOrExpand(attachmentExpander, newAttachmentInfos.size > 0);
    oldAttachmentInfos = newAttachmentInfos;
  };

  const updateAttachmentContents = () => {
    oldAttachmentInfos.forEach(({attachment, level, face}) => {
      getWebGLObjectInfo(attachment).ui.updateContentsAfterBeingRenderedTo(attachment, level, face);
    });
  };

  expand(attachmentExpander);
  makeDraggable(fbElem);
  return {
    elem: fbElem,
    updateAttachments,
    updateAttachmentContents,
  };
}
