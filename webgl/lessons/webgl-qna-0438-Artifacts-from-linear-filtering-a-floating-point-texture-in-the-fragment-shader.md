Title: Artifacts from linear filtering a floating point texture in the fragment shader
Description:
TOC: qna

# Question:

I'm using the following code taken from [this tutorial](http://www.codeproject.com/Articles/236394/Bi-Cubic-and-Bi-Linear-Interpolation-with-GLSL) to perform linear filtering on a floating point texture in my fragment shader in WebGL:

    float fHeight = 512.0;
    float fWidth = 1024.0;
    float texelSizeX = 1.0/fWidth;
    float texelSizeY = 1.0/fHeight;

    float tex2DBiLinear( sampler2D textureSampler_i, vec2 texCoord_i )
    {
        float p0q0 = texture2D(textureSampler_i, texCoord_i)[0];
        float p1q0 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX, 0))[0];

        float p0q1 = texture2D(textureSampler_i, texCoord_i + vec2(0, texelSizeY))[0];
        float p1q1 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX , texelSizeY))[0];

        float a = fract( texCoord_i.x * fWidth ); // Get Interpolation factor for X direction.
                        // Fraction near to valid data.

        float pInterp_q0 = mix( p0q0, p1q0, a ); // Interpolates top row in X direction.
        float pInterp_q1 = mix( p0q1, p1q1, a ); // Interpolates bottom row in X direction.

        float b = fract( texCoord_i.y * fHeight );// Get Interpolation factor for Y direction.
        return mix( pInterp_q0, pInterp_q1, b ); // Interpolate in Y direction.
    }

On an Nvidia GPU this looks fine, but on two other computers with an Intel integrated GPU it looks like this:

[![enter image description here][1]][1]

[![enter image description here][2]][2]

[![enter image description here][3]][3]

[![enter image description here][4]][4]

There are lighter or darker lines appearing that shouldn't be there. They become visible if you zoom in, and tend to get more frequent the more you zoom. When zooming in very closely, they appear at the edge of every texel of the texture I'm filtering. I tried changing the precision statement in the fragment shader, but this didn't fix it.

The built-in linear filtering works on both GPUs, but I still need the manual filtering as a fallback for GPUs that don't support linear filtering on floating point textures with WebGL.

The Intel GPUs are from a desktop Core i5-4460 and a notebook with an Intel HD 5500 GPU. For all precisions of floating point values I get a rangeMin and rangeMax of 127 and a precision of 23 from `getShaderPrecisionFormat`.

Any idea on what causes these artifacts and how I can work around it? 

**Edit:**

By experimenting a bit more I found that reducing the texel size variable in the fragment shader removes these artifacts:

    float texelSizeX = 1.0/fWidth*0.998;
    float texelSizeY = 1.0/fHeight*0.998;

Multiplying by 0.999 isn't enough, but multiplying the texel size by 0.998 removes the artifacts. 

This is obviously not a satisfying fix, I still don't know what causes it and I probably caused artifacts on other GPUs or drivers now. So I'm still interested in figuring out what the actual issue is here.

  [1]: http://i.stack.imgur.com/Dxcet.png
  [2]: http://i.stack.imgur.com/faMpz.png
  [3]: http://i.stack.imgur.com/0aDgc.png
  [4]: http://i.stack.imgur.com/UUJr2.png

# Answer

It's not clear to me what the code is trying to do. It's not reproducing the GPU's bilinear because that would be using pixels centered around the texcoord.

In other words, as implemented

    vec4 c = tex2DBiLinear(someSampler, someTexcoord);

is **NOT** equivilent to `LINEAR`

    vec4 c = texture2D(someSampler, someTexcoord);

`texture2D` looks at pixels `someTexcoord +/- texelSize * .5` where as `tex2DBiLinear` is looking at pixels `someTexcoord` and `someTexcoord + texelSize`

You haven't given enough code to repo your issue. I'm guessing the size of the source texture is 512x1024 but since you didn't post that code I have no idea if your source texture matches the defined size. You also didn't post what size your target is. The top image you posted is 471x488. Was that your target size? You also didn't post your code for what texture coordinates you're using and the code that manipulates them.

