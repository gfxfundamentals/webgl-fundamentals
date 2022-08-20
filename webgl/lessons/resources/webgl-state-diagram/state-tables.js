
/* global gl */

//'use strict';

// TODO:
// * connect arrows
// * position things
// * texture mips
import * as twgl from '/3rdparty/twgl-full.module.js';
import {
  formatG,
  formatX2,
  formatBoolean,
  formatUniformValue,
  helpToMarkdown,
} from './utils.js';
import {
  formatWebGLObject,
  formatWebGLObjectOrCanvas,
  formatWebGLObjectOrDefaultVAO,
  formatWebGLObjectOrDefaultTFO,
} from './context-wrapper.js';

const glEnumToString = twgl.glEnumToString;
const formatEnum = v => glEnumToString(gl, v);
const formatEnumZero = v => v ? v === 1 ? 'ONE' : glEnumToString(gl, v) : 'ZERO';
const formatEnumNone = v => v ? glEnumToString(gl, v) : 'NONE';
const insertIf = (condition, ...elements) => condition ? elements : [];

const webglFuncs = `
--gl.NEVER--,
--gl.LESS--,
--gl.EQUAL--,
--gl.LEQUAL--,
--gl.GREATER--,
--gl.NOTEQUAL--,
--gl.GEQUAL--,
--gl.ALWAYS--
`;

