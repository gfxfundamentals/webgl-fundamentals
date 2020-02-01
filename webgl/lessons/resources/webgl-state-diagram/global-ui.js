/* global gl */

import {
  addElem,
  createTable,
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
    depthState: createStateUI(globalState.depthState, globalStateElem, 'depth state', globalStateQuery),
    blendState: createStateUI(globalState.blendState, globalStateElem, 'blend state', globalStateQuery),
    miscState: createStateUI(globalState.miscState, globalStateElem, 'misc state', globalStateQuery),
    stencilState: createStateUI(globalState.stencilState, globalStateElem, 'stencil state', globalStateQuery),
    polygonState: createStateUI(globalState.polygonState, globalStateElem, 'polygon state', globalStateQuery),
    ...globals.isWebGL2 && {
      drawBuffersState: createStateUI(globals.stateTables.drawBuffersState, globalStateElem, 'draw buffers', globalStateQuery),
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