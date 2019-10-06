Title: How to stretch a WebGL canvas without blurring? The style "image-rendering" doesn't work
Description:
TOC: qna

# Question:

I've created a canvas with `width=16` and `height=16`. Then I used WebGL to render an image to it. This is what it looks like:

[![enter image description here][1]][1]

Afterwards, I scaled the canvas by using `width: 256px` and  `height: 256px`. I also set `image-rendering` to `pixelated`:

```
      canvas {
        image-rendering: optimizeSpeed;             /* STOP SMOOTHING, GIVE ME SPEED  */
        image-rendering: -moz-crisp-edges;          /* Firefox                        */
        image-rendering: -o-crisp-edges;            /* Opera                          */
        image-rendering: -webkit-optimize-contrast; /* Chrome (and eventually Safari) */
        image-rendering: pixelated; /* Chrome */
        image-rendering: optimize-contrast;         /* CSS3 Proposed                  */
        -ms-interpolation-mode: nearest-neighbor;   /* IE8+                           */
        width: 256px;
        height: 256px;
      }
```

This is the result:

[![enter image description here][2]][2]

The image is blurred. Why? I'm using Safari 12.0.2 on OSX Mojave.

  [1]: https://i.stack.imgur.com/QNSJl.png
  [2]: https://i.stack.imgur.com/xSVay.png

# Answer

Safari does not yet support `image-rendering: pixelated;` on WebGL. [Filed a bug](https://bugs.webkit.org/show_bug.cgi?id=193895)

Also  `crisp-edges` does not != `pixelated`. `crisp-edges` could be any number of algorithms. It does not mean `pixelated`. It means *apply some algorithm that keeps crisp edges* of which there are tons of algorithms.

[The spec itself](https://drafts.csswg.org/css-images-3/#example-448b3881) shows examples: 

Given this image:

[![enter image description here][1]][1]

This is `pixelated`:

[![enter image description here][2]][2]

Where as a browser is allowed to use a variety of algorithms for `crisp-edges` so for example the result could be

[![enter image description here][3]][3]

So in other words your CSS may not produce the results you expect. If a browser doesn't support pixelated but does support crisp-edges and if they use an algorithm like above then you won't a pixelated look.

The most performant way to draw pixelated graphics without `image-rendering: pixelated` is to draw to a small texture and then draw that texture to the canvas with `NEAREST` filtering.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;

    const screenVS = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      // because we know position goes from -1 to 1
      v_texcoord = position.xy * 0.5 + 0.5;
    }
    `;
    const screenFS = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, v_texcoord);
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl', {antialias: false});

    // compile shaders, link programs, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const screenProgramInfo = twgl.createProgramInfo(gl, [screenVS, screenFS]);


    const width = 16;
    const height = 16;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // create buffers and put data in
    const quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
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
      }
    });


    render();

    function render() {
      // draw at 16x16 to texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, width, height);
      gl.useProgram(programInfo.program);
      // bind buffers and set attributes
      twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);
      
      gl.drawArrays(gl.TRIANGLES, 0, 3);  // only draw the first triangle
      
      // draw texture to canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(screenProgramInfo.program);
      // bind buffers and set attributes
      twgl.setBuffersAndAttributes(gl, screenProgramInfo, quadBufferInfo);
      // uniforms default to 0 so in this simple case
      // no need to bind texture or set uniforms since
      // we only have 1 texture, it's on texture unit 0
      // and the uniform defaults to 0
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


<!-- language: lang-html -->

    <canvas width="256" height="256"></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

Note: if you're rendering 3D or for some other reason need a depth buffer you'll need to add a depth renderbuffer attachment to the framebuffer.

Note that `optimizeSpeed` is not a real option either. It's been long deprecated and like `crisp-edges` is up to the browser to interpret.


  [1]: https://i.stack.imgur.com/YvOgP.png
  [2]: https://i.stack.imgur.com/6Nd82.png
  [3]: https://i.stack.imgur.com/DVB5h.png
