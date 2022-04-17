
/* global gl */

//'use strict';

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  addElem,
  flash,
  removeFlashes,
} from './utils.js';
import { getStateTables } from './state-tables.js';
import {
  addWebGLObjectInfo,
  getWebGLObjectInfo,
  setDefaultVAOInfo,
  getWebGLObjectInfoOrDefaultVAO,
  setDefaultTFOInfo,
  getWebGLObjectInfoOrDefaultTFO,
  setCanvasInfo,
} from './context-wrapper.js';
import {
  expand,
  makeDraggable,
  moveToFront,
  setWindowPositions,
  setHint,
  setHintSubs,
  showHint,
  collapse,
} from './ui.js';

import Stepper from './stepper.js';
import {arrowManager} from './arrows.js';
import {
  isBadWebGL2,
  init as initWebGL,
} from './webgl.js';
import {
  globals,
} from './globals.js';
import {
  createShaderDisplay,
  createProgramDisplay,
} from './program-ui.js';
import {
  createSamplerDisplay,
  createTextureDisplay,
} from './texture-ui.js';
import {
  createBufferDisplay,
  createFramebufferDisplay,
  createRenderbufferDisplay,
} from './buffer-ui.js';
import {
  createVertexArrayDisplay,
} from './vertex-array-ui.js';
import {
  createTransformFeedbackDisplay,
} from './transform-feedback-ui.js';
import { createGlobalUI } from './global-ui.js';
import { highlightDocument } from './code-highlight.js';

const glEnumToString = twgl.glEnumToString;

