/* eslint strict: "off" */
/* eslint no-undef: "error" */
/* eslint no-return-assign: "off" */

/* global hljs, gl */

//'use strict';

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  addElem,
  createTable,
  flash,
  getColorForWebGLObject,
  helpToMarkdown,
  removeFlashes,
} from './webgl-state-diagram-utils.js';
import { getStateTables } from './webgl-state-diagram-state-tables.js';
import {
  addWebGLObjectInfo,
  formatWebGLObject,
  getWebGLObjectInfo,
  setDefaultVAOInfo,
  getWebGLObjectInfoOrDefaultVAO,
} from './webgl-state-diagram-context-wrapper.js';
import {
  createExpander,
  expand,
  makeDraggable,
  moveToFront,
  setWindowPositions,
  setHint,
  setHintSubs,
  showHint,
  updateElemAndFlashExpanderIfClosed,
} from './webgl-state-diagram-ui.js';
import {
  createStateTable,
  updateStateTable,
} from './webgl-state-diagram-state-table.js';

import Stepper from './webgl-state-diagram-stepper.js';
import {arrowManager} from './webgl-state-diagram-arrows.js';
import {
  isBadWebGL2,
  init as initWebGL,
} from './webgl-state-diagram-webgl.js';
import {
  globals,
} from './webgl-state-diagram-globals.js';
import {
  createShaderDisplay,
  createProgramDisplay,
} from './webgl-state-diagram-program-ui.js';
import {
  createTextureDisplay,
} from './webgl-state-diagram-texture-ui.js';
import {
  createBufferDisplay,
  createFramebufferDisplay,
  createRenderbufferDisplay,
} from './webgl-state-diagram-buffer-ui.js';
import {
  createVertexArrayDisplay,
} from './webgl-state-diagram-vertex-array-ui.js';

