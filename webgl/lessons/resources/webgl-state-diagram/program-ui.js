
/* global gl */

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  addElem,
  createTable,
  createTemplate,
  flash,
  formatUniformValue,
  getColorForWebGLObject,
  helpToMarkdown,
  setName,
} from './utils.js';

import {
  formatWebGLObject,
  getWebGLObjectInfo,
  getWebGLObjectInfoOrDefaultVAO,
  getWebGLObjectInfoOrDefaultTFO,
} from './context-wrapper.js';

import {
  collapseOrExpand,
  createExpander,
  flashSelfAndExpanderIfClosed,
  expand,
  makeDraggable,
  updateElemAndFlashExpanderIfClosed,
} from './ui.js';

import {
  createStateTable,
  updateStateTable,
} from './state-table.js';
import {highlightBlock} from './code-highlight.js';
import {arrowManager} from './arrows.js';
import {
  globals,
} from './globals.js';

const glEnumToString = twgl.glEnumToString;
const noop = () => {};

function isBuiltIn(info) {
  const name = info.name;
  return name.startsWith("gl_") || name.startsWith("webgl_");
}

function createProgramAttributes(parent, gl, program) {
  const tbody = createTable(parent, ['name', 'type', 'location']);
  const arrows = [];
  let expanded = false;

  const scan = () => {
    tbody.innerHTML = '';
    flash(tbody);
    arrows.forEach(arrow => arrowManager.remove(arrow));

    const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    const vaoInfo = getWebGLObjectInfoOrDefaultVAO(vao);
    const isCurrent = gl.getParameter(gl.CURRENT_PROGRAM) === program;

    let numActualAttribs = 0;
    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let ii = 0; ii < numAttribs; ++ii) {
      const attribInfo = gl.getActiveAttrib(program, ii);
      if (isBuiltIn(attribInfo)) {
          continue;
      }
      ++numActualAttribs;
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
      addElem('td', tr, {textContent: glEnumToString(gl, attribInfo.type), dataset: {help}});
      addElem('td', tr, {textContent: index, dataset: {help}});

      if (isCurrent) {
        const enabled = gl.getVertexAttrib(ii, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
        const target = enabled
            ? vaoInfo.ui.elem.querySelector('tbody').rows[index] /*.cells[bindPointIndex]; */
            : globals.globalUI.attribValueState.elem.querySelector('tbody').rows[index];
        arrows.push(arrowManager.add(
            tr,
            target,
            getColorForWebGLObject(vao, target, index / 8),
            {startDir: 'right', endDir: 'right', attrs: {'stroke-dasharray': '2 4'}}));
      }
    }
    if (!expanded && numActualAttribs > 0) {
      expanded = true;
      expand(parent);
    }
  };

  scan(true);

  return {
    elem: tbody,
    scan,
    update: scan,
  };
}

