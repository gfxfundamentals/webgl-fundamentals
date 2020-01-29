/* eslint strict: "off" */
/* eslint no-undef: "error" */

/* global hljs, showdown, gl, chroma */

//'use strict';

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  px,
  formatBoolean,
  formatUniformValue,
  createTemplate,
  updateElem,
  helpToMarkdown,
  addRemoveClass,
  createElem,
  addElem,
  flash,
  removeFlashes,
  createTable,
} from './webgl-state-diagram-utils.js';
import {
  vertexArrayState,
  textureState,
  activeTexNote,
  shaderState,
  programState,
  globalState,
} from './webgl-state-diagram-state-tables.js';
import {
  formatWebGLObject,
  addWebGLObjectInfo,
  getWebGLObjectInfo,
  formatWebGLObjectOrDefaultVAO,
} from './webgl-state-diagram-context-wrapper.js';
import Stepper from './webgl-state-diagram-stepper.js';
import ArrowManager from './webgl-state-diagram-arrows.js';

export default function main({webglVersion, windowPositions}) {
  const isWebGL2 = webglVersion === 'webgl2';

  hljs.initHighlightingOnLoad();

  gl = document.querySelector('canvas').getContext(webglVersion, {preserveDrawingBuffer: true});  /* eslint-disable-line */
  twgl.addExtensionsToContext(gl);

  const diagramElem = document.querySelector('#diagram');
  const codeElem = document.querySelector('#code');
  const stepper = new Stepper();
  const arrowManager = new ArrowManager(document.querySelector('#arrows'));

  const glEnumToString = twgl.glEnumToString;
  const formatEnum = v => glEnumToString(gl, v);

  let dragTarget;
  let dragMouseStartX;
  let dragMouseStartY;
  let dragTargetStartX;
  let dragTargetStartY;

  const converter = new showdown.Converter();
  const hintElem = document.querySelector('#hint');
  let lastWidth;
  let lastHeight;
  let lastHint;
  let showHintOnHover = true;
  function setHint(e, hint = '') {
    if (dragTarget) {
      hint = '';
    }
    if (lastHint !== hint) {
      lastHint = hint;
      const html = converter.makeHtml(hint);
      hintElem.style.display = '';  // show it so we can measure it
      hintElem.style.left = '0';    // let it expand
      hintElem.style.top = '0';     // let it expand
      hintElem.innerHTML = html;
      hintElem.querySelectorAll('pre>code').forEach(elem => hljs.highlightBlock(elem));
      hintElem.querySelectorAll('a').forEach(elem => elem.target = '_blank');
      lastWidth = hintElem.clientWidth;
      lastHeight = hintElem.clientHeight;
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

  function showHint(e) {
    if (e.target.nodeName === 'A' ||
        (e.type !== 'click' && !showHintOnHover)) {
      return;
    }
    const elem = e.target.closest('[data-help]');
    setHint(e, elem ? elem.dataset.help : '');
  }

  // document.body.addEventListener('mousemove', showHint);
  document.body.addEventListener('click', showHint);

  function flashExpanderIfClosed(elem) {
    const expander = elem.closest('.expander');
    if (!expander.classList.contains('open')) {
      flash(expander.children[0]);
    }
  }

  function flashSelfAndExpanderIfClosed(elem) {
    flash(elem);
    flashExpanderIfClosed(elem);
  }

  function updateElemAndFlashExpanderIfClosed(elem, value, flashOnChange = true) {
    const changed = updateElem(elem, value, flashOnChange);
    if (changed && flashOnChange) {
      flashExpanderIfClosed(elem);
    }
    return changed;
  }

  function toggleExpander(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.parentElement.classList.toggle('open');
    arrowManager.update();
    moveToFront(e.target);
  }

  function moveToFront(elemToFront) {
    elemToFront = elemToFront.closest('.draggable');
    const elements = [...document.querySelectorAll('.draggable')].filter(elem => elem !== elemToFront);
    elements.sort((a, b) => a.style.zIndex - b.style.zIndex);
    elements.push(elemToFront);
    elements.forEach((elem, ndx) => {
      elem.style.zIndex = ndx + 1;
    });
  }

  function dragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    dragTarget = this.closest('.draggable');
    const rect = this.getBoundingClientRect();
    dragMouseStartX = e.pageX;
    dragMouseStartY = e.pageY;
    dragTargetStartX = (window.scrollX + rect.left) | 0; // parseInt(this.style.left || '0');
    dragTargetStartY = (window.scrollY + rect.top) | 0;  // parseInt(this.style.top || '0');

    window.addEventListener('mousemove', dragMove, {passive: false});
    window.addEventListener('mouseup', dragStop, {passive: false});

    moveToFront(dragTarget);
  }

  function dragMove(e) {
    if (dragTarget) {
      e.preventDefault();
      e.stopPropagation();
      dragTarget.classList.add('dragging');
      const x = dragTargetStartX + (e.pageX - dragMouseStartX);
      const y = dragTargetStartY + (e.pageY - dragMouseStartY);
      dragTarget.style.left = px(x);
      dragTarget.style.top = px(y);
      arrowManager.update();
    }
  }

  function dragStop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragTarget.classList.remove('dragging');
    dragTarget = undefined;
    window.removeEventListener('mousemove', dragMove);
    window.removeEventListener('mouseup', dragStop);
  }

  // format for position is selfSide:baseSide:offset.
  // eg.: left:right-10 = put our left side - 10 units from right of base
  let windowCount = 0;
  function getNextWindowPosition(elem) {
    const info = windowPositions[windowCount++];
    let x = windowCount * 10;
    let y = windowCount * 10;
    if (info) {
      const {base, x: xDesc, y: yDesc} = info;
      const baseElem = getWindowElem(base);
      x = computeRelativePosition(elem, baseElem, xDesc);
      y = computeRelativePosition(elem, baseElem, yDesc);
    }
    return {x, y};
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

  function makeDraggable(elem) {
    const div = addElem('div', elem.parentElement, {
      className: 'draggable',
    });
    elem.remove();
    div.appendChild(elem);
    const pos = getNextWindowPosition(div);
    div.style.left = px(pos.x);
    div.style.top = px(pos.y);
    const nameElem = div.querySelector('.name');
    div.addEventListener('mousedown', (e) => {moveToFront(div);}, {passive: false});
    div.addEventListener('mousedown', dragStart, {passive: false});
    moveToFront(div);
    return div;
  }

  function createExpander(parent, title, attrs = {}) {
    const outer = addElem('div', parent, Object.assign({className: 'expander'}, attrs));
    const titleElem = addElem('div', outer, {
      textContent: title,
    });
    const inner = addElem('div', outer, {className: 'expander-content'});
    titleElem.addEventListener('click', toggleExpander);
    return inner;
  }

  const elemToArrowMap = new Map();
  function createStateTable(states, parent, title, queryFn, update = true) {
    const expander = createExpander(parent, title);
    const div = addElem('div', expander, {className: 'expander-content'});
    const table = addElem('table', div);
    const tbody = addElem('tbody', table);
    for (const state of states) {
      const {pname, help} = state;
      const tr = addElem('tr', tbody);
      tr.dataset.help = helpToMarkdown(help);
      addElem('td', tr, {textContent: pname});
      addElem('td', tr);
    }
    if (update) {
      updateStateTable(states, expander, queryFn, true);
    }
    return expander;
  }

  function querySelectorClassInclusive(elem, className) {
    return elem.classList.contains(className)
        ? elem
        : elem.querySelector(`.${className}`);
  }

  const hsl = (h, s, l) => `hsl(${h * 360 | 0}, ${s * 100 | 0}%, ${l * 100 | 0}%)`;

  function getColorForWebGLObject(webglObject, elem, level = 0) {
    const win = querySelectorClassInclusive(elem, 'window-content') || elem.closest('.window-content');
    const style = getComputedStyle(win);
    const c = chroma(style.backgroundColor).hsl();
    return hsl(c[0] / 360 + level * 8, 1, 0.8 - level * 0.4);
  }

  function updateStateTable(states, parent, queryFn, initial) {
    const tbody = parent.querySelector('tbody');
    // NOTE: Assumption that states array is parallel to table rows
    states.forEach((state, rowNdx) => {
      const {formatter} = state;
      const raw = queryFn(state);
      const value = formatter(raw);
      const row = tbody.rows[rowNdx];
      const cell = row.cells[1];
      const isNew = cell.textContent !== value.toString();
      cell.textContent = value;
      // FIX: should put this data else were instead of guessing
      if (isNew) {
        if (formatter === formatWebGLObject || formatter === formatWebGLObjectOrDefaultVAO) {
          const oldArrow = elemToArrowMap.get(cell);
          if (oldArrow) {
            arrowManager.remove(oldArrow);
            elemToArrowMap.delete(cell);
          }
          const targetInfo = raw
              ? getWebGLObjectInfo(raw)
              : (formatter === formatWebGLObjectOrDefaultVAO)
                  ? defaultVAOInfo
                  : null;
          if (targetInfo && !targetInfo.deleted) {
            elemToArrowMap.set(
                cell,
                arrowManager.add(
                    cell,
                    targetInfo.ui.elem.querySelector('.name'),
                    getColorForWebGLObject(raw, targetInfo.ui.elem)));
          }
        }
      }

      if (!initial && isNew) {
        flashSelfAndExpanderIfClosed(row);
      }
    });
  }

  function isBuiltIn(info) {
    const name = info.name;
    return name.startsWith("gl_") || name.startsWith("webgl_");
  }

  function createProgramAttributes(parent, gl, program) {
    const tbody = createTable(parent, ['name', 'location']);
    const arrows = [];

    const scan = () => {
      tbody.innerHTML = '';
      flash(tbody);
      arrows.forEach(arrow => arrowManager.remove(arrow));

      const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
      const vaoInfo = vao ? getWebGLObjectInfo(vao) : defaultVAOInfo;
      const isCurrent = gl.getParameter(gl.CURRENT_PROGRAM) === program;

      const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (let ii = 0; ii < numAttribs; ++ii) {
        const attribInfo = gl.getActiveAttrib(program, ii);
        if (isBuiltIn(attribInfo)) {
            continue;
        }
        const index = gl.getAttribLocation(program, attribInfo.name);
        const tr = addElem('tr', tbody);
        const help = helpToMarkdown(`
          get attribute location with

          ---js
          const loc = gl.getAttribLocation(program, '${attribInfo.name}');
          ---
          
          attribute locations are chosen by WebGL. You can choose locations
          by calling.

          ---js
          gl.bindAttribLocation(program, desiredLocation, '${attribInfo.name}');
          ---

          **BEFORE** calling
          
          ---js
          gl.linkProgram(program);
          ---
        `);
        addElem('td', tr, {textContent: attribInfo.name, dataset: {help}});
        addElem('td', tr, {textContent: index, dataset: {help}});

        if (isCurrent) {
          const target = vaoInfo.ui.elem.querySelector('tbody').rows[index]; /*.cells[bindPointIndex]; */
          arrows.push(arrowManager.add(
              tr,
              target,
              getColorForWebGLObject(vao, target, index / 8),
              {startDir: 'right', endDir: 'right', attrs: {'stroke-dasharray': '2 4'}}));
        }
      }
    };

    scan(true);

    return {
      elem: tbody,
      scan,
      update: scan,
    };
  }

  const {getUniformTypeInfo} = (function() {

  const FLOAT                         = 0x1406;
  const FLOAT_VEC2                    = 0x8B50;
  const FLOAT_VEC3                    = 0x8B51;
  const FLOAT_VEC4                    = 0x8B52;
  const INT                           = 0x1404;
  const INT_VEC2                      = 0x8B53;
  const INT_VEC3                      = 0x8B54;
  const INT_VEC4                      = 0x8B55;
  const BOOL                          = 0x8B56;
  const BOOL_VEC2                     = 0x8B57;
  const BOOL_VEC3                     = 0x8B58;
  const BOOL_VEC4                     = 0x8B59;
  const FLOAT_MAT2                    = 0x8B5A;
  const FLOAT_MAT3                    = 0x8B5B;
  const FLOAT_MAT4                    = 0x8B5C;
  const SAMPLER_2D                    = 0x8B5E;
  const SAMPLER_CUBE                  = 0x8B60;
  const SAMPLER_3D                    = 0x8B5F;
  const SAMPLER_2D_SHADOW             = 0x8B62;
  const FLOAT_MAT2x3                  = 0x8B65;
  const FLOAT_MAT2x4                  = 0x8B66;
  const FLOAT_MAT3x2                  = 0x8B67;
  const FLOAT_MAT3x4                  = 0x8B68;
  const FLOAT_MAT4x2                  = 0x8B69;
  const FLOAT_MAT4x3                  = 0x8B6A;
  const SAMPLER_2D_ARRAY              = 0x8DC1;
  const SAMPLER_2D_ARRAY_SHADOW       = 0x8DC4;
  const SAMPLER_CUBE_SHADOW           = 0x8DC5;
  const UNSIGNED_INT                  = 0x1405;
  const UNSIGNED_INT_VEC2             = 0x8DC6;
  const UNSIGNED_INT_VEC3             = 0x8DC7;
  const UNSIGNED_INT_VEC4             = 0x8DC8;
  const INT_SAMPLER_2D                = 0x8DCA;
  const INT_SAMPLER_3D                = 0x8DCB;
  const INT_SAMPLER_CUBE              = 0x8DCC;
  const INT_SAMPLER_2D_ARRAY          = 0x8DCF;
  const UNSIGNED_INT_SAMPLER_2D       = 0x8DD2;
  const UNSIGNED_INT_SAMPLER_3D       = 0x8DD3;
  const UNSIGNED_INT_SAMPLER_CUBE     = 0x8DD4;
  const UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

  const TEXTURE_2D                    = 0x0DE1;
  const TEXTURE_CUBE_MAP              = 0x8513;
  const TEXTURE_3D                    = 0x806F;
  const TEXTURE_2D_ARRAY              = 0x8C1A;

  const typeMap = {};

  /**
   * Returns the corresponding bind point for a given sampler type
   */
  //function getBindPointForSamplerType(gl, type) {
  //  return typeMap[type].bindPoint;
  //}

  // This kind of sucks! If you could compose functions as in `var fn = gl[name];`
  // this code could be a lot smaller but that is sadly really slow (T_T)

  const floatSetter = 'gl.uniform1f(location, value);';
  const floatArraySetter = 'gl.uniform1fv(location, arrayOfValues);';
  const floatVec2Setter = 'gl.uniform2fv(location, arrayOf2Values); // or\ngl.uniform2f(location, v0, v1);';
  const floatVec3Setter = 'gl.uniform3fv(location, arrayOf3Values); // or\ngl.uniform3f(location, v0, v1, v2);';
  const floatVec4Setter = 'gl.uniform4fv(location, arrayOf4Values); // or\ngl.uniform4f(location, v0, v1, v2, v3);';
  const intSetter = 'gl.uniform1i(location, value);';
  const intArraySetter = 'gl.uniform1iv(location, arrayOfValues);';
  const intVec2Setter = 'gl.uniform2iv(location, arrayOf2Values); // or\ngl.uniform2i(location, v0, v1)';
  const intVec3Setter = 'gl.uniform3iv(location, arrayOf3Values); // or\ngl.uniform3i(location, v0, v1, v2)';
  const intVec4Setter = 'gl.uniform4iv(location, arrayOf4Values); // or\ngl.uniform4i(location, v0, v1, v2, v3)';
  const uintSetter = 'gl.uniform1ui(location, value);';
  const uintArraySetter = 'gl.uniform1uiv(location, arrayOf1Value);';
  const uintVec2Setter = 'gl.uniform2uiv(location, arrayOf2Values); // or\ngl.uniform2ui(location, v0, v1)';
  const uintVec3Setter = 'gl.uniform3uiv(location, arrayOf3Values); // or\ngl.uniform3ui(location, v0, v1, v2)';
  const uintVec4Setter = 'gl.uniform4uiv(location, arrayOf4Values); // or\ngl.uniform4ui(location, v0, v1, v2, v3)';
  const floatMat2Setter = 'gl.uniformMatrix2fv(location, false, arrayOf4Values);';
  const floatMat3Setter = 'gl.uniformMatrix3fv(location, false, arrayOf9Values);';
  const floatMat4Setter = 'gl.uniformMatrix4fv(location, false, arrayOf16Values);';
  const floatMat23Setter = 'gl.uniformMatrix2x3fv(location, false, arrayOf6Values);';
  const floatMat32Setter = 'gl.uniformMatrix3x2fv(location, false, arrayOf6values);';
  const floatMat24Setter = 'gl.uniformMatrix2x4fv(location, false, arrayOf8Values);';
  const floatMat42Setter = 'gl.uniformMatrix4x2fv(location, false, arrayOf8Values);';
  const floatMat34Setter = 'gl.uniformMatrix3x4fv(location, false, arrayOf12Values);';
  const floatMat43Setter = 'gl.uniformMatrix4x3fv(location, false, arrayOf12Values);';
  const samplerSetter = 'gl.uniform1i(location, textureUnitIndex);\n// note: this only tells the shader\n// which texture unit to reference.\n// you still need to bind a texture\n// to that texture unit';
  const samplerArraySetter = 'gl.uniform1iv(location, arrayOfTextureUnitIndices);';

  typeMap[FLOAT]                         = { Type: Float32Array, size:  4, setter: floatSetter,      arraySetter: floatArraySetter, };
  typeMap[FLOAT_VEC2]                    = { Type: Float32Array, size:  8, setter: floatVec2Setter,  };
  typeMap[FLOAT_VEC3]                    = { Type: Float32Array, size: 12, setter: floatVec3Setter,  };
  typeMap[FLOAT_VEC4]                    = { Type: Float32Array, size: 16, setter: floatVec4Setter,  };
  typeMap[INT]                           = { Type: Int32Array,   size:  4, setter: intSetter,        arraySetter: intArraySetter, };
  typeMap[INT_VEC2]                      = { Type: Int32Array,   size:  8, setter: intVec2Setter,    };
  typeMap[INT_VEC3]                      = { Type: Int32Array,   size: 12, setter: intVec3Setter,    };
  typeMap[INT_VEC4]                      = { Type: Int32Array,   size: 16, setter: intVec4Setter,    };
  typeMap[UNSIGNED_INT]                  = { Type: Uint32Array,  size:  4, setter: uintSetter,       arraySetter: uintArraySetter, };
  typeMap[UNSIGNED_INT_VEC2]             = { Type: Uint32Array,  size:  8, setter: uintVec2Setter,   };
  typeMap[UNSIGNED_INT_VEC3]             = { Type: Uint32Array,  size: 12, setter: uintVec3Setter,   };
  typeMap[UNSIGNED_INT_VEC4]             = { Type: Uint32Array,  size: 16, setter: uintVec4Setter,   };
  typeMap[BOOL]                          = { Type: Uint32Array,  size:  4, setter: intSetter,        arraySetter: intArraySetter, };
  typeMap[BOOL_VEC2]                     = { Type: Uint32Array,  size:  8, setter: intVec2Setter,    };
  typeMap[BOOL_VEC3]                     = { Type: Uint32Array,  size: 12, setter: intVec3Setter,    };
  typeMap[BOOL_VEC4]                     = { Type: Uint32Array,  size: 16, setter: intVec4Setter,    };
  typeMap[FLOAT_MAT2]                    = { Type: Float32Array, size: 16, setter: floatMat2Setter,  };
  typeMap[FLOAT_MAT3]                    = { Type: Float32Array, size: 36, setter: floatMat3Setter,  };
  typeMap[FLOAT_MAT4]                    = { Type: Float32Array, size: 64, setter: floatMat4Setter,  };
  typeMap[FLOAT_MAT2x3]                  = { Type: Float32Array, size: 24, setter: floatMat23Setter, };
  typeMap[FLOAT_MAT2x4]                  = { Type: Float32Array, size: 32, setter: floatMat24Setter, };
  typeMap[FLOAT_MAT3x2]                  = { Type: Float32Array, size: 24, setter: floatMat32Setter, };
  typeMap[FLOAT_MAT3x4]                  = { Type: Float32Array, size: 48, setter: floatMat34Setter, };
  typeMap[FLOAT_MAT4x2]                  = { Type: Float32Array, size: 32, setter: floatMat42Setter, };
  typeMap[FLOAT_MAT4x3]                  = { Type: Float32Array, size: 48, setter: floatMat43Setter, };
  typeMap[SAMPLER_2D]                    = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
  typeMap[SAMPLER_CUBE]                  = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
  typeMap[SAMPLER_3D]                    = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
  typeMap[SAMPLER_2D_SHADOW]             = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
  typeMap[SAMPLER_2D_ARRAY]              = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
  typeMap[SAMPLER_2D_ARRAY_SHADOW]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
  typeMap[SAMPLER_CUBE_SHADOW]           = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
  typeMap[INT_SAMPLER_2D]                = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
  typeMap[INT_SAMPLER_3D]                = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
  typeMap[INT_SAMPLER_CUBE]              = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
  typeMap[INT_SAMPLER_2D_ARRAY]          = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };
  typeMap[UNSIGNED_INT_SAMPLER_2D]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D,       };
  typeMap[UNSIGNED_INT_SAMPLER_3D]       = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D,       };
  typeMap[UNSIGNED_INT_SAMPLER_CUBE]     = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP, };
  typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null,         size:  0, setter: samplerSetter,    arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY, };

  // this is the wrong place for this data. Should be asking the texture unit display
  const bindPointToIndex = {};
  bindPointToIndex[TEXTURE_2D] = 0;
  bindPointToIndex[TEXTURE_CUBE_MAP] = 1;
  bindPointToIndex[TEXTURE_3D] = 2;
  bindPointToIndex[TEXTURE_2D_ARRAY] = 3;

  return {
    getUniformTypeInfo(type) {
      return typeMap[type];
    },
    getIndexOfBindPoint(bindPoint) {
      return bindPointToIndex[bindPoint];
    },
  };

  }());

  function createProgramUniforms(parent, gl, program) {
    const tbody = createTable(parent, ['name', 'value']);

    let locationInfos = [];
    let numUniforms;

    const update = (initial) => {
      const isCurrent = gl.getParameter(gl.CURRENT_PROGRAM) === program;

      locationInfos.forEach((locationInfo, ndx) => {
        const {location, uniformTypeInfo} = locationInfo;
        const cell = tbody.rows[ndx].cells[1];
        const value = gl.getUniform(program, location);
        updateElemAndFlashExpanderIfClosed(cell, formatUniformValue(value), !initial);
        const bindPoint = uniformTypeInfo.bindPoint;
        if (bindPoint) {
          if (locationInfo.arrow) {
            arrowManager.remove(locationInfo.arrow);
          }
          if (isCurrent) {
            // const bindPointIndex = getIndexOfBindPoint(bindPoint);
            const target = globalUI.textureUnits.elem.querySelector('tbody').rows[value]; /*.cells[bindPointIndex]; */
            locationInfo.arrow =  arrowManager.add(
                  tbody.rows[ndx].cells[0],
                  target,
                  getColorForWebGLObject(null, target),
                  {startDir: 'left', endDir: 'right', attrs: {'stroke-dasharray': '2 4'}});
          }
        }
      });
    };

    const scan = () => {
      locationInfos.forEach(({arrow}) => {
        if (arrow) {
          arrowManager.remove(arrow);
        }
      });
      locationInfos = [];
      numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      tbody.innerHTML = '';
      flash(tbody);

      for (let ii = 0; ii < numUniforms; ++ii) {
        const uniformInfo = gl.getActiveUniform(program, ii);
        if (isBuiltIn(uniformInfo)) {
            continue;
        }
        let name = uniformInfo.name;
        // remove the array suffix.
        if (name.substr(-3) === "[0]") {
          name = name.substr(0, name.length - 3);
        }
        const uniformTypeInfo = getUniformTypeInfo(uniformInfo.type);
        const help = helpToMarkdown(`---js\nconst location = gl.getUniformLocation(\n    program,\n    '${name}');\ngl.useProgram(program); // set current program\n${uniformTypeInfo.setter}\n---`);
        locationInfos.push({
          location: gl.getUniformLocation(program, name),
          uniformInfo,
          uniformTypeInfo,
        });

        const tr = addElem('tr', tbody);
        addElem('td', tr, {textContent: name, dataset: {help}});
        addElem('td', tr, {
          dataset: {help},
        });
      }
      update();
    };

    scan();
    update(true);

    return {
      elem: tbody,
      scan,
      update,
    };
  }

  function setName(elem, name) {
    const nameElem = elem.querySelector('.name');
    nameElem.textContent = `${nameElem.textContent}[${name}]`;
  }

  function createShaderDisplay(parent, name, shader) {
    const type = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.VERTEX_SHADER ? 'vertex' : 'fragment';

    const shElem = createTemplate(parent, `#${type}-shader-template`);
    setName(shElem, name);

    const sourceExpander = createExpander(shElem, 'source');
    const preElem = addElem('pre', sourceExpander);

    const updateSource = () => {
      preElem.innerHTML = '';
      const codeElem = addElem('code', preElem, {className: 'lang-glsl'});
      codeElem.textContent = gl.getShaderSource(shader);
      hljs.highlightBlock(codeElem);
      expand(sourceExpander);
    };

    const queryFn = state => {
      const {pname} = state;
      const value = gl.getShaderParameter(shader, gl[pname]);
      return value;
    };

    const stateTable = createStateTable(shaderState, shElem, 'state', queryFn);
    expand(stateTable);
    makeDraggable(shElem);

    return {
      elem: shElem,
      updateSource,
      updateState: () => {
        updateStateTable(shaderState, stateTable, queryFn);
      },
    };
  }

  function createProgramDisplay(parent, name, program) {
    const prgElem = createTemplate(parent, '#program-template');
    setName(prgElem, name);

    const shaderExpander = createExpander(prgElem, 'attached shaders');
    const shadersTbody = createTable(shaderExpander, []);

    let arrows = [];
    let oldShaders = [];
    let newShaders;

    const updateAttachedShaders = () => {
      shadersTbody.innerHTML = '';

      arrows.forEach(arrow => arrowManager.remove(arrow));

      newShaders = gl.getAttachedShaders(program);
      collapseOrExpand(shaderExpander, newShaders.length > 0);

      // sort so VERTEX_SHADER is first.
      newShaders.sort((a, b) => {
        const aType = gl.getShaderParameter(a, gl.SHADER_TYPE);
        const bType = gl.getShaderParameter(b, gl.SHADER_TYPE);
        return aType < bType;
      });

      for (const shader of newShaders) {
        const tr = addElem('tr', shadersTbody);
        const td = addElem('td', tr, {
            textContent: formatWebGLObject(shader),
        });
        if (oldShaders.indexOf(shader) < 0) {
          flashSelfAndExpanderIfClosed(td);
        }
        const targetInfo = getWebGLObjectInfo(shader);
        if (!targetInfo.deleted) {
          arrows.push(arrowManager.add(
              tr,
              targetInfo.ui.elem.querySelector('.name'),
              getColorForWebGLObject(shader, targetInfo.ui.elem)));
        }
      }

      oldShaders = newShaders;
    };

    const attribExpander = createExpander(prgElem, 'attribute info', {
      dataset: {
        hint: 'attributes are user defined. Their values come from buffers as specified in a *vertex array*.',
      },
    });
    const uniformExpander = createExpander(prgElem, 'uniforms', {
      dataset: {
        hint: 'uniform values are user defined program state. The locations and values are different for each program.',
      },
    });


    expand(attribExpander);
    expand(uniformExpander);

    const attribUI = createProgramAttributes(attribExpander, gl, program);
    const uniformUI = createProgramUniforms(uniformExpander, gl, program);

    const queryFn = state => {
      const {pname} = state;
      const value = gl.getProgramParameter(program, gl[pname]);
      return value;
    };

    const stateTable = createStateTable(programState, prgElem, 'state', queryFn);
    expand(stateTable);

    makeDraggable(prgElem);

    return {
      elem: prgElem,
      updateAttachedShaders,
      updateState: () => {
        updateStateTable(programState, stateTable, queryFn);
      },
      scanAttributes: attribUI.scan,
      updateAttributes: attribUI.update,
      scanUniforms: uniformUI.scan,
      updateUniforms: uniformUI.update,
    };
  }

  const maxAttribs = 8;
  function createVertexArrayDisplay(parent, name, webglObject) {
    const vaElem = createTemplate(parent, '#vertex-array-template');
    setName(vaElem, name);
    const vaoNote = isWebGL2
        ? helpToMarkdown(`
            The current vertex array is set with --gl.bindVertexArray(someVertexArray)--.
          `)
        : helpToMarkdown(`
            note: the current vertex array can be set with the
            [--OES_vertex_array_object--](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/)
            extension. Otherwise there is only the 1 default vertex array in WebGL 1.0.
          `);
    const attrExpander = createExpander(vaElem.querySelector('.state-table'), 'attributes');
    expand(attrExpander);
    const table = createTemplate(attrExpander, '#vertex-attributes-template');
    const attrsElem = table.querySelector('tbody');

    for (let i = 0; i < maxAttribs; ++i) {
      const tr = addElem('tr', attrsElem);

      addElem('td', tr, {
        dataset: {
          help: helpToMarkdown(`
          * --true-- this attribute uses data from a buffer.
          * --false-- it uses --value--.

          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.enableVertexAttribArray(index);   // turn on
          gl.disableVertexAttribArray(index);  // turn off
          ---

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-disabled',
        dataset: {
          help: helpToMarkdown(`
          The value used if this attribute is disabled.

          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttrib4fv(index, [1, 2, 3, 4]);
          ---

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          Number of values to pull from buffer per vertex shader iteration

          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttribPointer(index, SIZE, type, normalize, stride, offset);
          ---

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          The type of the data to read from the buffer. 
          --BYTE--, --UNSIGNED_BYTE--, --SHORT--, --UNSIGNED_SHORT--,
          --INT--, --UNSIGNED_INT--, --FLOAT--

          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttribPointer(index, size, TYPE, normalize, stride, offset);
          ---

          ${vaoNote}`),
        },
      });
      if (isWebGL2) {
        addElem('td', tr, {
          className: 'used-when-enabled',
          dataset: {
            help: helpToMarkdown(`
            --true-- = the data is and stays an integer (for int and uint attributes)
            --false-- = the data gets converted to float

            for float based attributes (float, vec2, vec3, vec4, mat4, ...)

            ---js
            const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
            gl.vertexAttribPointer(index, size, type, NORMALIZE, stride, offset);
            ---

            for int and uint attributes (int, uint, ivec3, uvec4, ...)

            ---js
            const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
            gl.vertexAttribIPointer(index, size, type, stride, offset);
            ---

            ${vaoNote}`),
          },
        });
      }
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          --true-- = use the value as is
          --false-- = convert the value to 0.0 to 1.0 for UNSIGNED types
          and -1.0 to 1.0 for signed types.

          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttribPointer(index, size, type, NORMALIZE, stride, offset);
          ---

          ${isWebGL2 ? 'Not used for integer attributes like (int, uint, ivec3, uvec4, ...' : ''}

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          how many bytes to advance in the buffer per vertex shader iteration
          to get to the next value for this attribute. 0 is a special value
          that means WebGL will figure out the stride from the --type-- and
          --size-- arguments.
          
          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttribPointer(index, size, type, normalize, STRIDE, offset);
          ---

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          The offset in bytes where the data for this attribute starts in the buffer.
          
          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
          gl.vertexAttribPointer(index, size, type, normalize, stride, OFFSET);
          ---

          ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: isWebGL2
              ? helpToMarkdown(`
                Used when calling --gl.drawArraysInstanced-- or gl.drawDrawElementsInstanced--.
                If --divisor-- === 0 then this attribute advances normally, once each vertex shader iteration.
                If --divisor-- > 0 then this attribute advances once each --divisor-- instances.
                
                ---js
                const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
                gl.vertexAttribDivisor(index, divisor);
                ---

                ${vaoNote}`)
              : helpToMarkdown(`
                Used with the [--ANGLE_instanced_arrays--](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/)  extension.
                If --divisor-- === 0 then this attribute advances normally, once each vertex shader iteration.
                If --divisor-- > 0 then this attribute advances once each --divisor-- instances.
                
                ---js
                const ext = gl.getExtension('ANGLE_instanced_arrays');
                const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
                ext.vertexAttribDivisor(index, divisor);
                ---

                ${vaoNote}`),
        },
      });
      addElem('td', tr, {
        className: 'used-when-enabled',
        dataset: {
          help: helpToMarkdown(`
          The buffer this attribute will pull data from. This gets set
          implicitly when calling --gl.vertexAttribPointer-- from the
          currently bound --ARRAY_BUFFER--
          
          ---js
          const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}

          // bind someBuffer to ARRAY_BUFFER
          gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);

          // someBuffer will get bound to this attribute
          gl.vertexAttribPointer(index, size, type, normalize, stride, offset);
          ---

          ${vaoNote}`),
        },
      });
    }

    const formatters = isWebGL2
        ? [
            formatBoolean,      // enable
            formatUniformValue, // value
            formatUniformValue, // size
            formatEnum,         // type
            formatBoolean,      // integer
            formatBoolean,      // normalize
            formatUniformValue, // stride
            formatUniformValue, // offset
            formatUniformValue, // divisor
            formatWebGLObject,  // buffer
          ]
        : [
            formatBoolean,      // enable
            formatUniformValue, // value
            formatUniformValue, // size
            formatEnum,         // type
            formatBoolean,      // normalize
            formatUniformValue, // stride
            formatUniformValue, // offset
            formatUniformValue, // divisor
            formatWebGLObject,  // buffer
          ];
    const arrows = [];

    const updateAttributes = (flashOnChange = true) => {
      for (let i = 0; i < maxAttribs; ++i) {
        const row = attrsElem.rows[i];
        const data = isWebGL2
            ? [
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
                gl.getVertexAttrib(i, gl.CURRENT_VERTEX_ATTRIB),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_SIZE),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_TYPE),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_INTEGER),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
                gl.getVertexAttribOffset(i, gl.VERTEX_ATTRIB_ARRAY_POINTER),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_DIVISOR),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
              ]
            : [
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
                gl.getVertexAttrib(i, gl.CURRENT_VERTEX_ATTRIB),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_SIZE),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_TYPE),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
                gl.getVertexAttribOffset(i, gl.VERTEX_ATTRIB_ARRAY_POINTER),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_DIVISOR),
                gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
              ];
        if (data[0]) {
          row.classList.add('attrib-enable');
        } else {
          row.classList.remove('attrib-enable');
        }
        const bufferNdx = isWebGL2 ? 9 : 8;  // FIXME
        data.forEach((value, cellNdx) => {
          const cell = row.cells[cellNdx];
          const newValue = formatters[cellNdx](value);
          if (updateElemAndFlashExpanderIfClosed(cell, newValue, flashOnChange)) {
            if (cellNdx === bufferNdx) {
              const oldArrow = arrows[i];
              if (oldArrow) {
                arrowManager.remove(oldArrow);
                arrows[i] = null;
              }
              if (value) {
                const targetInfo = getWebGLObjectInfo(value);
                if (!targetInfo.deleted) {
                  arrows[i] = arrowManager.add(
                      cell,
                      targetInfo.ui.elem.querySelector('.name'),
                      getColorForWebGLObject(value, targetInfo.ui.elem, i / maxAttribs));
                }
              }
            }
          }
        });
      }
    };
    updateAttributes(false);

    const vaQueryFn = state => {
      const {pname} = state;
      const value = gl.getParameter(gl[pname]);
      return value;
    };

    const stateTable = createStateTable(vertexArrayState, vaElem.querySelector('.state-table'), 'state', vaQueryFn);
    expand(stateTable);
    makeDraggable(vaElem);

    return {
      elem: vaElem,
      updateAttributes,
      updateState: () => {
        updateStateTable(vertexArrayState, stateTable, vaQueryFn);
      },
    };
  }

  function createBufferDisplay(parent, name /*, webglObject */) {
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

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  function createTextureDisplay(parent, name, texture) {
    const texElem = createTemplate(parent, '#texture-template');
    setName(texElem, name);
    const nameLine = texElem.querySelector('.name-line');
    const badElem = createElem('div', {
      textContent: '☢',
      className: 'bad',
      dataset: {
        help: isWebGL2
            ? helpToMarkdown(`
              <span style="color:red;">**This texture is un-renderable!**</span>

              One or more of the following are true

              * It as never been bound. A texture's type is unknown until bound at least once
              * It has only 1 mip level that is larger than 1x1 but filtering is set to
                use mips.
              * It has a mip chain that doesn't match. Each lower mip is not half the width
                and half the height of the previous mip or they are different internal formats.
              * It doesn't have mips set to all specified mip levels.
              * It's a --CUBE_MAP-- but it's not square or its sides are not the same size
              `)
            : helpToMarkdown(`
              <span style="color:red;">**This texture is un-renderable!**</span>

              One or more of the following are true

              * It as never been bound. A texture's type is unknown until bound at least once
              * It has only 1 mip level that is larger than 1x1 but filtering is set to
                use mips.
              * It's dimensions are not power-of-2 and has filtering on that requires mips
                or has wrapping set to something other than --CLAMP_TO_EDGE--
              * It has a mip chain that doesn't match. Each lower mip is not half the width
                and half the height of the previous mip or they are different internal formats.
              * It needs mips but doesn't have mips all the way down to 1x1 size.
              * It's a --CUBE_MAP-- but it's not square or its sides are not the matching sizes
              `),
      }
    });
    nameLine.insertBefore(badElem, nameLine.lastChild);

    const mipsExpander = createExpander(texElem, 'mips');
    const mipsOuterElem = addElem('div', mipsExpander);
    const mipsElem = addElem('div', mipsOuterElem, {className: 'mips'});
    const maxMips = 8;
    const mips = [];

    function isGood() {
      const info = getWebGLObjectInfo(texture);
      const target = info.target;
      if (!target) {
        return false;  // never bound
      }

      const firstMip = mips[0];
      if (!firstMip) {
        return false;  // no mips
      }

      let {width, height} = firstMip;
      const isPOT = isWebGL2 || (isPowerOf2(width) && isPowerOf2(height));

      const minFilter = gl.getTexParameter(target, gl.TEXTURE_MIN_FILTER);
      const needsMips = minFilter !== gl.NEAREST && minFilter !== gl.LINEAR;
      if (!isPOT && needsMips) {
        return false;
      }

      if (!isPOT) {
        const wrapS = gl.getTexParameter(target, gl.TEXTURE_WRAP_S);
        const wrapT = gl.getTexParameter(target, gl.TEXTURE_WRAP_T);
        if (wrapS !== gl.CLAMP_TO_EDGE || wrapS !== gl.CLAMP_TO_EDGE) {
          return false;
        }
      }

      if (needsMips) {
        let level = 0;
        for (;;) {
          if (width === 1 && height === 1) {
            break;
          }
          width = Math.max(width >> 1, 1);
          height = Math.max(height >> 1, 1);
          const mip = mips[++level];
          if (!mip || mip.width !== width || mip.height !== height) {
            return false;
          }
        }
      }

      return true;
    }

    function updateGood() {
      addRemoveClass(badElem, 'good', isGood());
    }

    function updateMips() {
      let size = 128;
      let foundMip = false;

      mipsElem.innerHTML = '';

      const info = getWebGLObjectInfo(texture);
      const target = info.target;
      const magFilter = gl.getTexParameter(target, gl.TEXTURE_MAG_FILTER);
      const minFilter = gl.getTexParameter(target, gl.TEXTURE_MIN_FILTER);

      for (let i = 0; i < maxMips; ++i) {
        const filter = i === 0
           ? magFilter === gl.LINEAR
           : minFilter === gl.NEAREST_MIPMAP_LINEAR || minFilter === gl.LINEAR_MIPMAP_LINEAR;
        if (foundMip) {
          size = Math.max(size / 2, 1);
        }
        const mipCanvas = mips[i];
        if (!mipCanvas) {
          continue;
        }
        foundMip = true;
        const width = size;
        const height = Math.max(size * mipCanvas.height / mipCanvas.width, 1);

        mipCanvas.remove();
        mipCanvas.style.width = px(width);
        mipCanvas.style.height = px(height);
        mipCanvas.classList.remove('filtering-linear');
        mipCanvas.classList.remove('filtering-nearest');
        mipCanvas.classList.add(filter ? 'filtering-linear' : 'filtering-nearest');

        const div = addElem('div', mipsElem, {
          className: `mip${i}`,
          dataset: {
            help: helpToMarkdown(`
              Uploading data

              ---js
              const target = gl.TEXTURE_2D;
              const level = ${i};
              const internalFormat = gl.RGBA;
              const width = ${size};
              const height = ${size};
              const format = gl.RGBA;
              const type = gl.UNSIGNED_BYTE;
              gl.texImage2D(
                  target, level, internalFormat,
                  width, height, 0, format, type,
                  someUnit8ArrayWith${size}x${size}x4Values);
              ---

              Uploading an image/canvas/video. The image must
              have finished downloading.

              ---js
              const target = gl.TEXTURE_2D;
              const level = ${i};
              const internalFormat = gl.RGBA;
              const format = gl.RGBA;
              const type = gl.UNSIGNED_BYTE;
              gl.texImage2D(
                  target, level, internalFormat,
                  format, type, imageCanvasVideoElem);
              ---

              mips > 0 can be generated by calling
              --gl.generateMipmap(gl.TEXTURE_2D);--

              ${activeTexNote}`),
          },
        });
        div.appendChild(mipCanvas);
      }
      updateGood();
    }

    function updateMipFromData(target, level, internalFormat, width, height, border, format, type, data) {
      // only handle LUMINANCE for now
      // don't handle UNPACK_ALIGNMENT
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(width, height);
      const pixels = imgData.data;

      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const srcOff = y * width + x;
          const dstOff = srcOff * 4;
          pixels[dstOff    ] = data[srcOff];
          pixels[dstOff + 1] = data[srcOff];
          pixels[dstOff + 2] = data[srcOff];
          pixels[dstOff + 3] = 0xFF;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      mips[level] = canvas;
      updateMips();
    }

    function makeCanvasCopyOfElement(elem, width, height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(elem, 0, 0, width, height);
      return ctx.canvas;
    }

    function updateMipFromImage(target, level, internalFormat, format, type, element) {
      const {width, height} = element;
      mips[level] = makeCanvasCopyOfElement(element, width, height);
      updateMips();
    }

    function updateMip(..._args) {
      const args = [..._args];
      switch (args.length) {
        case 9:
          updateMipFromData(...args);
          break;
        case 6:
          updateMipFromImage(...args);
          break;
        default:
          throw new Error('unknown arguments for texImage2D');
      }
    }

    function generateMips(target) {
      let level = 0;
      for (;;) {
        const mipCanvas = mips[level++]
        const {width, height} = mipCanvas;
        if (width === 1 && height === 1) {
          break;
        }
        const mipWidth = Math.max(width / 2 | 0, 1);
        const mipHeight = Math.max(height / 2 | 0, 1);
        mips[level] = makeCanvasCopyOfElement(mipCanvas, mipWidth, mipHeight);
      }
      updateMips();
    }

    const updateData = () => {};

    const queryFn = state => {
      const {pname} = state;
      const info = getWebGLObjectInfo(texture);
      const target = info.target;
      const value = gl.getTexParameter(target, gl[pname]);
      updateGood();
      return value;
    };

    const stateTable = createStateTable(textureState, texElem, 'texture state', queryFn, false);

    expand(mipsExpander);
    expand(stateTable);
    makeDraggable(texElem);

    return {
      elem: texElem,
      updateData,
      updateState: (initial = false) => {
        const info = getWebGLObjectInfo(texture);
        const target = info.target;
        // because when texture is created we don't know what kind it is until
        // first bind (2D, CUBE_MAP, ...)
        if (target) {
          updateStateTable(textureState, stateTable, queryFn, initial);
          updateMips();
        }
      },
      updateMip,
      generateMips,
    };
  }

  function createTextureUnits(parent, maxUnits = 8) {
    const expander = createExpander(parent, 'Texture Units');

    const targets = isWebGL2
        ? ['TEXTURE_2D', 'TEXTURE_CUBE_MAP', 'TEXTURE_3D', 'TEXTURE_2D_ARRAY']
        : ['TEXTURE_2D', 'TEXTURE_CUBE_MAP'];

    const tbody = createTable(expander, targets.map(v => v.replace('TEXTURE_', '')));
    const arrows = [];
    let activeTextureUnit = 0;

    for (let i = 0; i < maxUnits; ++i) {
      arrows.push({});
      const tr = addElem('tr', tbody);
      for (const target of targets) {
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

    const targetBindings = isWebGL2
        ? [gl.TEXTURE_BINDING_2D, gl.TEXTURE_BINDING_CUBE_MAP, gl.TEXTURE_BINDING_3D, gl.TEXTURE_BINDING_2D_ARRAY]
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

  function collapseOrExpand(inner, open) {
    const action = open ? 'add' : 'remove' 
    const elem = inner.parentElement;
    if (elem.classList.contains('expander')) {
      elem.classList[action]('open');
    } else {
      elem.querySelector('.expander').classList[action]('open');
    }
    return elem;
  }
  const expand = (elem) => collapseOrExpand(elem, true);
  // const collapse = (elem) => collapseOrExpand(elem, false);

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

  const settersToWrap = {};

  function createStateUI(stateTable, parent, name, queryFn) {
    const elem = createStateTable(stateTable, parent, name, queryFn);
    const updateState = () => {
      updateStateTable(stateTable, elem, queryFn);
    };

    for (const state of stateTable) {
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
  const globalUI = {
    commonState: createStateUI(globalState.commonState, globalStateElem, 'common state', globalStateQuery),
    textureUnits: createTextureUnits(globalStateElem, 8),
    clearState: createStateUI(globalState.clearState, globalStateElem, 'clear state', globalStateQuery),
    depthState: createStateUI(globalState.depthState, globalStateElem, 'depth state', globalStateQuery),
    blendState: createStateUI(globalState.blendState, globalStateElem, 'blend state', globalStateQuery),
    miscState: createStateUI(globalState.miscState, globalStateElem, 'misc state', globalStateQuery),
    stencilState: createStateUI(globalState.stencilState, globalStateElem, 'stencil state', globalStateQuery),
    polygonState: createStateUI(globalState.polygonState, globalStateElem, 'polygon state', globalStateQuery),
  };
  expand(globalUI.textureUnits.elem);
  expand(globalUI.commonState.elem);
  expand(globalUI.clearState.elem);
  expand(globalUI.depthState.elem);

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
        return fn.call(this, origFn, ...args);
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
    return createTextureDisplay(diagramElem, name, webglObject, '/webgl/resources/f-texture.png');
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
  wrapDeleteFn('deleteTexture');
  wrapDeleteFn('deleteBuffer');
  wrapDeleteFn('deleteShader');
  wrapDeleteFn('deleteProgram');
  wrapDeleteFn('deleteVertexArray');

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
    globalUI.textureUnits.updateCurrentTextureUnit(target);
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
      globalUI.commonState.updateState();
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
    return vertexArray ? getWebGLObjectInfo(vertexArray) : defaultVAOInfo;
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
    globalUI.textureUnits.updateActiveTextureUnit();
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

  function wrapDrawFn(fnName) {
    wrapFn(fnName, function(origFn, ...args) {
      origFn.call(this, ...args);
      flash(canvasDraggable.querySelector('.name'));
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

  stepper.init(codeElem, document.querySelector('#js').text, {
    onAfter: afterStep,
    onHelp: showHelp,
    onLine: showLineHelp,
  });
  if (window.location.hash.indexOf('no-help') < 0) {
    showHelp();
  }


  window.addEventListener('resize', handleResizes);
}
