/* global gl */

import {
  addElem,
  createTable,
  formatUniformValue,
  getColorForWebGLObject,
  helpToMarkdown,
} from './utils.js';

import {
  formatWebGLObject,
  getWebGLObjectInfo,
} from './context-wrapper.js';

import {
  createExpander,
  expand,
  makeDraggable,
  updateElemAndFlashExpanderIfClosed,
} from './ui.js';

import {
  createStateGrid,
  createStateTable,
  updateStateTable,
} from './state-table.js';

import {
  globals,
} from './globals.js';

import {arrowManager} from './arrows.js';

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

  > Note: Only 8 texture units are shown here for space reasons but 
  the actual number of bind points you can look up with
  --gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)--
  which will be a minimum of ${globals.isWebGL2 ? 32 : 8}.
  `);

  const targets = globals.isWebGL2
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

  const targetBindings = globals.isWebGL2
      ? [gl.TEXTURE_BINDING_2D, gl.TEXTURE_BINDING_CUBE_MAP, gl.TEXTURE_BINDING_3D, gl.TEXTURE_BINDING_2D_ARRAY, gl.SAMPLER_BINDING]
      : [gl.TEXTURE_BINDING_2D, gl.TEXTURE_BINDING_CUBE_MAP];

  const updateTextureUnit = unit => {
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
                getColorForWebGLObject(texture, targetInfo.ui.elem, unit / maxUnits),
                {offset: { start: {x: 0, y: colNdx * 2 - 4}}});
          }
        }
      }
    });
  };

  const updateCurrentTextureUnit = () => {
    const unit = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
    updateTextureUnit(unit);
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
    updateTextureUnitSampler: updateTextureUnit,
  };
}

function createAttribValues(parent, maxAttribs = 8) {
  const expander = createExpander(parent, 'Attribute Values', {}, `
  Each attribute has a value that is used if it is NOT
  enabled via --gl.enableVertexAttribArray--. 

  For example you have a shader with position and color attributes

  ---glsl
  attribute vec4 position;
  attribute vec4 color;
  ---

  To draw a shape where every vertex gets a different color you'd setup
  the color attribute with a buffer 

  ---js
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferWithColorData);
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);  // use the data from the buffer
  ---

  To draw a shape where every vertex gets the same color you can
  disable the attribute and set its value

  ---js
  gl.disableVertexAttribArray(colorLoc);
  gl.vertexAttrib4fv(colorLoc, colorForAllVertices);
  ---

  > Note: Only 8 attribute values are shown here for space reasons but 
  the actual number of attribute available you can look up with
  --gl.getParameter(gl.MAX_VERTEX_ATTRIBS)--
  which will be a minimum of ${globals.isWebGL2 ? 16 : 8}.

  > Note: It's arguably
  confusing that this value is not part of a vertex array
  since the flag to use it or not is in the vertex array.

  `);

  const tbody = createTable(expander, ['value']);
  tbody.parentElement.classList.add('attrib-values');
  const arrows = [];

  for (let i = 0; i < maxAttribs; ++i) {
    arrows.push({});
    const tr = addElem('tr', tbody);
    addElem('td', tr, {
      className: 'used-when-disabled',
      textContent: '0, 0, 0, 1',
      dataset: {
        help: helpToMarkdown(`
          value for this attribute when disabled (the default)

          ---js
          const loc = gl.getAttribLocation(program, 'someAttrib'); // ${i};
          gl.disableVertexAttribArray(loc);       // disable if it's not already disabled
          gl.vertexAttrib4fv(loc, [1, 2, 3, 4]);  // set the value
          ---

          note that the enabled/disabled state is part of
          the current vertex array but the values when disabled
          are global state.
        `),
      },
    });
  }

  const updateAttribValue = loc => {
    const row = tbody.rows[loc];
    const cell = row.cells[0];
    const enabled = gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
    row.classList.toggle('attrib-enable', enabled);

    const value = gl.getVertexAttrib(loc, gl.CURRENT_VERTEX_ATTRIB);
    if (updateElemAndFlashExpanderIfClosed(cell, formatUniformValue(value))) {
      /*
        Note: This code is copied and pasted from the texture unit code above
        so it would have to be adapted but, None of the examples use these
        values, even for a moment, I haven't bothered to make the arrows work.

        To work, arrows from the current program to an attribute need to change
        so if enabled they connect as they do now but if disable they connect
        to these values.

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
                getColorForWebGLObject(texture, targetInfo.ui.elem, unit / maxUnits),
                {offset: { start: {x: 0, y: colNdx * 2 - 4}}});
          }
        }
      */
    }
  };

  const updateAttribValues = () => {
    for (let i = 0; i < maxAttribs; ++i) {
      updateAttribValue(i);
    }
  };

  return {
    elem: expander,
    updateAttribValue,
    updateAttribValues,
  };
}

function createUniformBufferBindings(parent, maxUnits = 8) {
  const expander = createExpander(parent, 'Uniform Buffer Bindings', {}, `
  In each program you tell each uniform block which index to find
  the buffer to get it's values here.

  Example:

  at init time

  ---
  // look up the index of the block in the program
  const someUniformBlockIndex = gl.getUniformBlockIndex(somePrg, 'nameOfUniformBlock');

  // set which of these binding points you'll specify the buffer and range
  // form which to set the uniforms
  const uniformBufferIndex = 3; // use the 3 indexed buffer
  gl.uniformBlockBinding(somePrg, someUniformBlockIndex, uniformBufferIndex)
  ---

  at render time

  ---
  gl.useProgram(somePrg);

  gl.bindBufferBase(gl.UNIFORM_BUFFER,
                    uniformBufferIndex,
                    bufferWithUniformData);
  //or
  gl.bindBufferRange(gl.UNIFORM_BUFFER,
                     uniformBufferIndex,
                     bufferWithUniformData,
                     offsetInBytes,
                     sizeInBytes);
  ---

  You need to put the data for the uniforms in the buffer with
  --gl.bufferData-- or --gl.bufferSubData--.

  > Note: Only 8 bind points are shown here for space reasons but 
  the actual number of bind points you can look up with
  --gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS)--
  which will be a minimum of 24.
  `);

  const tbody = createTable(expander, ['offset', 'size', 'buffer'], '');
  const arrows = [];

  for (let i = 0; i < maxUnits; ++i) {
    arrows.push({});
    const tr = addElem('tr', tbody);
    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
          offset in buffer for this uniform block.
          Set to 0 with --gl.bindBufferBase-- or whatever
          you specify with --gl.bindBufferRange--.
        `),
      },
    });
    addElem('td', tr, {
      textContent: '0',
      dataset: {
        help: helpToMarkdown(`
          size of area to use in buffer for this uniform block.
          Set to entire buffer with --gl.bindBufferBase-- or whatever
          you specify with --gl.bindBufferRange--.
        `),
      },
    });
    addElem('td', tr, {
      textContent: 'null',
      dataset: {
        help: helpToMarkdown(`
          buffer set with either --gl.bindBufferBase-- or
          --gl.bindBufferRange--.
        `),
      },
    });
  }

  const {globalState} = globals.stateTables;
  const stateTableElem = createStateGrid(globalState.uniformBufferState, expander, globalStateQuery, true);

  const updateUniformBufferBinding = index => {
    const row = tbody.rows[index];

    const offset = gl.getIndexedParameter(gl.UNIFORM_BUFFER_START, index);
    const bufSectionSize = gl.getIndexedParameter(gl.UNIFORM_BUFFER_SIZE, index);
    const buffer = gl.getIndexedParameter(gl.UNIFORM_BUFFER_BINDING, index);

    updateElemAndFlashExpanderIfClosed(row.cells[0], offset);
    updateElemAndFlashExpanderIfClosed(row.cells[1], bufSectionSize);
    const cell = row.cells[2];
    if (updateElemAndFlashExpanderIfClosed(cell, formatWebGLObject(buffer))) {
      const oldArrow = arrows[index];
      if (oldArrow) {
        arrowManager.remove(oldArrow);
        arrows[index] = null;
      }
      if (buffer) {
        const targetInfo = getWebGLObjectInfo(buffer);
        if (!targetInfo.deleted) {
          arrows[index] = arrowManager.add(
              cell,
              targetInfo.ui.elem.querySelector('.name'),
              getColorForWebGLObject(buffer, targetInfo.ui.elem, index / maxUnits),
              {offset: { start: {x: 0, y: 2 * 2 - 4}}});
        }
      }
    }
  };

  return {
    elem: expander,
    updateUniformBufferBinding,
    updateState: () => {
      updateStateTable(globalState.uniformBufferState, stateTableElem, globalStateQuery);
    },
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

export function createGlobalUI(globalStateElem) {
  const settersToWrap = {};

  function createStateUI(stateTable, parent, name, queryFn) {
    const elem = createStateTable(stateTable, parent, name, queryFn);
    const updateState = () => {
      updateStateTable(stateTable, elem, queryFn);
    };

    for (const state of stateTable.states) {
      if (!state.setter) {
        continue;
      }
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

  const {globalState} = globals.stateTables;
  const globalUI = {
    commonState: createStateUI(globalState.commonState, globalStateElem, 'common state', globalStateQuery),
    textureUnits: createTextureUnits(globalStateElem, 8),
    clearState: createStateUI(globalState.clearState, globalStateElem, 'clear state', globalStateQuery),
    attribValueState: createAttribValues(globalStateElem, 8),
    ...globals.isWebGL2 && {
      transformFeedbackState: createStateUI(globalState.transformFeedbackState, globalStateElem, 'transform feedback', globalStateQuery),
      uniformBufferBindingsState: createUniformBufferBindings(globalStateElem, Math.min(8, gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS))),
    },
    depthState: createStateUI(globalState.depthState, globalStateElem, 'depth state', globalStateQuery),
    blendState: createStateUI(globalState.blendState, globalStateElem, 'blend state', globalStateQuery),
    miscState: createStateUI(globalState.miscState, globalStateElem, 'misc state', globalStateQuery),
    stencilState: createStateUI(globalState.stencilState, globalStateElem, 'stencil state', globalStateQuery),
    polygonState: createStateUI(globalState.polygonState, globalStateElem, 'polygon state', globalStateQuery),
    ...globals.isWebGL2 && {
      framebufferState: createStateUI(globals.stateTables.framebufferState, globalStateElem, 'read/draw buffers', globalStateQuery),
    },
    settersToWrap,
  };
  expand(globalUI.textureUnits.elem);
  expand(globalUI.commonState.elem);
  expand(globalUI.clearState.elem);
  expand(globalUI.depthState.elem);

  makeDraggable(globalStateElem);

  return globalUI;
}