function createProgramTransformFeedbackVaryings(parent, gl, program) {
  const tbody = createTable(parent, ['name', 'type', 'size']);
  const arrows = [];
  let expanded = false;

  const scan = () => {
    const isLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isLinked) {
      return;
    }

    tbody.innerHTML = '';
    flash(tbody);
    arrows.forEach(arrow => arrowManager.remove(arrow));

    const tf = gl.getParameter(gl.TRANSFORM_FEEDBACK_BINDING);
    const tfInfo = getWebGLObjectInfoOrDefaultTFO(tf);
    const isCurrent = gl.getParameter(gl.CURRENT_PROGRAM) === program;

    const numAttribs = gl.getProgramParameter(program, gl.TRANSFORM_FEEDBACK_VARYINGS);
    if (!expanded && numAttribs > 0) {
      expanded = true;
      expand(parent);
    }
    for (let ii = 0; ii < numAttribs; ++ii) {
      const attribInfo = gl.getTransformFeedbackVarying(program, ii);
      const tr = addElem('tr', tbody);
      const help = helpToMarkdown(`
      created by declaring an --out-- varying in a vertex shader
      and then calling **before** calling --gl.linkProgram--
      you call --gl.transformFeedbackVaryings--  and pass the names
      of the varyings in the order you want them written.
      `);
      addElem('td', tr, {textContent: attribInfo.name, dataset: {help}});
      addElem('td', tr, {textContent: glEnumToString(gl, attribInfo.type), dataset: {help}});
      addElem('td', tr, {textContent: ii, dataset: {help}});

      if (isCurrent && tfInfo) {
        const target = tfInfo.ui.elem.querySelector('tbody').rows[ii]; /*.cells[bindPointIndex]; */
        arrows.push(arrowManager.add(
            tr,
            target,
            getColorForWebGLObject(tf, target, ii / 8),
            {startDir: 'right', endDir: 'left', attrs: {'stroke-dasharray': '2 4'}}));
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
  let expanded = false;
  let locationInfos = [];  // info for free uniforms
  let blockSpecs = {};     // info for each uniform block
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
          const target = globals.globalUI.textureUnits.elem.querySelector('tbody').rows[value]; /*.cells[bindPointIndex]; */
          locationInfo.arrow =  arrowManager.add(
                tbody.rows[ndx].cells[0],
                target,
                getColorForWebGLObject(null, target),
                {startDir: 'left', endDir: 'right', attrs: {'stroke-dasharray': '2 4'}});
        }
      }
    });

    if (globals.isWebGL2) {
      const oldUniformBuffer = gl.getParameter(gl.UNIFORM_BUFFER_BINDING);
      let ndx = locationInfos.length;
      for (const blockSpec of Object.values(blockSpecs)) {
        const {index, size, uniformInfos, arrow} = blockSpec;
        const blockNameCell = tbody.rows[ndx].cells[0];
        const blockIndexCell = tbody.rows[ndx++].cells[1];
        arrowManager.remove(arrow);

        const bufferIndex = gl.getActiveUniformBlockParameter(program, index, gl.UNIFORM_BLOCK_BINDING);
        updateElemAndFlashExpanderIfClosed(blockIndexCell, formatUniformValue(bufferIndex), !initial);

        let data;
        let bad = false;
        if (isCurrent) {
          // which index is this block using
          // TODO: connect this block to its bufferIndex
          // which buffer is on that index
          const buffer = gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING, bufferIndex);
          const offset = gl.getIndexedParameter(gl.UNIFORM_BUFFER_START, bufferIndex);
          gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
          const bufferSize = buffer ? gl.getBufferParameter(gl.UNIFORM_BUFFER, gl.BUFFER_SIZE) : 0;
          const bindingSize = gl.getIndexedParameter(gl.UNIFORM_BUFFER_SIZE, bufferIndex);
          const bufSectionSize = bindingSize || bufferSize;

          const target = globals.globalUI.uniformBufferBindingsState.elem.querySelector('tbody').rows[bufferIndex];
          blockSpec.arrow = arrowManager.add(
              blockNameCell,
              target,
              getColorForWebGLObject(null, target),
              {startDir: 'left', endDir: 'right', attrs: {'stroke-dasharray': '2 4'}});

          if (bufSectionSize < size) {
            bad = true;
          } else if (buffer) {
            // get the data from the buffer
            data = new Uint8Array(bufSectionSize);
            if (offset + bufSectionSize > bufferSize) {
              bad = true;
            } else {
              gl.getBufferSubData(gl.UNIFORM_BUFFER, offset, data);
            }
          }

        }
        for (const uniformInfo of uniformInfos) {
          const cell = tbody.rows[ndx++].cells[1];
          let value;
          if (bad) {
            value = '-OUT-OF-RANGE-';
          } else if (!data) {
            value = '-unknown-';
          } else {
            const typeInfo = getUniformTypeInfo(uniformInfo.type);
            const Type = typeInfo.Type;
            const length = uniformInfo.size * typeInfo.size;
            value = new Type(data.buffer, uniformInfo.offset, length / Type.BYTES_PER_ELEMENT);
          }
          updateElemAndFlashExpanderIfClosed(cell, formatUniformValue(value), !initial);
        }
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, oldUniformBuffer);
    }
  };

  const scan = () => {
    locationInfos.forEach(({arrow}) => arrowManager.remove(arrow));
    for (const {arrow} of Object.values(blockSpecs)) {
      arrowManager.remove(arrow);
    }
    locationInfos = [];
    numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    tbody.innerHTML = '';
    flash(tbody);
    if (!expanded && numUniforms > 0) {
      expanded = true;
      expand(parent);
    }

    // look up free uniforms
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
      const location = gl.getUniformLocation(program, name);
      // the uniform will have no location if it's in a uniform block
      if (!location) {
        continue;
      }
      locationInfos.push({
        location,
        uniformInfo,
        uniformTypeInfo,
      });
      const tr = addElem('tr', tbody);
      addElem('td', tr, {textContent: name, dataset: {help}});
      addElem('td', tr, {
        dataset: {help},
      });
    }

    // look up uniform blocks
    if (globals.isWebGL2 && numUniforms) {
      const uniformData = [];
      blockSpecs = {};
      const uniformIndices = [];

      for (let ii = 0; ii < numUniforms; ++ii) {
        uniformIndices.push(ii);
        uniformData.push({});
        const uniformInfo = gl.getActiveUniform(program, ii);
        if (isBuiltIn(uniformInfo)) {
          break;
        }
        // REMOVE [0]?
        uniformData[ii].name = uniformInfo.name;
      }

      [
        [ "UNIFORM_TYPE", "type" ],
        [ "UNIFORM_SIZE", "size" ],  // num elements
        [ "UNIFORM_BLOCK_INDEX", "blockNdx" ],
        [ "UNIFORM_OFFSET", "offset", ],
      ].forEach(function(pair) {
        const pname = pair[0];
        const key = pair[1];
        gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function(value, ndx) {
          uniformData[ndx][key] = value;
        });
      });

      const numUniformBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
      for (let ii = 0; ii < numUniformBlocks; ++ii) {
        const name = gl.getActiveUniformBlockName(program, ii);
        const uniformIndices = gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES);
        // because uniformIndices is a Uint32Array map will only convert to another Uint32Array
        const uniformInfos = Array.from(uniformIndices).map(ndx => uniformData[ndx]);
        const blockSpec = {
          index: gl.getUniformBlockIndex(program, name),
          usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
          usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
          size: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_DATA_SIZE),
          uniformInfos,
        };
        blockSpec.used = blockSpec.usedByVertexShader || blockSpec.usedByFragmentShader;
        blockSpecs[name] = blockSpec;
      }

      for (const [name, blockSpec] of Object.entries(blockSpecs)) {
        const {uniformInfos} = blockSpec;
        const tr = addElem('tr', tbody, {className: 'program-uniform-block'});
        const help = helpToMarkdown(`
          A uniform block is a collection of uniforms that get their values
          from a buffer. In the program's state you specify in index into the
          array of global Uniform Buffer Binding Points, telling the program which binding
          point to look at to find the buffer (and offset, size into the buffer)
          to find the values for the uniforms.

          set with

          ---
          // look up the index of the block in the program
          const someUniformBlockIndex = gl.getUniformBlockIndex(somePrg, '${name}');

          // set which of these binding points you'll specify the buffer and range
          // form which to set the uniforms
          const uniformBufferIndex = 3; // use the 3 indexed buffer
          gl.uniformBlockBinding(somePrg, someUniformBlockIndex, uniformBufferIndex)
          ---
        `);
        addElem('td', tr, {textContent: `UniformBlock: ${name}`, dataset: {help}});
        addElem('td', tr, {dataset: {help}});
        for (const {name, type, offset} of uniformInfos) {
          const help = helpToMarkdown(`
          Uniforms in a uniform block get their data from a buffer. 
          The format of a uniform block is well defined so you can know
          the offsets, types, and sizes of the values in the buffer **without**
          having to query query them.

          This particular uniform is of type: --${glEnumToString(gl, type)}--
          so you'd most likely use a TypedArray view of --${getUniformTypeInfo(type).Type.name}--
          and its data starts at byte offset: ${offset} from the position you
          specify with --gl.bindBufferRange-- or from the beginning of the buffer
          if you use --gl.bindBufferBase--.

          note: a value of --'-unknown-'-- means we can't know what value this is
          because it's not the current program or there is no buffer assign
          to the bind point

          a value of --'-OUT-OF-RANGE-'-- means there is an error condition, like for example
          the buffer is too small.

          `);
          const tr = addElem('tr', tbody);
          addElem('td', tr, {textContent: name, dataset: {help}});
          addElem('td', tr, {dataset: {help}});
        }
      }
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