export function getStateTables(isWebGL2) {
  const webglVersion = isWebGL2 ? 'webgl2' : 'webgl';

  const depthState = {
    help: `
    state that effects if and how the depth buffer is used.

    The depth buffer is first brought up in [this article](/webgl/lessons/\${langPathSegment}webgl-3d-orthographic.html).
    `,
    states: [
      {
        pname: 'DEPTH_TEST',
        setter: ['enable', 'disable'],
        formatter: formatUniformValue,
        help: `
          to enable

          ---js
          gl.enable(gl.DEPTH_TEST);
          ---

          to disable

          ---js
          gl.disable(gl.DEPTH_TEST);
          ---
        `,
      },
      {
        pname: 'DEPTH_FUNC',
        setter: 'depthFunc',
        formatter: formatEnum,
        help: `
          ---js
          gl.depthFunc(func);
          ---

          sets the function used for the depth test where func is one of
          ${webglFuncs}.
        `,
      },
      {
        pname: 'DEPTH_RANGE',
        setter: 'depthRange',
        formatter: formatUniformValue,
        help: `
          specifies how to convert from clip space to a depth value

          ---js
          gl.depthRange(zNear, zFar);
          ---
        `,
      },
      {
        pname: 'DEPTH_WRITEMASK',
        setter: 'depthMask',
        formatter: formatBoolean,
        help: `
          sets whether or not to write to the depth buffer

          ---js
          gl.depthMask(trueFalse);
          ---
        `,
      },
    ],
  };

  const vertexArrayState = {
    states: [
      {
        pname: 'ELEMENT_ARRAY_BUFFER_BINDING',
        formatter: formatWebGLObject,
        help: `
        buffer that contains element indices used when calling --gl.drawElements--.

        ---js
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, someBuffer);
        ---
        `,
      },
    ],
  };

  const stencilOps = helpToMarkdown(`--KEEP--, --ZERO--, --REPLACE--, --INCR--, --INCR_WRAP--, --DECR--, --DECR_WRAP--, --INVERT--`);
  const stencilFuncSnippet = face => helpToMarkdown(`
  ---js
  const func = gl.ALWAYS;
  const ref = 0x1;
  const mask = 0xFF;

  // set for both front and back facing triangles
  gl.stencilFunc(func, ref, mask);

  // set only for ${face} facing triangles
  const face = gl.${face.toUpperCase()};
  gl.stencilFuncSeparate(face, func, ref, mask);
  ---
  `);
  const stencilFuncSetters = ['stencilFunc', 'stencilFuncSeparate'];
  const stencilOpSnippet = face => helpToMarkdown(`
  ---js
  const stencilFailOp = gl.KEEP;
  const depthFailOp = gl.KEEP;
  const depthPassUp = gl.INCR;

  // sets for both front and back facing triangles
  gl.stencilOp(stencilFailOp, depthFailOp, depthPassUp); 

  // set only for ${face} facing triangles
  const face = gl.${face.toUpperCase()};
  gl.stencilOpSeparate(face, stencilFailOp, depthFailOp, depthPassUp);
  ---
  `);
  const stencilOpSetters = ['stencilOp', 'stencilOpSeparate'];
  const stencilWriteMaskSnippet = face => `
  write mask for stencil for ${face} facing triangles.

  ---js
  const mask = 0xFF;

  // set for both front and back facing triangles
  gl.stencilMask(mask);

  // set only for ${face} facing triangles.
  const face = gl.${face.toUpperCase()};
  gl.stencilMaskSeparate(face, mask);
  ---
  `;
  const stencilWriteMaskSetters = ['stencilMask', 'stencilMaskSeparate'];

  const stencilState = {
    help: `
    state that affects if and how the stencil buffer is used.

    note: If you want a stencil buffer on the canvas you need to request
    it with
    
    ---js
    gl = someCanvas.getContext('${webglVersion}, {stencil: true});
    ---
    `,
    states: [
      {
        pname: 'STENCIL_TEST',
        setter: ['enable', 'disable'],
        formatter: formatUniformValue,
        help: `
        Stencil test enabled/disabled

        ---js
        gl.enable(gl.STENCIL_TEST);
        gl.disable(gl.STENCIL_TEST);
        ---
        `,
      },
      {
        pname: 'STENCIL_FUNC',
        setter: stencilFuncSetters,
        formatter: formatEnum,
        help: `
        function to use for stencil test for front facing triangles.
        One of ${webglFuncs}.

  ${stencilFuncSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_FAIL',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when stencil test fails for front facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_PASS_DEPTH_FAIL',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when depth test fails for front facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_PASS_DEPTH_PASS',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when depth test passes for front facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_REF',
        setter: stencilFuncSetters,
        formatter: formatX2,
        help: `
        reference value to use for stencil test for front facing triangles.

  ${stencilFuncSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_VALUE_MASK',
        setter: stencilFuncSetters,
        formatter: formatX2,
        help: `
        mask value to use for stencil test for front facing triangles.

  ${stencilFuncSnippet('front')}
        `,
      },
      {
        pname: 'STENCIL_WRITEMASK',
        setter: stencilWriteMaskSetters,
        formatter: formatX2,
        help: stencilWriteMaskSnippet('front'),
      },
      {
        pname: 'STENCIL_BACK_FUNC',
        setter: stencilFuncSetters,
        formatter: formatEnum,
        help: `
        function to use for stencil test for back facing triangles.
        One of ${webglFuncs}.

  ${stencilFuncSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_FAIL',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when stencil test fails for back facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_PASS_DEPTH_FAIL',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when depth test fails for back facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_PASS_DEPTH_PASS',
        setter: stencilOpSetters,
        formatter: formatEnum,
        help: `
        operation when depth test passes for back facing triangles.
        One of: ${stencilOps}

  ${stencilOpSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_REF',
        setter: stencilFuncSetters,
        formatter: formatX2,
        help: `
        reference value to use for stencil test for back facing triangles.

  ${stencilFuncSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_VALUE_MASK',
        setter: stencilFuncSetters,
        formatter: formatX2,
        help: `
        mask value to use for stencil test for back facing triangles.

  ${stencilFuncSnippet('back')}
        `,
      },
      {
        pname: 'STENCIL_BACK_WRITEMASK',
        setter: stencilWriteMaskSetters,
        formatter: formatX2,
        help: stencilWriteMaskSnippet('front'),
      },
    ],
  };

  const blendFuncs = helpToMarkdown(`
  --ZERO--,
  --ONE--,
  --SRC_COLOR--,
  --ONE_MINUS_SRC_COLOR--,
  --DST_COLOR--,
  --ONE_MINUS_DST_COLOR--,
  --SRC_ALPHA--,
  --ONE_MINUS_SRC_ALPHA--,
  --DST_ALPHA--,
  --ONE_MINUS_DST_ALPHA--,
  --CONSTANT_COLOR--,
  --ONE_MINUS_CONSTANT_COLOR--,
  --CONSTANT_ALPHA--,
  --ONE_MINUS_CONSTANT_ALPHA--,
  --SRC_ALPHA_SATURATE--
  `);

  const blendFuncSnippet = `
  ---js
  // set both RGB and alpha to same value
  const srcRGBFunc = gl.ONE;
  const dstRGBFunc = gl.ONE_MINUS_SRC_ALPHA;
  gl.blendFunc(srcRGBFunc, dstRGBFunc);

  // set RGB and alpha to separate values
  const srcAlphaFunc = gl.ONE;
  const dstAlphaFunc = gl.ONE;
  gl.blendFuncSeparate(
      srcRGBFunc, dstRGBFunc, srcAlphaFunc, dstAlphaFunc);
  ---
  `;
  const blendFuncSetters = ['blendFunc', 'blendFuncSeparate'];
  const blendEquationSnippet = `
  One of --FUNC_ADD--, --FUNC_SUBTRACT--, --FUNC_REVERSE_SUBTRACT--

  ---js
  // set both RGB and ALPHA equations to the same value
  const rgbEquation = gl.FUNC_ADD;
  gl.blendEquation(rgbEquation);

  // set RGB and alpha equations to separate values
  const alphaEquation = gl.FUNC_SUBTRACT;
  gl.blendEquationSeparate(rgbEquation, alphaEquation);
  ---
  `;
  const blendEquationSetters = ['blendEquation', 'blendEquationSeparate'];

  const blendState = {
    help: `
    state that affects how the output of your fragment shader gets
    blended with the pixel being written to.

    The default is blending is disabled and the value output from your
    fragment shader replaces the pixel being written to.

    There are a few examples of blending in [this article](/webgl/lessons/\${langPathSegment}webgl-text-texture.html).
    `,
    states: [
      {
        pname: 'BLEND',
        setter: ['enable', 'disable'],
        formatter: formatBoolean,
        help: `
        blending enabled/disabled

        ---js
        gl.enable(gl.BLEND);
        gl.disable(gl.BLEND);
        ---
        `,
      },
      {
        pname: 'BLEND_DST_RGB',
        setter: blendFuncSetters,
        formatter: formatEnumZero,
        help: `
        The blend function for destination RGB.
        One of ${blendFuncs}.

  ${blendFuncSnippet}
        `,
      },
      {
        pname: 'BLEND_SRC_RGB',
        setter: blendFuncSetters,
        formatter: formatEnumZero,
        help: `
        The blend function for source RGB.
        One of ${blendFuncs}.

  ${blendFuncSnippet}
        `,
      },
      {
        pname: 'BLEND_DST_ALPHA',
        setter: blendFuncSetters,
        formatter: formatEnumZero,
        help: `
        The blend function for destination alpha
        One of ${blendFuncs}.

  ${blendFuncSnippet}
        `,
      },
      {
        pname: 'BLEND_SRC_ALPHA',
        setter: blendFuncSetters,
        formatter: formatEnumZero,
        help: `
        The blend function for source alpha
        One of ${blendFuncs}.

  ${blendFuncSnippet}
        `,
      },
      {
        pname: 'BLEND_COLOR',
        setter: 'blendColor',
        formatter: formatUniformValue,
        help: `
        constant color and alpha used when blend function
        is --gl.CONSTANT_COLOR--, --gl.CONSTANT_ALPHA--,
        --gl.ONE_MINUS_CONSTANT_COLOR--, or --gl.ONE_MINUS_CONSTANT_ALPHA--.

        ---js
        gl.blendColor(r, g, b, a);
        ---
        `,
      },
      {
        pname: 'BLEND_EQUATION_RGB',
        setter: blendEquationSetters,
        formatter: formatEnum,
        help: `
        Blend equation for RGB.

  ${blendEquationSnippet}
        `,
      },
      {
        pname: 'BLEND_EQUATION_ALPHA',
        setter: blendEquationSetters,
        formatter: formatEnum,
        help: `
        Blend equation for alpha  .

  ${blendEquationSnippet}
        `,
      },
    ],
  };

  const polygonState = {
    help: `
    state affecting culling of polygons based on how they are facing
    as well as adjusting their depth buffer calculations.

    Culling is brought up in [this article](/webgl/lessons/\${langPathSegment}webgl-3d-orthographic.html).
    `,
    states: [
      {
        pname: 'CULL_FACE',
        setter: ['enable', 'disable'],
        formatter: formatBoolean,
        help: `
        Whether or not to cull triangles based on which way they are facing.

        ---js
        // enable
        gl.enable(gl.CULL_FACE);

        // disable
        gl.disable(gl.CULL_FACE);
        ---
        `,
      },
      {
        pname: 'CULL_FACE_MODE',
        setter: 'cullFace',
        formatter: formatEnum,
        help: `
        Which faces are culled when culling is on. Valid values are
        --FRONT--, --BACK--, --FRONT_AND_BACK--. 

        ---js
        gl.cullFace(gl.FRONT);
        ---
        `,
      },
      {
        pname: 'FRONT_FACE',
        setter: 'frontFace',
        formatter: formatEnum,
        help: `
        Which faces are considered front facing. Valid values are
        --CW--, --CCW--. 

        ---js
        gl.frontFace(gl.CW);
        ---
        `,
      },
      {
        pname: 'POLYGON_OFFSET_UNITS',
        setter: 'polygonOffset',
        formatter: formatUniformValue,
        help: `
        The amount to offset the calculated depth value for the depth test.

        ---js
        const factor = 0;
        const units = 1;
        gl.polygonOffset(factor, units);
        ---
        `,
      },
      {
        pname: 'POLYGON_OFFSET_FACTOR',
        setter: 'polygonOffset',
        formatter: formatUniformValue,
        help: `
        The depth factor to offset the calculated depth value for the depth test.

        ---js
        const factor = 1;
        const units = 0;
        gl.polygonOffset(factor, units);
        ---
        `,
      },
    ],
  };

  const clearState = {
    help: `
    These states affect what happens when --gl.clear-- is called.
    Also see --gl.colorMask--, --gl.depthMask--, --gl.stencilMask--
    and the scissor.
    `,
    states: [
      {
        pname: 'COLOR_CLEAR_VALUE',
        setter: 'clearColor',
        formatter: formatUniformValue,
        help: `
        Value to clear the color buffer to when calling --gl.clear--
        with the --gl.COLOR_BUFFER_BIT-- set

        Be aware by default a canvas is composited with the webpage
        using premultiplied alpha.

        ---js
        const r = 1;
        const g = 0.5;
        const b = 0.3;
        const a = 1;
        gl.clearColor(r, g, b, a);
        ---
        `,
      },
      {
        pname: 'DEPTH_CLEAR_VALUE',
        setter: 'clearDepth',
        formatter: formatG,
        help: `
        the value to clear the depth buffer to when calling --gl.clear--
        with the --gl.DEPTH_BUFFER_BIT-- set

        ---js
        gl.clearDepth(value);
        ---
        `,
      },
      {
        pname: 'STENCIL_CLEAR_VALUE',
        setter: 'clearStencil',
        formatter: formatX2,
        help: `
        the value to clear the depth buffer to when calling --gl.clear--
        with the --gl.STENCIL_BUFFER_BIT-- set

        ---js
        gl.clearStencil(0xFF);
        ---
        `,
      },
    ],
  };

  const commonState = {
    states: [
      {
        pname: 'VIEWPORT',
        setter: 'viewport',
        formatter: formatUniformValue,
        help: `
        How to convert from clip space to pixel space.

        ---js
        const x = 0;
        const y = 0;
        const width = gl.canvas.width;
        const height = gl.canvas.height;
        gl.viewport(x, y, width, height);
        ---
        `,
      },
      {
        pname: 'ARRAY_BUFFER_BINDING',
        setter: [],
        formatter: formatWebGLObject,
        help: `
        The --ARRAY_BUFFER-- binding point is mostly
        just like an internal variable inside webgl. You set it by calling
        --gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);-- and then all other
        buffer functions can refer to the buffer bound there.
        `,
      },
      {
        pname: 'CURRENT_PROGRAM',
        setter: ['useProgram'],
        formatter: formatWebGLObject,
        help: `
        The current program. Used when calling --gl.drawArrays--, --gl.drawElements--
        and --gl.uniformXXX--.

        ---js
        gl.useProgram(someProgram);
        ---
        `,
      },
      {
        pname: 'VERTEX_ARRAY_BINDING',
        setter: ['bindVertexArray'],
        formatter: formatWebGLObjectOrDefaultVAO,
        help: `
        The current vertex array. 
        
        In WebGL 1.0 this is only settable via the 
        [--OES_vertex_array_object--](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/)
        extension. Otherwise there is only the 1 default vertex array in WebGL 1.0.

        In WebGL 2.0 set with
        
        ---js
        gl.bindVertexArray(someVertexArray);
        ---

        passing in --null-- binds the default vertex array.
        `,
      },
      {
        pname: 'RENDERBUFFER_BINDING',
        setter: ['bindRenderbuffer'],
        formatter: formatWebGLObject,
        help: `
        The current renderbuffer. 

        Set with

        ---js
        gl.bindRenderbuffer(gl.RENDERBUFFER, someRenderbuffer);
        ---
        `,
      },
      ...insertIf(!isWebGL2, {
          pname: 'FRAMEBUFFER_BINDING',
          setter: ['bindFramebuffer'],
          formatter: formatWebGLObjectOrCanvas,
          help: `
          The current framebuffer (--null-- = the canvas). 

          Set with

          ---js
          gl.bindFramebuffer(gl.FRAMEBUFFER, someFramebuffer);
          ---
          `,
        },
      ),
      ...insertIf(isWebGL2, {
          pname: 'DRAW_FRAMEBUFFER_BINDING',
          setter: ['bindFramebuffer'],
          formatter: formatWebGLObjectOrCanvas,
          help: `
          The current **draw** framebuffer (--null-- = the canvas).
          This is framebuffer pixels are written to when calling
          --gl.clear--, --gl.drawXXX--, --gl.blitFramebuffer--.

          Set with

          ---js
          gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, someFramebuffer);
          ---

          or with

          ---js
          gl.bindFramebuffer(gl.FRAMEBUFFER, someFramebuffer);
          ---
          `,
      }, {
          pname: 'READ_FRAMEBUFFER_BINDING',
          setter: ['bindFramebuffer'],
          formatter: formatWebGLObjectOrCanvas,
          help: `
          The current **read** framebuffer (--null-- = the canvas). 
          This is the framebuffer pixels are read from when calling
          --gl.readPixels--, --gl.copyTexImageXX--, --gl.copyTexSubImageXX--,
          --gl.blitFramebuffer--, ...

          Set with

          ---js
          gl.bindFramebuffer(gl.READ_FRAMEBUFFER, someFramebuffer);
          ---
          `,
      },
      ),
      {
        pname: 'ACTIVE_TEXTURE',
        setter: 'activeTexture',
        formatter: formatEnum,
        help: `
        The --ACTIVE_TEXTURE-- is just an index into the texture units array
        so that other function that take a target like --TEXTURE_2D-- or
        --TEXTURE_CUBE_MAP-- know which texture unit to look at. It is set
        with --gl.activeTexture(gl.TEXTURE0 + unit)--

        **Pseudo Code**

        ---js
        class WebGL {
          constructor() {
            this.activeTexture = 0;
            this.textureUnits = [
              { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, }, 
              { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, }, 
              ...
            ]
          }
          activeTexture(enum) {
            this.activeTexture = enum - gl.TEXTURE0;  // convert to index
          }
          texParameteri(target, pname, value) {
            const texture = this.textureUnits[this.activeTexture][target];
            ... set parameter on 'texture'...
          }
          ...
        ---
        `,
      },
    ],
  };

  const uniformBufferState = {
    states: [
      {
          pname: 'UNIFORM_BUFFER_BINDING',
          setter: ['bindBuffer'],
          formatter: formatWebGLObject,
          help: `
          This is a bind point for working with buffers that will
          be used for uniform blocks.

          Set with

          ---js
          gl.bindBuffer(gl.UNIFORM_BUFFER, someUniformBlockBuffer);
          ---
          `,
      },
    ],
  };


  const transformFeedbackState = {
    states: [
      {
          pname: 'TRANSFORM_FEEDBACK_BUFFER_BINDING',
          setter: ['bindBuffer'],
          formatter: formatWebGLObject,
          help: `
          This is a bind point for working with buffers that will
          be used for transform feedback.

          Set with

          ---js
          gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, someTransformFeedbackBuffer);
          ---
          `,
      }, {
          pname: 'TRANSFORM_FEEDBACK_BINDING',
          setter: ['bindTransformFeedback'],
          formatter: formatWebGLObjectOrDefaultTFO,
          help: `
          This is a bind point for working with a transform feedback

          Set with

          ---js
          gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, someTransformFeedback);
          ---
          `,
      },
    ],
  };

  const miscState = {
    states: [
      {
        pname: 'COLOR_WRITEMASK',
        setter: 'colorMask',
        formatter: formatUniformValue,
        help: `
        sets which channels can be written to. Set with

        ---js
        const red = true;
        const green = true;
        const blue = true;
        const alpha = true;
        gl.colorMask(red, green, blue, alpha);
        ---
        `,
      },
      {
        pname: 'SCISSOR_TEST',
        setter: ['enable', 'disable'],
        formatter: formatUniformValue,
        help: `
        Whether the scissor test is enabled

        ---js
        // enable
        gl.enable(gl.SCISSOR_TEST);

        // disable
        gl.disable(gl.SCISSOR_TEST);
        ---
        `,
      },
      {
        pname: 'SCISSOR_BOX',
        setter: 'scissor',
        formatter: formatUniformValue,
        help: `
        The dimensions of the scissor test. If the scissor test is enabled
        then WebGL will not rendered pixels outside the scissor box.

        ---js
        const x = 50;
        const y = 60;
        const width = 70;
        const height = 80;
        gl.scissor(x, y, width, height);
        ---
        `,
      },
      {
        pname: 'UNPACK_ALIGNMENT',
        setter: 'pixelStorei',
        formatter: formatUniformValue,
        help: `
        Used by --texImage-- functions. Each row of data
        must be aligned by this number of bytes and a multiple of this
        number of bytes. Valid values are --1--, --2--, --4--, and --8--.
        Default: --4--

        ---js
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        ---
        `,
      },
      {
        pname: 'PACK_ALIGNMENT',
        setter: 'pixelStorei',
        formatter: formatUniformValue,
        help: `
        Used by --readPixels-- function. Each row of data
        must be aligned by this number of bytes and a multiple of this
        number of bytes. Valid values are --1--, --2--, --4--, and --8--.
        Default: --4--

        ---js
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        ---
        `,
      },
    ],
  };

  const shaderState = {
    states: [
     {
        pname: 'COMPILE_STATUS',
        formatter: formatUniformValue,
        help: `
        Whether or not the last call to --gl.compileShader-- was successful.
        
        ---js
        const status = gl.getShaderParameter(someShader, gl.COMPILE_STATUS);
        ---
        `,
      },
    ],
  };

  const programState = {
    states: [
      {
        pname: 'LINK_STATUS',
        formatter: formatUniformValue,
        help: `
        Whether or not the last call to --gl.linkProgram-- was successful.

        ---js
        const status = gl.getProgramParameter(someShader, gl.LINK_STATUS);
        ---
        `,
      },
    ],
  };

  const activeTexNote = helpToMarkdown(`
    note: the texture affected is the current active texture on
    the specified bind point. ie (--webglState.textureUnits[activeTexture][bindPoint]--)
  `);

  const textureState = {
    states: [
      {
        pname: 'TEXTURE_MIN_FILTER',
        formatter: formatEnum,
        help: `
        How the texture is sampled when drawn smaller than its intrinsic size.
        Can be one of:
        --gl.NEAREST--,
        --gl.LINEAR--,
        --gl.NEAREST_MIPMAP_NEAREST--,
        --gl.LINEAR_MIPMAP_NEAREST--,
        --gl.NEAREST_MIPMAP_LINEAR--,
        --gl.LINEAR_MIPMAP_LINEAR--.
        **For non power of 2 textures must be --gl.NEAREST-- or --gl.LINEAR--**.

        ---js
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        ---

        ${activeTexNote}`,
      },
      {
        pname: 'TEXTURE_MAG_FILTER',
        formatter: formatEnum,
        help: `
        How the texture is sampled when drawn larger than its intrinsic size.
        Can be one of
        --gl.NEAREST--,
        --gl.LINEAR--.

        ---js
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ---

        ${activeTexNote}`,
      },
      {
        pname: 'TEXTURE_WRAP_S',
        formatter: formatEnum,
        help: `
        what happens for texture coordinates outside the 0 to 1 range
        in the S direction (horizontal). Can be one of --gl.REPEAT--,
        --gl.CLAMP_TO_EDGE--, --gl.MIRRORED_REPEAT--. **For non power
        of 2 textures must be --gl.CLAMP_TO_EDGE--**.

        ---js
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        ---

        ${activeTexNote}`,
      },
      {
        pname: 'TEXTURE_WRAP_T',
        formatter: formatEnum,
        help: `
        what happens for texture coordinates outside the 0 to 1 range
        in the S direction (vertical). Can be one of --gl.REPEAT--,
        --gl.CLAMP_TO_EDGE--, --gl.MIRRORED_REPEAT--. **For non power
        of 2 textures must be --gl.CLAMP_TO_EDGE--**.

        ---js
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        ---

        ${activeTexNote}`,
      },
      ...insertIf(isWebGL2,
        {
          pname: 'TEXTURE_WRAP_R',
          formatter: formatEnum,
          help: `
          what happens for texture coordinates outside the 0 to 1 range
          in the R direction (depth). Used on cube maps and 3D textures.
          Can be one of --gl.REPEAT--,
          --gl.CLAMP_TO_EDGE--, --gl.MIRRORED_REPEAT--. **For non power
          of 2 textures must be --gl.CLAMP_TO_EDGE--**.
  
          ---js
          gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.REPEAT);
          ---
  
          ${activeTexNote}`,
        },
        /*
        {
          pname: 'TEXTURE_MIN_LOD',
          formatter: formatUniformValue,
          help: `
          `,
        },
        {
          pname: 'TEXTURE_MAX_LOD',
          formatter: formatUniformValue,
          help: `
          `,
        },
        {
          pname: 'TEXTURE_BASE_LEVEL',
          formatter: formatUniformValue,
          help: `
          `,
        },
        {
          pname: 'TEXTURE_MAX_LEVEL',
          formatter: formatUniformValue,
          help: `
          `,
        },
        {
          pname: 'TEXTURE_COMPARE_MODE',
          formatter: formatEnumNone,
          help: `
          `,
        },
        {
          pname: 'TEXTURE_COMPARE_FUNC',
          formatter: formatEnum,
          help: `
          `,
        },
        */
      ),
    ],
  };

  const framebufferState = {
    help: `
    **NOTE: draw/read buffer state is *per* framebuffer state
    with the canvas having its own draw/read buffer state.**

    draw buffer state is set for whatever is bound as the 
    current --DRAW_FRAMEBUFFER-- by calling --gl.drawBuffers--.

    Examples

    ---js
    // bind the canvas as both the DRAW and READ framebuffers
    gl.framebuffer(gl.FRAMEBUFFER, null); 
    gl.drawBuffers([gl.BACK]);  // draw to the canvas (the default)
    ---

    ---js
    // bind some 4 attachment framebuffer as the DRAW framebuffer
    gl.framebuffer(gl.DRAW_FRAMEBUFFER, fourAttachmentFramebuffer); 
    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,  // write to 0
        gl.COLOR_ATTACHMENT1,  // write to 1
        gl.NONE,               // do not write to 2
        gl.COLOR_ATTACHMENT3,  // write to 3
    ]);
    ---

    read buffer state is set for whatever is bound as the
    current --READ_FRAMEBUFFER-- by calling --gl.readBuffer--.

    ---js
    // bind some 4 attachment framebuffer as the READ framebuffer
    gl.framebuffer(gl.READ_FRAMEBUFFER, fourAttachmentFramebuffer); 
    gl.readBuffer(gl.COLOR_ATTACHMENT3);  // read from the 3rd attachment
    ---
    `,
    states: [],
  };

  if (isWebGL2) {
    const maxDrawBuffers = gl.getParameter(gl.MAX_DRAW_BUFFERS);
    for (let i = 0; i < maxDrawBuffers; ++i) {
      framebufferState.states.push({
        pname: `DRAW_BUFFER${i}`,
        formatter: formatEnumNone,
        help: `
        Used for framebuffers with multiple color attachments. Sets whether
        writing to an attachment draws or not. Note that the i'th
        setting can only be --NONE-- or --COLOR_ATTACHMENT(i)-- where i
        matches the index of the attachment.

        ---js
        gl.framebuffer(gl.DRAW_FRAMEBUFFER, fourAttachmentFramebuffer); 
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,  // write to 0
            gl.COLOR_ATTACHMENT1,  // write to 1
            gl.NONE,               // do not write to 2
            gl.COLOR_ATTACHMENT3,  // write to 3
        ]);
        ---
        `,
      });
    }
    framebufferState.states.push({
      pname: `READ_BUFFER`,
      formatter: formatEnumNone,
      help: `
      Sets which attachment --readPixel-- reads from.
      ---js
      gl.framebuffer(gl.READ_FRAMEBUFFER, fourAttachmentFramebuffer); 
      gl.readBuffer(gl.COLOR_ATTACHMENT3),  // read from attachment 3
      ---
      `,
    });
  }

  return {
    shaderState,
    programState,
    textureState,
    framebufferState,
    vertexArrayState,
    activeTexNote,
    globalState: {
      depthState,
      blendState,
      stencilState,
      polygonState,
      clearState,
      commonState,
      miscState,
      transformFeedbackState,
      uniformBufferState,
    },
  };
}


