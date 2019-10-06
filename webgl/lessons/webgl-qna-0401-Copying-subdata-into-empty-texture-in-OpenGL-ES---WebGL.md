Title: Copying subdata into empty texture in OpenGL ES / WebGL
Description:
TOC: qna

# Question:

I have created a texture this way:

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
 gl.texParameteri(...
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

Then I try to copy subdata from current framebuffer into it:

    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, ox, oy, sx, sy, w, h);

It does not copy anything for the first time. Texture is still empty (contains zeros).

It works, when I call copyTexSubImage2D for the second time. It also works for the first time, if the size of subarea corresponds to the size of the texture.

I want to avoid sending real data at the beginning (takes too long) and copying larger areas than I need also takes too long.

Is it expected behavior, or it is a bug in Chromes WebGL? Is there any other solution?

# Answer

Let's test

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    var greenProgramInfo = twgl.createProgramInfo(gl, ["vs", "green-fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // make a texture for a framebuffer
    var fbtex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fbtex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // create a framebuffer and attach the texture
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbtex, 0);

    // clear texture to green
    //gl.clearColor(0, 1, 0, 1);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    // Just to make sure let's render green instead of clear to green. (both work for me though)
    gl.useProgram(greenProgramInfo.program);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

    // now make a texture
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // copy part of the fbtexture to it
    // target, level, xoffset, yoffset, x, y, width, height
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 10, 20, 30, 40, 50, 60);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // now clear to red
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now render with the texture
    gl.useProgram(programInfo.program);
    var uniforms = {
      u_texture: tex,
    };
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="//twgljs.org/dist/twgl-full.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = position.xy * 0.5 + 0.5;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    uniform sampler2D u_texture;
    varying vec2 v_texcoord;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    </script>
    <script id="green-fs" type="notjs">
    precision mediump float;

    varying vec2 v_texcoord;

    void main() {
      gl_FragColor = vec4(0,1,0,1);
    }
    </script>
    <div>If this works there should be a white (transparent) canvas with a green rectangle inside.</div>
    <canvas id="c"></canvas>

<!-- end snippet -->

Seems to work for me. Is it not working for you?