export default function main({webglVersion, examples}) {
  globals.isWebGL2 = webglVersion === 'webgl2';
  const isWebGL2 = globals.isWebGL2;

  highlightDocument();

  gl = document.querySelector('canvas').getContext(webglVersion, {preserveDrawingBuffer: true});  /* eslint-disable-line */
  if (!gl || (isWebGL2 && isBadWebGL2(gl))) {
    document.body.classList.add('no-webgl');
    return;
  }

  twgl.addExtensionsToContext(gl);

  globals.renderTexture = initWebGL(gl).renderTexture;
  globals.executeWebGLWrappers = true;

  const defaultExampleId = Object.keys(examples)[0];
  const search = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(search.entries());
  let {lang, exampleId = defaultExampleId} = params;
  setHintSubs({
    langPathSegment: lang ? `${lang}/` : '',
  });

  if (!examples[exampleId]) {
    exampleId = defaultExampleId;
  }
  const example = examples[exampleId];
  setWindowPositions(example.windowPositions);

  const examplesElem = document.querySelector('#example');
  for (const [id, example] of Object.entries(examples)) {
    addElem('option', examplesElem, {
      textContent: example.name,
      value: id,
      ...id === exampleId && {selected: true},
    });
  }
  examplesElem.addEventListener('change', (e) => {
    search.set('exampleId', e.target.value);
    const url = new URL(location.href);
    url.hash = '#no-help';
    url.search = search.toString();
    location.href = url.href;
  });

  globals.stateTables = getStateTables(isWebGL2);

  const diagramElem = document.querySelector('#diagram');
  const codeElem = document.querySelector('#code');
  const stepper = new Stepper();

  document.body.addEventListener('click', showHint);

  const canvasElem = document.querySelector('#canvas');
  canvasElem.classList.add('window-content');
  const canvasDraggable = makeDraggable(canvasElem);
  const canvasInfo = {
    ui: {
      elem: canvasElem,
    },
  };
  setCanvasInfo(canvasInfo);

  const defaultTFOInfo = {
  };
  if (globals.isWebGL2) {
    defaultTFOInfo.ui = createTransformFeedbackDisplay(diagramElem, '*default*', null);
    setDefaultTFOInfo(defaultTFOInfo);
  }

  const defaultVAOInfo = {
    ui: createVertexArrayDisplay(diagramElem, '*default*', null),
  };
  setDefaultVAOInfo(defaultVAOInfo);

  globals.globalUI = createGlobalUI(document.querySelector('#global-state'));
  moveToFront(defaultVAOInfo.ui.elem.parentElement);

  function getUIById(id) {
    const [base, part] = id.split('.');
    switch (base) {
      case 'globalUI':
        return globals.globalUI[part];
      default:
        throw new Error(`unknown base: ${base}`);
    }
  }

  function adjustUI({cmd, id}) {
    const ui = getUIById(id);
    switch (cmd) {
      case 'expand':
        expand(ui.elem);
        break;
      case 'collapse':
        collapse(ui.elem);
        break;
      default:
        throw new Error(`unknown cmd: ${cmd}`);
    }
  }

  if (example.adjust) {
    example.adjust.forEach(adjustUI);
  }

  arrowManager.update();

  function wrapFn(fnName, fn) {
    gl[fnName] = function(origFn) {
      if (!origFn) {
        throw new Error(`unknown function:${fnName}`);
      }
      return function(...args) {
        let result;
        if (globals.executeWebGLWrappers) {
        const err2 = gl.getError();
        if (err2) {
          throw new Error(`gl error: ${err2}`);
        }
          result = fn.call(this, origFn, ...args);
        const err = gl.getError();
        if (err) {
          throw new Error(`gl error: ${err}`);
        }
        } else {
          result = origFn.call(this, ...args);
        }
        return result;
      };
    }(gl[fnName]);
  }

  function wrapCreationFn(fnName, uiFactory) {
    wrapFn(fnName, function(origFn, ...args) {
      const webglObject = origFn.call(this, ...args);
      const name = stepper.guessIdentifierOfCurrentLine();
      addWebGLObjectInfo(webglObject, {
        name,
        ui: uiFactory(name, webglObject),
      });
      return webglObject;
    });
  }

  function wrapDeleteFn(fnName) {
    wrapFn(fnName, function(origFn, webglObject) {
      origFn.call(this, webglObject);
      const info = getWebGLObjectInfo(webglObject);
      info.deleted = true;
      const {elem} = info.ui;
      elem.remove();
    });
  }

  wrapCreationFn('createTexture', (name, webglObject) => {
    return createTextureDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createBuffer', (name, webglObject) => {
    return createBufferDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createShader', (name, webglObject) => {
    return createShaderDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createProgram', (name, webglObject) => {
    return createProgramDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createVertexArray', (name, webglObject) => {
    return createVertexArrayDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createFramebuffer', (name, webglObject) => {
    return createFramebufferDisplay(diagramElem, name, webglObject);
  });
  wrapCreationFn('createRenderbuffer', (name, webglObject) => {
    return createRenderbufferDisplay(diagramElem, name, webglObject);
  });
  wrapDeleteFn('deleteTexture');
  wrapDeleteFn('deleteBuffer');
  wrapDeleteFn('deleteShader');
  wrapDeleteFn('deleteProgram');
  wrapDeleteFn('deleteVertexArray');
  wrapDeleteFn('deleteFramebuffer');
  wrapDeleteFn('deleteRenderbuffer');

  for (const [fnName, stateUpdaters] of Object.entries(globals.globalUI.settersToWrap)) {
    wrapFn(fnName, function(origFn, ...args) {
      origFn.call(this, ...args);
      stateUpdaters.forEach(updater => updater());
    });
  }

  Object.keys(WebGLRenderingContext.prototype)
      .filter(name => /^uniform(\d|Matrix)/.test(name))
      .forEach((fnName) => {
        wrapFn(fnName, function(origFn, ...args) {
          origFn.call(this, ...args);
          const program = gl.getParameter(gl.CURRENT_PROGRAM);
          const {ui} = getWebGLObjectInfo(program);
          ui.updateUniforms();
        });
      });

  wrapFn('bindTexture', function(origFn, target, texture) {
    origFn.call(this, target, texture);
    const info = getWebGLObjectInfo(texture);
    if (!info.target) {
      info.target = target;
      info.ui.updateState(true);
    }
    globals.globalUI.textureUnits.updateCurrentTextureUnit(target);
  });
  function getCurrentTextureForTarget(target) {
    if (target === gl.TEXTURE_CUBE_MAP) {
      return gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
    }
    if (target === gl.TEXTURE_2D) {
      return gl.getParameter(gl.TEXTURE_BINDING_2D);
    }
    throw new Error(`unknown target: ${target}`);
  }
  wrapFn('texParameteri', function(origFn, target, ...args) {
    origFn.call(this, target, ...args);
    const texture = getCurrentTextureForTarget(target);
    const {ui} = getWebGLObjectInfo(texture);
    ui.updateState();
  });
  wrapFn('texImage2D', function(origFn, target, ...args) {
    origFn.call(this, target, ...args);
    const texture = getCurrentTextureForTarget(target);
    const {ui} = getWebGLObjectInfo(texture);
    ui.updateMip(target, ...args);
  });
  wrapFn('generateMipmap', function(origFn, target) {
    origFn.call(this, target);
    const texture = getCurrentTextureForTarget(target);
    const {ui} = getWebGLObjectInfo(texture);
    ui.generateMips(target);
  });

  if (globals.isWebGL2) {
    wrapCreationFn('createSampler', (name, webglObject) => {
      return createSamplerDisplay(diagramElem, name, webglObject);
    });
    wrapDeleteFn('deleteSampler');
    wrapFn('bindSampler', function(origFn, unit, sampler) {
      origFn.call(this, unit, sampler);
      globals.globalUI.textureUnits.updateTextureUnitSampler(unit);
    });
    wrapFn('samplerParameteri', function(origFn, sampler, ...args) {
      origFn.call(this, sampler, ...args);
      const {ui} = getWebGLObjectInfo(sampler);
      ui.updateState();
    });
    wrapFn('drawBuffers', function(origFn, ...args) {
      origFn.call(this, ...args);
      const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      if (framebuffer) {
        const {ui} = getWebGLObjectInfo(framebuffer);
        ui.updateState();
      } else {
        globals.globalUI.framebufferState.updateState();
      }
    });
    wrapFn('bindTransformFeedback', function(origFn, ...args) {
      origFn.call(this, ...args);
      const {ui} = getCurrentTFOInfo();
      moveToFront(ui.elem);
      const prog = gl.getParameter(gl.CURRENT_PROGRAM);
      updateProgramAttributesAndUniforms(prog);
    });
    wrapCreationFn('createTransformFeedback', (name, webglObject) => {
      return createTransformFeedbackDisplay(diagramElem, name, webglObject);
    });
    wrapDeleteFn('deleteTransformFeedback');
    const updateUnit = (target, index, buffer, offset, size) => {
      let webglObject;
      switch (target) {
        case gl.TRANSFORM_FEEDBACK_BUFFER: {
          webglObject = gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING);
          const {ui} = getWebGLObjectInfoOrDefaultTFO(webglObject);
          ui.updateUnit(target, index, buffer, offset, size);
          break;
        }
        case gl.UNIFORM_BUFFER: {
          globals.globalUI.uniformBufferBindingsState.updateUniformBufferBinding(index);
          const prog = gl.getParameter(gl.CURRENT_PROGRAM);
          updateProgramAttributesAndUniforms(prog);
          break;
        }
        default:
          throw new Error('unhandled buffer type');
      }
    };
    wrapFn('bindBufferRange', function(origFn, target, index, buffer, offset, size) {
      origFn.call(this, target, index, buffer, offset, size);
      updateUnit(target, index, buffer, offset, size);
    });
    wrapFn('bindBufferBase', function(origFn, target, index, buffer) {
      origFn.call(this, target, index, buffer);
      updateUnit(target, index, buffer);
    });
  }

  wrapFn('shaderSource', function(origFn, shader, source) {
    origFn.call(this, shader, source);
    const {ui} = getWebGLObjectInfo(shader);
    ui.updateSource();
  });

  wrapFn('attachShader', function(origFn, program, shader) {
    origFn.call(this, program, shader);
    const {ui} = getWebGLObjectInfo(program);
    ui.updateAttachedShaders();
  });
  wrapFn('detachShader', function(origFn, program, shader) {
    origFn.call(this, program, shader);
    const {ui} = getWebGLObjectInfo(program);
    ui.updateAttachedShaders();
  });

  wrapFn('compileShader', function(origFn, shader) {
    origFn.call(this, shader);
    const {ui} = getWebGLObjectInfo(shader);
    ui.updateState();
  });

  wrapFn('linkProgram', function(origFn, program) {
    origFn.call(this, program);
    const {ui} = getWebGLObjectInfo(program);
    ui.updateState();
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      ui.scanAttributes();
      ui.scanUniforms();
      ui.scanTransformFeedbackVaryings();
    }
  });
  wrapFn('bindBuffer', function(origFn, bindPoint, buffer) {
    origFn.call(this, bindPoint, buffer);
    switch (bindPoint) {
      case gl.ARRAY_BUFFER:
      case gl.TRANSFORM_FEEDBACK_BUFFER:
        globals.globalUI.commonState.updateState();
        break;
      case gl.UNIFORM_BUFFER:
        globals.globalUI.uniformBufferBindingsState.updateState();
        break;
      case gl.ELEMENT_ARRAY_BUFFER: {
        const {ui} = getCurrentVAOInfo();
        ui.updateState();
        break;
      }
      default:
        throw new Error('unhandled buffer bind point');
    }
  });
  function getQueryForBufferBindPoint(gl, bindPoint) {
    switch (bindPoint) {
      case gl.ARRAY_BUFFER: return gl.ARRAY_BUFFER_BINDING;
      case gl.ELEMENT_ARRAY_BUFFER: return gl.ELEMENT_ARRAY_BUFFER_BINDING;
      case gl.UNIFORM_BUFFER: return gl.UNIFORM_BUFFER_BINDING;
      case gl.TRANSFORM_FEEDBACK_BUFFER: return gl.TRANSFORM_FEEDBACK_BUFFER_BINDING;
      default: throw new Error(`unsupported bind point: ${glEnumToString(gl, bindPoint)}`);
    }
  }
  wrapFn('bufferData', function(origFn, bindPoint, dataOrSize, hint) {
    origFn.call(this, bindPoint, dataOrSize, hint);
    const buffer = gl.getParameter(getQueryForBufferBindPoint(gl, bindPoint));
    const {ui} = getWebGLObjectInfo(buffer);
    ui.updateData(dataOrSize);
    if (bindPoint === gl.UNIFORM_BUFFER) {
      updateProgramAttributesAndUniforms(gl.getParameter(gl.CURRENT_PROGRAM));
    }
  });
  wrapFn('bufferSubData', function(origFn, bindPoint, offset, data, ...args) {
    origFn.call(this, bindPoint, offset, data, ...args);
    const buffer = gl.getParameter(getQueryForBufferBindPoint(gl, bindPoint));
    const {ui} = getWebGLObjectInfo(buffer);
    ui.updateSubData(data, offset);
    if (bindPoint === gl.UNIFORM_BUFFER) {
      updateProgramAttributesAndUniforms(gl.getParameter(gl.CURRENT_PROGRAM));
    }
  });
  function getCurrentVAOInfo() {
    const vertexArray = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    return getWebGLObjectInfoOrDefaultVAO(vertexArray);
  }
  wrapFn('enableVertexAttribArray', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
    globals.globalUI.attribValueState.updateAttribValue(args[0]);
    const prog = gl.getParameter(gl.CURRENT_PROGRAM);
    updateProgramAttributesAndUniforms(prog);
  });
  wrapFn('disableVertexAttribArray', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
    globals.globalUI.attribValueState.updateAttribValue(args[0]);
    const prog = gl.getParameter(gl.CURRENT_PROGRAM);
    updateProgramAttributesAndUniforms(prog);
  });
  wrapFn('vertexAttribPointer', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
  });
  wrapFn('vertexAttrib4fv', function(origFn, ...args) {
    origFn.call(this, ...args);
    globals.globalUI.attribValueState.updateAttribValue(args[0]);
  });
  wrapFn('activeTexture', function(origFn, unit) {
    origFn.call(this, unit);
    globals.globalUI.textureUnits.updateActiveTextureUnit();
  });
  function updateProgramAttributesAndUniforms(prog) {
    if (prog) {
      const info = getWebGLObjectInfo(prog);
      info.ui.updateAttributes();
      info.ui.updateUniforms();
      info.ui.updateTransformFeedbackVaryings();
    }
  }
  function getCurrentTFOInfo() {
    const transformFeedback = gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING);
    return getWebGLObjectInfoOrDefaultTFO(transformFeedback);
  }
  wrapFn('bindVertexArray', function(origFn, vao) {
    origFn.call(this, vao);
    const {ui} = getCurrentVAOInfo();
    moveToFront(ui.elem);
    updateProgramAttributesAndUniforms(gl.getParameter(gl.CURRENT_PROGRAM));
    globals.globalUI.attribValueState.updateAttribValues();
  });
  wrapFn('useProgram', function(origFn, vao) {
    const oldProg = gl.getParameter(gl.CURRENT_PROGRAM);
    origFn.call(this, vao);
    const newProg = gl.getParameter(gl.CURRENT_PROGRAM);
    updateProgramAttributesAndUniforms(oldProg);
    updateProgramAttributesAndUniforms(newProg);
  });

  wrapFn('renderbufferStorage', function(origFn, target, ...args) {
    origFn.call(this, target, ...args);
    const renderbuffer = gl.getParameter(gl.RENDERBUFFER_BINDING);
    const {ui} = getWebGLObjectInfo(renderbuffer);
    ui.updateStorage(target);
  });
  function updateFramebufferAttachments(target) {
    const framebuffer = gl.getParameter(target === gl.FRAMEBUFFER ? gl.FRAMEBUFFER_BINDING : gl.READ_FRAMEBUFFER_BINDING);
    const {ui} = getWebGLObjectInfo(framebuffer);
    ui.updateAttachments(target);
  }
  wrapFn('framebufferRenderbuffer', function(origFn, target, ...args) {
    origFn.call(this, target, ...args);
    updateFramebufferAttachments(target);
  });
  wrapFn('framebufferTexture2D', function(origFn, target, ...args) {
    origFn.call(this, target, ...args);
    updateFramebufferAttachments(target);
  });
  wrapFn('bindFramebuffer', function(origFn, target, framebuffer) {
    origFn.call(this, target, framebuffer);
    if (framebuffer) {
      const info = getWebGLObjectInfo(framebuffer);
      if (!info.boundOnce) {
        info.boundOnce = true;
        info.ui.firstBind(target);
      }
    }
  });

  function wrapDrawFn(fnName) {
    wrapFn(fnName, function(origFn, ...args) {
      origFn.call(this, ...args);
      const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      if (framebuffer) {
        const {ui} = getWebGLObjectInfo(framebuffer);
        ui.updateAttachmentContents(gl.FRAMEBUFFER);
      } else {
        flash(canvasDraggable.querySelector('.name'));
      }
    });
  }
  wrapDrawFn('clear');
  wrapDrawFn('drawArrays');
  wrapDrawFn('drawElements');
  wrapDrawFn('drawArraysInstanced');
  wrapDrawFn('drawElementsInstanced');

  // This mess is because of a bug on Mac NVidia drivers.
  // If transform feedback is on and we draw, and we exit the current
  // event without stopping transform feedback then both Chrome 79 and
  // Firefox 72 crash WebGL. Hopefully they'll integrate this workaround
  // themselves but for now...

  let runningTransformFeedback = false;
  let pauseTransformFeedback = false;

  if (globals.isWebGL2) {
    wrapFn('beginTransformFeedback', function(origFn, ...args) {
      origFn.call(this, ...args);
      runningTransformFeedback = true;
    });
    wrapFn('endTransformFeedback', function(origFn, ...args) {
      origFn.call(this, ...args);
      runningTransformFeedback = false;
    });
    wrapFn('pauseTransformFeedback', function(origFn, ...args) {
      origFn.call(this, ...args);
      pauseTransformFeedback = true;
    });
    wrapFn('resumeTransformFeedback', function(origFn, ...args) {
      origFn.call(this, ...args);
      pauseTransformFeedback = false;
    });
  }

  if (globals.isWebGL2) {
    wrapFn('uniformBlockBinding', function(origFn, program, programUniformBlockIndex, uniformBufferBindPointIndex) {
      origFn.call(this, program, programUniformBlockIndex, uniformBufferBindPointIndex);
      updateProgramAttributesAndUniforms(program);
    });
  }

  function beforeStep() {
    if (runningTransformFeedback) {
      if (!pauseTransformFeedback) {
        const old = globals.executeWebGLWrappers;
        globals.executeWebGLWrappers = false;
        gl.resumeTransformFeedback();
        globals.executeWebGLWrappers = old;
      }
    }
  }

  function afterStep() {
    if (runningTransformFeedback) {
      if (!pauseTransformFeedback) {
        const old = globals.executeWebGLWrappers;
        globals.executeWebGLWrappers = false;
        gl.pauseTransformFeedback();
        globals.executeWebGLWrappers = old;
      }
    }
    arrowManager.update();
    removeFlashes();
  }

  function handleResizes() {
    arrowManager.update();
  }

  function showHelp() {
    setHint({
       type: 'click',
      },
      document.querySelector('#docs-start').text);
  }

  /*
  const apiInfo = {
    'createShader': { help: `
    `},
    'shaderSource': { help: `
    `},
    'compileShader': { help: `
    `},
    'getShaderParameter': { help: `
    `},
    'createProgram': { help: `
    `},
    'attachShader': { help: `
    `},
    'linkProgram': { help: `
    `},
    'getProgramParameter': { help: `
    `},
    'deleteShader': { help: `
    `},
    'getAttribLocation': { help: `
    `},
    'getUniformLocation': { help: `
    `},
    'createBuffer': { help: `
    `},
    'bindBuffer': { help: `
    `},
    'bufferData': { help: `
    `},
    'createTexture': { help: `
    `},
    'bindTexture': { help: `
    `},
    'texImage2D': { help: `
    `},
    'texParameteri': { help: `
    `},
    'viewport': { help: `
    `},
    'clearColor': { help: `
    `},
    'clear': { help: `
    `},
    'enable': { help: `
    `},
    'enableVertexAttribArray': { help: `
    `},
    'vertexAttribPointer': { help: `
    `},
    'useProgram': { help: `
    `},
    'activeTexture': { help: `
    `},
    'uniform1i': { help: `
    `},
    'uniform3fv': { help: `
    `},
    'uniformMatrix4fv': { help: `
    `},
    'drawElement': { help: `
    `},
  };
  */

  function showLineHelp(/*line*/) {
    // console.log(line);
  }


  stepper.init(codeElem, document.querySelector(`#${exampleId}`).text, {
    onBefore: beforeStep,
    onAfter: afterStep,
    onHelp: showHelp,
    onLine: showLineHelp,
  });
  if (window.location.hash.indexOf('no-help') < 0) {
    showHelp();
  }


  window.addEventListener('resize', handleResizes);
}