Guessing that your source is 512x1024, your target is 471x488 I can't repo your issue.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const fs = `
    precision highp float;

    uniform sampler2D tex;
    varying vec2 v_texcoord;

    float tex2DBiLinear( sampler2D textureSampler_i, vec2 texCoord_i )
    {
    float fHeight = 1024.0;
    float fWidth = 512.0;
    float texelSizeX = 1.0/fWidth;
    float texelSizeY = 1.0/fHeight;

        float p0q0 = texture2D(textureSampler_i, texCoord_i)[0];
        float p1q0 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX, 0))[0];

        float p0q1 = texture2D(textureSampler_i, texCoord_i + vec2(0, texelSizeY))[0];
        float p1q1 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX , texelSizeY))[0];

        float a = fract( texCoord_i.x * fWidth ); // Get Interpolation factor for X direction.
                        // Fraction near to valid data.

        float pInterp_q0 = mix( p0q0, p1q0, a ); // Interpolates top row in X direction.
        float pInterp_q1 = mix( p0q1, p1q1, a ); // Interpolates bottom row in X direction.

        float b = fract( texCoord_i.y * fHeight );// Get Interpolation factor for Y direction.
        return mix( pInterp_q0, pInterp_q1, b ); // Interpolate in Y direction.
    }

    void main() {
      gl_FragColor = vec4(tex2DBiLinear(tex, v_texcoord), 0, 0, 1);
    }
    `;

    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = texcoord;
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl');
    // compile shaders, link programs, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          -1, -1,
           1, -1,
          -1,  1,
           1,  1,
        ],
      },
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ],
      indices: [
        0, 1, 2,
        2, 1, 3,
      ],
    });


    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 512;
    ctx.canvas.height = 1024;
    const gradient = ctx.createRadialGradient(256, 512, 0, 256, 512, 700);

    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, 'cyan');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 1024);

    const tex = twgl.createTexture(gl, {
      src: ctx.canvas,
      minMag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
      auto: false,
    });

    gl.useProgram(programInfo.program);
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas width="471" height="488"></canvas>

<!-- end snippet -->

If you think the issue is related to floating point textures I can't repo there either

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const fs = `
    precision highp float;

    uniform sampler2D tex;
    varying vec2 v_texcoord;

    float tex2DBiLinear( sampler2D textureSampler_i, vec2 texCoord_i )
    {
    float fHeight = 1024.0;
    float fWidth = 512.0;
    float texelSizeX = 1.0/fWidth;
    float texelSizeY = 1.0/fHeight;

        float p0q0 = texture2D(textureSampler_i, texCoord_i)[0];
        float p1q0 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX, 0))[0];

        float p0q1 = texture2D(textureSampler_i, texCoord_i + vec2(0, texelSizeY))[0];
        float p1q1 = texture2D(textureSampler_i, texCoord_i + vec2(texelSizeX , texelSizeY))[0];

        float a = fract( texCoord_i.x * fWidth ); // Get Interpolation factor for X direction.
                        // Fraction near to valid data.

        float pInterp_q0 = mix( p0q0, p1q0, a ); // Interpolates top row in X direction.
        float pInterp_q1 = mix( p0q1, p1q1, a ); // Interpolates bottom row in X direction.

        float b = fract( texCoord_i.y * fHeight );// Get Interpolation factor for Y direction.
        return mix( pInterp_q0, pInterp_q1, b ); // Interpolate in Y direction.
    }

    void main() {
      gl_FragColor = vec4(tex2DBiLinear(tex, v_texcoord), 0, 0, 1);
    }
    `;

    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = texcoord;
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl');
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) { alert('need OES_texture_float'); }
    // compile shaders, link programs, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          -1, -1,
           1, -1,
          -1,  1,
           1,  1,
        ],
      },
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ],
      indices: [
        0, 1, 2,
        2, 1, 3,
      ],
    });


    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 512;
    ctx.canvas.height = 1024;
    const gradient = ctx.createRadialGradient(256, 512, 0, 256, 512, 700);

    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, 'cyan');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 1024);

    const tex = twgl.createTexture(gl, {
      src: ctx.canvas,
      type: gl.FLOAT,
      minMag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
      auto: false,
    });

    gl.useProgram(programInfo.program);
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    if (e) {
      console.log(gl.getParameter(e.UNMASKED_VENDOR_WEBGL));
      console.log(gl.getParameter(e.UNMASKED_RENDERER_WEBGL));
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas width="471" height="488"></canvas>

<!-- end snippet -->

If any of the values are off. If your source texture size doesn't match `fWidth` and `fHeigth` or if your texture coordinates are different or adjusted in some way then of course maybe I could repo. If any of those are different then I can imagine issues.

Tested in Intel Iris Pro and Intel HD Graphics 630. Also tested on an iPhone6+. Note that you need to make sure your fragment shader is running in `precision highp float` but that setting would likely only affect mobile GPUs.
