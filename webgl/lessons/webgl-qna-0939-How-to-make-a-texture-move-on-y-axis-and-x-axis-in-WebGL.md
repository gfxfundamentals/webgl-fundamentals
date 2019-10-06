Title: How to make a texture move on y-axis and x-axis in WebGL
Description:
TOC: qna

# Question:

For this project, I am trying to move a texture (an image of raindrops sent as a 1024x2048 png) down my screen, before looping the pixels back up to the top of the screen once they reach the bottom of the canvas. Once the pixels reach the top, I also want to move it to the right a little bit, and after several iterations, it will reach the leftmost side of the canvas, and then it is sent to the rightmost side of the canvas. However, I can't seem to get it to work correctly. As my knowledge of WebGL is quite limited, I am not sure what I am doing wrong, or what the right questions that I should be asking are. I am pretty sure that it is an issue with how I am trying to move the pixels, but I don't know what I should be doing instead. 

Here is my vertex shader:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->
    <script id="vertex-shader1" type="x-shader/x-vertex">
    
    attribute  vec4 vPosition;
    attribute vec2 vTexCoord;
    
    varying vec2 fTexCoord;
    
    void main() 
    {
     float y= vTexCoord.y - float(0.01);
     float x= vTexCoord.x;
     
     if(y < float(0.0)) {
      y = float(1.0);
      //x = fTexCoord.x + float(0.1) ;
     }
    /* if(x > float(1.0)){
      x = float(0.0);
     }
    */ 
       gl_Position = vPosition;
     fTexCoord= vec2(x,y);
    } 
    </script>
<!-- end snippet -->

And here is my fragment shader:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <script id="fragment-shader1" type="x-shader/x-fragment">

    precision mediump float;

    uniform sampler2D texture1;

    varying vec2 fTexCoord;

    void
    main()
    {

    // gl_FragColor = texture2D(texture1, vec2(x,y)); 

     
     gl_FragColor= texture2D(texture1, fTexCoord);
    }

    </script>

<!-- end snippet -->

The above shaders are supposed to make the raindrops from the image (linked below) move down the screen. [raindrop.png][1]


But instead, it just stretches the raindrops out. (It does this: [messedup_raindrops.png][2])


  [1]: https://i.stack.imgur.com/znh3D.jpg
  [2]: https://i.stack.imgur.com/3XwLZ.png

Any ideas on how to fix this?

# Answer

I sounds like you want to "scroll" a texture. To do that you can just pass in an offset to the texture coords. You can do it in either the fragment or vertex shader

Effectively

    uniform vec2 offset;

    vec2 newTexCoords = texCoords + offset;

And then just change `offset` over time. Offset values generally only need to be in the range of 0 to 1 since past that things will just repeat.

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    uniform vec2 offset;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = texcoord + offset;
    }
    `;

    const fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, v_texcoord);
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl');

    // compile shaders, link program, lookup locations
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
      texcoord: {
        numComponents: 2,
        data: [
           0,  1,
           1,  1,
           0,  0,
           0,  0,
           1,  1,
           1,  0,
        ],
      },
    });

    const texture = twgl.createTexture(gl, {
      src: 'https://i.imgur.com/ZKMnXce.png',
      crossOrigin: 'anonymous',
    });

    function render(time) {
      time *= 0.001;  // convert to seconds
      
      gl.useProgram(programInfo.program);
      // bind buffers and set attributes
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // set uniforms and bind textures
      twgl.setUniforms(programInfo, {
        tex: texture,
        offset: [(time * .5) % 1, (time * .6) % 1],
      });
      const count = 6;
      gl.drawArrays(gl.TRIANGLES, 0, count);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.js"></script>

<!-- end snippet -->

If you want something more flexible I'd suggest you use a matrix for your texture coords

    uniform mat4 texMatrix;

    vec2 newTexCoords = (texMatrix * vec4(texCoords, 0, 1)).xy;

Which will let you manipulate the texture coords in all the same way vertex coordinates are often manipulated which means you'll be able to scale the texture, rotate the texture, skew the texture, etc.... You can see [an example of using a texture matrix here](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)