export default function main({webglVersion, examples}) {
  globals.isWebGL2 = webglVersion === 'webgl2';
  const isWebGL2 = globals.isWebGL2;

  hljs.initHighlightingOnLoad();

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
    location.search = search.toString();
  });

  globals.stateTables = getStateTables(isWebGL2);

  const diagramElem = document.querySelector('#diagram');
  const codeElem = document.querySelector('#code');
  const stepper = new Stepper();

  document.body.addEventListener('click', showHint);

  function createTextureUnits(parent, maxUnits = 8) {
    const expander = createExpander(parent, 'Texture Units', {}, `
    Each texture unit has multiple bind points. You can bind
    a texture to each point but it is an error for a program
    to try to access 2 or more different bind points from the
    same texture unit.

    For example you have a shader with both a 2D sampler and a cube sampler.

    ---glsl
    uniform sampler2D foo;
    uniform samplerCube bar;
    ---

    Even though there are are both --TEXTURE_2D-- and --TEXTURE_CUBE_MAP-- bind points
    in a single texture unit if you set both --bar-- and --foo-- to the same unit you'll get
    an error

    ---js
    const unit = 3;
    gl.uniform1i(fooLocation, unit);
    gl.uniform1i(barLocation, unit);
    ---

    The code above will generate an error at draw time because --foo-- and --bar--
    require different sampler types. If they are the same type it is okay to point
    both to the same texture unit.
    `);

    const targets = isWebGL2
        ? ['TEXTURE_2D', 'TEXTURE_CUBE_MAP', 'TEXTURE_3D', 'TEXTURE_2D_ARRAY', 'SAMPLER_BINDING']
        : ['TEXTURE_2D', 'TEXTURE_CUBE_MAP'];

    const tbody = createTable(expander, targets.map(v => v.replace(/TEXTURE_|_BINDING/, '')));
    const arrows = [];
    let activeTextureUnit = 0;

    for (let i = 0; i < maxUnits; ++i) {
      arrows.push({});
      const tr = addElem('tr', tbody);
      for (const target of targets) {
        if (target === 'SAMPLER_BINDING') {
          addElem('td', tr, {
            textContent: 'null',
            dataset: {
              help: helpToMarkdown(`
                bind a sampler to this unit with

                ---js
                const textureUnit = ${i};
                gl.bindSampler(textureUnit, someSampler);
                ---

                and unbind one by passing --null--.

                Samplers override a texture's parameters
                letting you use the same texture with different
                parameters. All the same parameters set with
                --gl.texParameteri-- can be set on a sampler
                with

                ---js
                gl.samplerParameteri(someSampler, textureParamEnum, value);
                ---
              `),
            },
          });
        } else {
          addElem('td', tr, {
            textContent: 'null',
            dataset: {
              help: helpToMarkdown(`
                bind a texture to this unit with

                ---js
                gl.activeTexture(gl.TEXTURE0 + ${i});
                gl.bindTexture(gl.${target}, someTexture);
                ---
              `),
            },
          });
        }
      }
    }

    const targetBindings = isWebGL2
        ? [gl.TEXTURE_BINDING_2D, gl.TEXTURE_BINDING_CUBE_MAP, gl.TEXTURE_BINDING_3D, gl.TEXTURE_BINDING_2D_ARRAY, gl.SAMPLER_BINDING]
        : [gl.TEXTURE_BINDING_2D, gl.TEXTURE_BINDING_CUBE_MAP];
    const updateCurrentTextureUnit = () => {
      const unit = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      const row = tbody.rows[unit];
      targetBindings.forEach((targetBinding, colNdx) => {
        const cell = row.cells[colNdx];
        const texture = gl.getParameter(targetBinding);
        if (updateElemAndFlashExpanderIfClosed(cell, formatWebGLObject(texture))) {
          const oldArrow = arrows[unit][targetBinding];
          if (oldArrow) {
            arrowManager.remove(oldArrow);
            arrows[unit][targetBinding] = null;
          }
          if (texture) {
            const targetInfo = getWebGLObjectInfo(texture);
            if (!targetInfo.deleted) {
              arrows[unit][targetBinding] = arrowManager.add(
                  cell,
                  targetInfo.ui.elem.querySelector('.name'),
                  getColorForWebGLObject(texture, targetInfo.ui.elem, unit / maxUnits));
            }
          }
        }
      });
    };

    const updateActiveTextureUnit = () => {
      tbody.rows[activeTextureUnit].classList.remove('active-texture-unit');
      activeTextureUnit = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      tbody.rows[activeTextureUnit].classList.add('active-texture-unit');
    };
    updateActiveTextureUnit();

    return {
      elem: expander,
      updateCurrentTextureUnit,
      updateActiveTextureUnit,
    };
  }

  function globalStateQuery(state) {
    const {pname} = state;
    const value = gl.getParameter(gl[pname]);
    if (gl.getError()) {
      throw new Error('gl error');
    }
    return value;
  }
  const defaultVAOInfo = {
    ui: createVertexArrayDisplay(diagramElem, '*default*', null),
  };
  setDefaultVAOInfo(defaultVAOInfo);

  const settersToWrap = {};

  function createStateUI(stateTable, parent, name, queryFn) {
    const elem = createStateTable(stateTable, parent, name, queryFn);
    const updateState = () => {
      updateStateTable(stateTable, elem, queryFn);
    };

    for (const state of stateTable.states) {
      const setters = Array.isArray(state.setter) ? state.setter : [state.setter];
      for (const setter of setters) {
        if (!settersToWrap[setter]) {
          settersToWrap[setter] = [];
        }
        const stateUpdaters = settersToWrap[setter];
        if (stateUpdaters.indexOf(updateState) < 0) {
          stateUpdaters.push(updateState);
        }
      }
    }
    return {
      elem,
      updateState,
    };
  }
  const globalStateElem = document.querySelector('#global-state');
  const {globalState} = globals.stateTables;
  globals.globalUI = {
    commonState: createStateUI(globalState.commonState, globalStateElem, 'common state', globalStateQuery),
    textureUnits: createTextureUnits(globalStateElem, 8),
    clearState: createStateUI(globalState.clearState, globalStateElem, 'clear state', globalStateQuery),
    depthState: createStateUI(globalState.depthState, globalStateElem, 'depth state', globalStateQuery),
    blendState: createStateUI(globalState.blendState, globalStateElem, 'blend state', globalStateQuery),
    miscState: createStateUI(globalState.miscState, globalStateElem, 'misc state', globalStateQuery),
    stencilState: createStateUI(globalState.stencilState, globalStateElem, 'stencil state', globalStateQuery),
    polygonState: createStateUI(globalState.polygonState, globalStateElem, 'polygon state', globalStateQuery),
  };
  expand(globals.globalUI.textureUnits.elem);
  expand(globals.globalUI.commonState.elem);
  expand(globals.globalUI.clearState.elem);
  expand(globals.globalUI.depthState.elem);

  makeDraggable(globalStateElem);
  const canvasDraggable = makeDraggable(document.querySelector('#canvas'));
  moveToFront(defaultVAOInfo.ui.elem.parentElement);
  arrowManager.update();

  function wrapFn(fnName, fn) {
    gl[fnName] = function(origFn) {
      if (!origFn) {
        throw new Error(`unknown function:${fnName}`);
      }
      return function(...args) {
        if (globals.executeWebGLWrappers) {
          return fn.call(this, origFn, ...args);
        } else {
          return origFn.call(this, ...args);
        }
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

  for (const [fnName, stateUpdaters] of Object.entries(settersToWrap)) {
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
    }
  });
  wrapFn('bindBuffer', function(origFn, bindPoint, buffer) {
    origFn.call(this, bindPoint, buffer);
    if (bindPoint === gl.ARRAY_BUFFER) {
      globals.globalUI.commonState.updateState();
    } else {
      const {ui} = getCurrentVAOInfo();
      ui.updateState();
    }
  });
  wrapFn('bufferData', function(origFn, bindPoint, dataOrSize, hint) {
    origFn.call(this, bindPoint, dataOrSize, hint);
    const buffer = gl.getParameter(bindPoint === gl.ARRAY_BUFFER ? gl.ARRAY_BUFFER_BINDING : gl.ELEMENT_ARRAY_BUFFER_BINDING);
    const {ui} = getWebGLObjectInfo(buffer);
    ui.updateData(dataOrSize);
  });
  function getCurrentVAOInfo() {
    const vertexArray = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    return getWebGLObjectInfoOrDefaultVAO(vertexArray);
  }
  wrapFn('enableVertexAttribArray', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
  });
  wrapFn('disableVertexAttribArray', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
  });
  wrapFn('vertexAttribPointer', function(origFn, ...args) {
    origFn.call(this, ...args);
    const {ui} = getCurrentVAOInfo();
    ui.updateAttributes();
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
    }
  }
  wrapFn('bindVertexArray', function(origFn, vao) {
    origFn.call(this, vao);
    const {ui} = getCurrentVAOInfo();
    moveToFront(ui.elem);
    updateProgramAttributesAndUniforms(gl.getParameter(gl.CURRENT_PROGRAM));
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

  function handleResizes() {
    arrowManager.update();
  }

  function afterStep() {
    arrowManager.update();
    removeFlashes();
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
    onAfter: afterStep,
    onHelp: showHelp,
    onLine: showLineHelp,
  });
  if (window.location.hash.indexOf('no-help') < 0) {
    showHelp();
  }


  window.addEventListener('resize', handleResizes);
}
