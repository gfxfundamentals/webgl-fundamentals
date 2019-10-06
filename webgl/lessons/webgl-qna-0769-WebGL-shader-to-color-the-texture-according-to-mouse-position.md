Title: WebGL shader to color the texture according to mouse position
Description:
TOC: qna

# Question:

I am trying to make an interesting effect using WebGL.
In my fragment shader I have the following line which draws my texture in black and white:

    gl_FragColor = vec4(vec3(color0.r+color0.g+color0.b)/3.0, color0.a);

Where `color0` is the color of the texture.
In the shader I also have a `uniform vec2 u_mouse` which is passed in from my javascript code as the mouse coordinates on the screen.
Now what I want is to be able to move the mouse, and part of the image would colorize inside the given radius like in the picture:

[![Picture of effect][1]][1]


  [1]: https://i.stack.imgur.com/S0Ojk.jpg

My idea is to have a mask, which has a white circle on it, which will move with the mouse, but I have no idea how to do the image processing afterwards...
I also would like for the animation no be smooth, like an interpolation between the mouse values.

Thanks!

# Answer

You want to mix the black and white version with the color version

    vec4 bw = vec4(vec3(color0.r + color0.g + color0.b) / 3., color.a);
    gl_FragColor = mix(bw, color0, mixAmount);

Where `mix` is defined as

    mix(a, b, l) = a + (b - a) * l

In other words, if `mixAmount` is 0 you'll get `bw` and if `mixAmount` is 1 you'll get `color0`. For values in between 0 and 1 you'll get a mix of the 2.

So now you just need some formula for `setting mixAmount`

As one example, assuming you pass in the mouse in canvas relative coordinates you could compute the distance from that coordinate

    uniform vec2 mousePos;  // in pixels where 0,0 is bottom left

    ...

      float dist = distance(mousePos, gl_FragCoord.xy);

You could then use that to compute a `mixAmount` for example

    uniform float mixRadius;

      float mixAmount = clamp(dist / mixRadius, 0., 1.);

And you'll get a fading circle with color in the center fading to black and white at the edge. 

If you want a bigger area in the center to be color then maybe pass in a `minRadius` and `maxRadius`

    uniform float minRadius;
    uniform float maxRadius;

      float range = maxRadius - minRadius
      float mixAmount = clamp((dist - minRadius) / range, 0., 1.);

or something like that