export function createShaderDisplay(parent, name, shader) {
  const type = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.VERTEX_SHADER ? 'vertex' : 'fragment';

  const shElem = createTemplate(parent, `#${type}-shader-template`);
  setName(shElem, name);

  const sourceExpander = createExpander(shElem, 'source');
  const preElem = addElem('pre', sourceExpander);

  const updateSource = () => {
    preElem.innerHTML = '';
    const codeElem = addElem('code', preElem, {className: 'lang-glsl'});
    codeElem.textContent = gl.getShaderSource(shader);
    highlightBlock(codeElem);
    expand(sourceExpander);
  };

  const queryFn = state => {
    const {pname} = state;
    const value = gl.getShaderParameter(shader, gl[pname]);
    return value;
  };

  const stateTable = createStateTable(globals.stateTables.shaderState, shElem, 'state', queryFn);
  expand(stateTable);
  makeDraggable(shElem);

  return {
    elem: shElem,
    updateSource,
    updateState: () => {
      updateStateTable(globals.stateTables.shaderState, stateTable, queryFn);
    },
  };
}

export function createProgramDisplay(parent, name, program) {
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
  let tfVaryingsExpander;
  if (globals.isWebGL2) {
    tfVaryingsExpander = createExpander(prgElem, 'transform feedback varyings', {
      dataset: {
        hint: 'vertex shader output that can be written to buffers',
      },
    });
  }
  const uniformExpander = createExpander(prgElem, 'uniforms', {
    dataset: {
      hint: 'uniform values are user defined program state. The locations and values are different for each program.',
    },
  });


  const attribUI = createProgramAttributes(attribExpander, gl, program);
  let tfVaryingUI;
  if (tfVaryingsExpander) {
    tfVaryingUI = createProgramTransformFeedbackVaryings(tfVaryingsExpander, gl, program);
  }
  const uniformUI = createProgramUniforms(uniformExpander, gl, program);

  const queryFn = state => {
    const {pname} = state;
    const value = gl.getProgramParameter(program, gl[pname]);
    return value;
  };

  const stateTable = createStateTable(globals.stateTables.programState, prgElem, 'state', queryFn);
  expand(stateTable);

  makeDraggable(prgElem);

  return {
    elem: prgElem,
    updateAttachedShaders,
    updateState: () => {
      updateStateTable(globals.stateTables.programState, stateTable, queryFn);
    },
    scanAttributes: attribUI.scan,
    updateAttributes: attribUI.update,
    scanUniforms: uniformUI.scan,
    updateUniforms: uniformUI.update,
    scanTransformFeedbackVaryings: tfVaryingUI ? tfVaryingUI.scan : noop,
    updateTransformFeedbackVaryings: tfVaryingUI ? tfVaryingUI.update : noop,
  };
}
