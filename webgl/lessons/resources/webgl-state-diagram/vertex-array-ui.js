
/* global gl */

import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  addElem,
  createTemplate,
  createTable,
  formatBoolean,
  formatUniformValue,
  getColorForWebGLObject,
  helpToMarkdown,
  setName,
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

const glEnumToString = twgl.glEnumToString;
const formatEnum = v => glEnumToString(gl, v);

const maxAttribs = 8;
export function createVertexArrayDisplay(parent, name /*, webglObject */) {
  const vaElem = createTemplate(parent, '#vertex-array-template');
  setName(vaElem, name);
  const vaoNote = globals.isWebGL2
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
  const attrsElem = createTable(attrExpander, globals.isWebGL2
    ? ['enabled', 'size', 'type', 'int', 'normalize', 'stride', 'offset', 'divisor', 'buffer']
    : ['enabled', 'size', 'type', 'normalize', 'stride', 'offset', 'divisor', 'buffer']);
  for (let i = 0; i < maxAttribs; ++i) {
    const tr = addElem('tr', attrsElem);

    addElem('td', tr, {
      dataset: {
        help: helpToMarkdown(`
        * --true-- this attribute uses data from a buffer.
        * --false-- it uses the corresponding global state attribute value.

        ---js
        const index = gl.getAttribLocation(program, 'someAttrib'); // ${i}
        gl.enableVertexAttribArray(index);   // turn on
        gl.disableVertexAttribArray(index);  // turn off
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
    if (globals.isWebGL2) {
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

        ${globals.isWebGL2 ? 'Not used for integer attributes like (int, uint, ivec3, uvec4, ...' : ''}

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
        help: globals.isWebGL2
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

  const formatters = globals.isWebGL2
      ? [
          formatBoolean,      // enable
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
      const data = globals.isWebGL2
          ? [
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
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
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_SIZE),
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_TYPE),
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
              gl.getVertexAttribOffset(i, gl.VERTEX_ATTRIB_ARRAY_POINTER),
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_DIVISOR),
              gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
            ];
      row.classList.toggle('attrib-enable', data[0]);
      const bufferNdx = globals.isWebGL2 ? 8 : 7;  // FIXME
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

  const stateTable = createStateTable(globals.stateTables.vertexArrayState, vaElem.querySelector('.state-table'), 'state', vaQueryFn);
  expand(stateTable);
  makeDraggable(vaElem);

  return {
    elem: vaElem,
    updateAttributes,
    updateState: () => {
      updateStateTable(globals.stateTables.vertexArrayState, stateTable, vaQueryFn);
    },
  };
}