Here's a working example

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;
      v_texcoord = texcoord;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D tex;
    uniform vec2 mousePos;
    uniform float minRadius;
    uniform float maxRadius;

    void main() {
      vec4 color0 = texture2D(tex, v_texcoord);
      vec4 bw = vec4(vec3(color0.r + color0.g + color0.b) / 3., color0.a);
      
      float dist = distance(mousePos, gl_FragCoord.xy);
      float range = maxRadius - minRadius;
      float mixAmount = clamp((dist - minRadius) / range, 0., 1.);
      
      gl_FragColor = mix(color0, bw, mixAmount);
    }
    `;
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const info = document.querySelector("#info");

    // compiles shaders, link program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const textureInfo = {
      width: 1,
      height: 1,
    };
    const texture = twgl.createTexture(gl, {
      src: "http://i.imgur.com/NzBzAdN.jpg",
      crossOrigin: '',
      flipY: true,
    }, (err, tex, img) => {
      textureInfo.width = img.width;
      textureInfo.height = img.height;
      render();
    });

    const mousePos = [0, 0];

    function render() {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // cover canvas with image  
      const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const imageAspect = textureInfo.width / textureInfo.height;

      // this assumes we want to fill vertically
      let horizontalDrawAspect = imageAspect / canvasAspect;
      let verticalDrawAspect = 1;
      // does it fill horizontally?
      if (horizontalDrawAspect < 1) {
        // no it does not so scale so we fill horizontally and
        // adjust vertical to match
        verticalDrawAspect /= horizontalDrawAspect;
        horizontalDrawAspect = 1;
      }
      const mat = m4.scaling([horizontalDrawAspect, verticalDrawAspect, 1]);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniform
      twgl.setUniforms(programInfo, {
        minRadius: 25,
        maxRadius: 100,
        tex: texture,
        matrix: mat,
        mousePos: mousePos,
      });
      
      twgl.drawBufferInfo(gl, bufferInfo);
    }
    render();

    gl.canvas.addEventListener('mousemove', e => {
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();

      const x = (e.clientX - rect.left) * canvas.width / rect.width;
      const y = (e.clientY - rect.top)  * canvas.height / rect.height;
      mousePos[0] = x;
      mousePos[1] = canvas.height - y - 1;
      
      render();
    });

    window.addEventListener('resize', render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <canvas></canvas>  
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

Like you mentioned, you could also pass in a mask texture. This would allow you to easily make other shapes. Again, you just need a value for `mixAmount`

So, something like

    uniform mat4 maskMatrix;
    
    ...

    vec2 maskUV = (maskMatrix * vec4(v_texcoord, 0, 1)).xy;
    float mixAmount = texture2D(mask, maskUV).a;

You can see [how to set that matrix using 2d or 3d matrices by following these articles](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;
      v_texcoord = texcoord;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D tex;
    uniform mat4 maskMatrix;
    uniform sampler2D maskTex;

    void main() {
      vec4 color0 = texture2D(tex, v_texcoord);
      vec4 bw = vec4(vec3(color0.r + color0.g + color0.b) / 3., color0.a);

      vec2 maskUV = (maskMatrix * vec4(v_texcoord, 0, 1)).xy;
      float mixAmount = texture2D(maskTex, maskUV).a;
      
      gl_FragColor = mix(bw, color0, mixAmount);
    }
    `;
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const info = document.querySelector("#info");

    // compiles shaders, link program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    const textureInfo = {
      width: 1,
      height: 1,
    };
    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const texture = twgl.createTexture(gl, {
      src: "http://i.imgur.com/NzBzAdN.jpg",
      crossOrigin: '',
      flipY: true,
    }, (err, tex, img) => {
      textureInfo.width = img.width;
      textureInfo.height = img.height;
      render();
    });

    // we could load a mask from an image but let's just make one from a canvas
    // We'll use the letter F
    const maskWidth = 128;
    const maskHeight = 128;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = maskWidth;
    ctx.canvas.height = maskHeight;
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeStyle = "white";
    ctx.strokeRect(2, 2, 124, 124);

    ctx.translate(64, 64);
    ctx.fillStyle = "white";
    ctx.fillText("F", 0, 0);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const maskTexture = twgl.createTexture(gl, {
      src: ctx.canvas,
      minMag: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
      flipY: true,
    });


    const mousePos = [0, 0];

    function render() {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // cover canvas with image  
      const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const imageAspect = textureInfo.width / textureInfo.height;

      // this assumes we want to fill vertically
      let horizontalDrawAspect = imageAspect / canvasAspect;
      let verticalDrawAspect = 1;
      // does it fill horizontally?
      if (horizontalDrawAspect < 1) {
        // no it does not so scale so we fill horizontally and
        // adjust vertical to match
        verticalDrawAspect /= horizontalDrawAspect;
        horizontalDrawAspect = 1;
      }
      const mat = m4.scaling([horizontalDrawAspect, verticalDrawAspect, 1]);
      
      // Our texcoord represent a unit square from 0,0 to 1,1. We want that center
      // centered around the mouse move scale by 2 and subtract 1
      
      // compute how large the image is (note it's larger than the canvas
      // because we computed a `cover` style above)
      const imageDisplayWidth = gl.canvas.width * horizontalDrawAspect;
      const imageDisplayHeight = gl.canvas.height * verticalDrawAspect;
      
      // compute how many pixels off the screen it is
      const xOff = gl.canvas.width * (horizontalDrawAspect - 1) / 2;
      const yOff = gl.canvas.height * (verticalDrawAspect - 1) / 2;

      // decide a size to draw the mask in pixel
      const maskDrawWidth = maskWidth;
      const maskDrawHeight = maskHeight;

      let maskMat = m4.identity();
      // translate the UV coords so they are centered
      maskMat = m4.translate(maskMat, [.5, .5, 0]);
      // scale the uvCoords to the mask
      maskMat = m4.scale(maskMat, [
        1 / (maskDrawWidth / imageDisplayWidth), 
        1 / (maskDrawHeight/ imageDisplayHeight), 
        1,
      ]);
      // move the UV coords so the origin is at th emouse
      maskMat = m4.translate(maskMat, [
        -(mousePos[0] + xOff) / imageDisplayWidth,
        -(mousePos[1] + yOff) / imageDisplayHeight, 
        0,
      ]);

      // calls gl.activeTexture, gl.bindTexture, gl.uniform
      twgl.setUniforms(programInfo, {
        tex: texture,
        matrix: mat,
        maskTex: maskTexture,
        maskMatrix: maskMat,
      });
      
      twgl.drawBufferInfo(gl, bufferInfo);
    }
    render();

    gl.canvas.addEventListener('mousemove', e => {
      const canvas = e.target;
      const rect = canvas.getBoundingClientRect();

      const x = (e.clientX - rect.left) * canvas.width / rect.width;
      const y = (e.clientY - rect.top)  * canvas.height / rect.height;
      mousePos[0] = x;
      mousePos[1] = canvas.height - y - 1;
      
      render();
    });

    window.addEventListener('resize', render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <canvas></canvas>  
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

Note I used a `F` with a frame to clearly show the mask. Also note that you must keep the edges of the mask 0 because the edge pixel will be repeated past the border of the mask. Either that or you need to modify the shader to use 0 when the texture coordinates used with the mask are < 0 or > 1.

I also used a matrix to manipulate the UV coords. Because it's a matrix it's easy to scale, offset, and/or rotate the mask without having to change the shader.

As for animating it's not clear what kind of animation you want. If you want something where the color fades out over time you can [use a techinque like the one in this answer](https://stackoverflow.com/a/42059618/128511). You'd draw the mask in another pair of textures. You use that pair of textures as your `mixAmount` mask. You fade those textures back to 0 by drawing one into the other subtracting a certain amount each frame

    gl_FragColor = texture2D(mixTexture, uv).rgba - vec4(0.01);

for example.
