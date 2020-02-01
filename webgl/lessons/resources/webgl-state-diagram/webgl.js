import * as twgl from '/3rdparty/twgl-full.module.js';

export function isBadWebGL2(gl) {
  // check if it really supports WebGL2. Issues, Some browsers claim to support WebGL2
  // but in reality pass less than 20% of the conformance tests. Add a few simple
  // tests to fail so as not to mislead users.
  const params = [
      { pname: 'MAX_3D_TEXTURE_SIZE', min: 256, },
      { pname: 'MAX_DRAW_BUFFERS', min:4, },
      { pname: 'MAX_COLOR_ATTACHMENTS', min:4, },
      { pname: 'MAX_VERTEX_UNIFORM_BLOCKS', min:12, },
      { pname: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', min:16, },
      { pname: 'MAX_FRAGMENT_INPUT_COMPONENTS', min:60, },
      { pname: 'MAX_UNIFORM_BUFFER_BINDINGS', min:24, },
      { pname: 'MAX_COMBINED_UNIFORM_BLOCKS', min:24, },
  ];
  for (const {pname, min} of params) {
    const value = gl.getParameter(gl[pname]);
    if (typeof value !== 'number' || Number.isNaN(value) || value < min || gl.getError()) {
      return true;
    }
  }
  return false;
}

export function init(gl) {
  const vs = `
  attribute vec4 position;
  varying vec2 v_texcoord;
  void main() {
    gl_Position = position;
    v_texcoord = position.xy * 0.5 + 0.5;
  }`;
  const fs = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D tex;
  void main() {
    gl_FragColor = texture2D(tex, v_texcoord);
  }`;
  const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: {
      numComponents: 2,
      data: [
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ],
    },
  });
  const vaoInfo = twgl.createVertexArrayInfo(gl, programInfo, bufferInfo);
  const fbInfo = twgl.createFramebufferInfo(gl, [{format: gl.RGBA, minMag: gl.LINEAR}], 128, 128);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  function enableDisable(gl, pname, enable) {
    if (enable) {
      gl.enable(pname);
    } else {
      gl.disable(pname);
    }
  }

  return {
    renderTexture(texture) {

      // really need to save a lot more state
      const savedState = {
        blend: gl.getParameter(gl.BLEND),
        depthTest: gl.getParameter(gl.DEPTH_TEST),
        stencilTest: gl.getParameter(gl.STENCIL_TEST),
        scissorTest: gl.getParameter(gl.SCISSOR_TEST),
        cullFace: gl.getParameter(gl.CULL_FACE),
        framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
        program: gl.getParameter(gl.CURRENT_PROGRAM),
        texture: gl.getParameter(gl.TEXTURE_BINDING_2D),
        viewport: gl.getParameter(gl.VIEWPORT),
        activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
        vertexArray: gl.getParameter(gl.VERTEX_ARRAY_BINDING),
      };

      twgl.bindFramebufferInfo(gl, fbInfo);
      twgl.setBuffersAndAttributes(gl, programInfo, vaoInfo);
      gl.useProgram(programInfo.program);
      // we're assuming the texture is renderable
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.CULL_FACE);
      gl.uniform1i(programInfo.uniformSetters.tex.location, savedState.activeTexture - gl.TEXTURE0);
      twgl.drawBufferInfo(gl, vaoInfo);

      const data = new Uint8Array(fbInfo.width * fbInfo.height * 4);
      gl.readPixels(0, 0, fbInfo.width, fbInfo.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

      enableDisable(gl, gl.BLEND, savedState.blend);
      enableDisable(gl, gl.DEPTH_TEST, savedState.depthTest);
      enableDisable(gl, gl.SCISSOR_TEST, savedState.scissorTest);
      enableDisable(gl, gl.STENCIL_TEST, savedState.stencilTest);
      enableDisable(gl, gl.CULL_FACE, savedState.cullFace);
      gl.bindFramebuffer(gl.FRAMEBUFFER, savedState.framebuffer);
      gl.viewport(...savedState.viewport);
      gl.useProgram(savedState.program);
      gl.bindTexture(gl.TEXTURE_2D, savedState.texture);
      gl.bindVertexArray(savedState.vertexArray);

      return {
        width: fbInfo.width,
        height: fbInfo.height,
        data,
      };
    },
  };
}
