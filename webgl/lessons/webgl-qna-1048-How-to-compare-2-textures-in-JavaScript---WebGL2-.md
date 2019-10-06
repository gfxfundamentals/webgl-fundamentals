Title: How to compare 2 textures in JavaScript / WebGL2?
Description:
TOC: qna

# Question:

I am writing a fragment shader for an image processing algorithm. The shader will run multiple times between two framebuffers in a loop (ping-pong). At some point I need to stop the loop when input and output textures are identical.

What I intend to do is the last step of Canny edge detector algorithm, "hysterezis edge tracking". I want to make a real time GPU/WebGL2 version of Canny algorithm and upload it to a web site.

This last step is as follows: 
Given a double thresholded image containing "strong" edge pixels (1.0) and "weak" edge pixels (0.5)

- find all chains of weak pixels connected with a strong pixel and mark them "strong"

- keep all "strong" pixels and discard all remaining "weak" ones.

This can be implemented in a fragment shader running multiple times in a loop. The current "weak" pixel is marked "strong" if there is at least one strong pixel in its 8-pixel neighbourhood. At every iteration, we should have more strong pixels and less weak pixels. At the end, only isolated chains of weak pixel should remain. This is the point where the fragment shader becomes a pass-through shader and should be detected to stop the loop.

# Answer

I'm not 100% sure what you're asking. You're asking to compare on the CPU. You can read the contents of a texture by attaching it to a framebuffer and then calling `gl.readPixels`. you can then compare all the pixels. Note: not all texture formats can be attached to a framebuffer but assuming you're using a format that can. You've already attached textures to framebuffers for your ping-ponging so what more did you want?

Like I wrote in the comment on the GPU you can write a shader to compare 2 textures

```
#version 300 es
precision highp float;

uniform sampler2D tex1;
uniform sampler2D tex2;

out vec4 outColor;

void main() {
  ivec2 size = textureSize(tex1, 0);  // size of mip 0
  float len = 0.0;
  for (int y = 0; y < size.y; ++y) {
    for (int x = 0; x < size.x; ++x) {
      vec4 color1 = texelFetch(tex1, ivec2(x, y), 0);
      vec4 color2 = texelFetch(tex2, ivec2(x, y), 0);
      vec4 diff = color1 - color2;
      len = length(diff);
      if (len > 0.0) break;
    }
    if (len > 0.0) break;
  }
  outColor = mix(vec4(0), vec4(1), step(len, 0.0));
}
```

now just draw 1 pixel and read it with readPixels. if it's 0 the textures are the same. If it's not they are different.

The code assumes the textures are the same size but of course if they aren't the same size then we already know they can't be the same.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // make 3 canvaes as sources for textures
    const canvases = ['A', 'B', 'B'].map((msg) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 128, 128);
      ctx.font = '80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'yellow';
      ctx.fillText(msg, 64, 64);
      document.body.appendChild(canvas);
      return canvas;
    });

    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) { alert('need webgl2'); }

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 1.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;

    const fs = `#version 300 es
    precision highp float;

    uniform sampler2D tex1;
    uniform sampler2D tex2;

    out vec4 outColor;

    void main() {
      ivec2 size = textureSize(tex1, 0);  // size of mip 0
      float len = 0.0;
      for (int y = 0; y < size.y; ++y) {
        for (int x = 0; x < size.x; ++x) {
          vec4 color1 = texelFetch(tex1, ivec2(x, y), 0);
          vec4 color2 = texelFetch(tex2, ivec2(x, y), 0);
          vec4 diff = color1 - color2;
          len = length(diff);
          if (len > 0.0) break;
        }
        if (len > 0.0) break;
      }
      outColor = mix(vec4(0), vec4(1), step(len, 0.0));
    }
    `;

    // compile shaders, link program, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const textures = canvases.map((canvas) => {
      // gl.createTexture, gl.bindTexture, gl.texImage, etc.
      return twgl.createTexture(gl, {src: canvas});
    });

    compareTextures(0, 1);
    compareTextures(1, 2);

    function compareTextures(ndx1, ndx2) {
      gl.useProgram(programInfo.program);
      
      // gl.activeTexture, gl.bindTexture, gl.uniform
      twgl.setUniforms(programInfo, {
        tex1: textures[ndx1],
        tex2: textures[ndx2],
      });
      
      // draw the bottom right pixel
      gl.viewport(0, 0, 1, 1);
      
      gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
      
      // read the pixel
      const result = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
      
      console.log('textures', ndx1, 'and', ndx2, 'are', result[0] ? 'the same' : 'not the same'); 
    }



<!-- language: lang-css -->

    canvas { padding: 5px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

You could also use occlusion queries. The plus is they might not block the GPU where as readPixels does. The minus is you can't check them in the same JavaScript event so they might not fit your needs

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // make 3 canvaes as sources for textures
    const canvases = ['A', 'B', 'B'].map((msg) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 128, 128);
      ctx.font = '80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'yellow';
      ctx.fillText(msg, 64, 64);
      document.body.appendChild(canvas);
      return canvas;
    });

    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) { alert('need webgl2'); }

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 1.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;

    const fs = `#version 300 es
    precision highp float;

    uniform sampler2D tex1;
    uniform sampler2D tex2;

    out vec4 outColor;

    void main() {
      ivec2 size = textureSize(tex1, 0);  // size of mip 0
      float len = 0.0;
      for (int y = 0; y < size.y; ++y) {
        for (int x = 0; x < size.x; ++x) {
          vec4 color1 = texelFetch(tex1, ivec2(x, y), 0);
          vec4 color2 = texelFetch(tex2, ivec2(x, y), 0);
          vec4 diff = color1 - color2;
          len = length(diff);
          if (len > 0.0) break;
        }
        if (len > 0.0) break;
      }
      if (len > 0.0) {
        discard;
      }
      outColor = vec4(1);
    }
    `;

    // compile shaders, link program, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const textures = canvases.map((canvas) => {
      // gl.createTexture, gl.bindTexture, gl.texImage, etc.
      return twgl.createTexture(gl, {src: canvas});
    });

    function wait(ms = 0) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    async function test() {
      await compareTextures(0, 1);
      await compareTextures(1, 2);
    }
    test();

    async function compareTextures(ndx1, ndx2) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(programInfo.program);
      
      // gl.activeTexture, gl.bindTexture, gl.uniform
      twgl.setUniforms(programInfo, {
        tex1: textures[ndx1],
        tex2: textures[ndx2],
      });
      
      // draw the bottom right pixel
      gl.viewport(0, 0, 1, 1);
      
      const query = gl.createQuery();
      gl.beginQuery(gl.ANY_SAMPLES_PASSED, query);
      gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
      gl.endQuery(gl.ANY_SAMPLES_PASSED);
      gl.flush();
      
      let ready = false;
      while(!ready) {
        await wait();
        ready = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
      }
      
      const same = gl.getQueryParameter(query, gl.QUERY_RESULT);
      
      console.log('textures', ndx1, 'and', ndx2, 'are', same ? 'the same' : 'not the same'); 
    }

<!-- language: lang-css -->

    canvas { padding: 5px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


