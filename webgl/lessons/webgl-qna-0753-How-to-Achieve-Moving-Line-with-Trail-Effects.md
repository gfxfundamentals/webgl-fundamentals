Title: How to Achieve Moving Line with Trail Effects
Description:
TOC: qna

# Question:

What's the idea of drawing such lines in the following demo? Drawing a single line with trailing effects might be simple. But those lines are also turning their directions.

http://uber.github.io/deck.gl/#/examples/custom-layers/trip-routes

# Answer

you can pass in UV coordinates for lines or generate one then use that to color the line. Pass in time to scroll something like

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");
    const vs = `
    attribute vec4 position;
    attribute float u;
    varying float v_u;
    void main() {
      gl_Position = position;
      v_u = u;
    }
    `;
    const fs = `
    precision mediump float;
    varying float v_u;
    uniform float time;
    void main() {
      float green = fract(v_u + time);
      gl_FragColor = vec4(0, green, 0, 1);
    }
    `;

    // compile shaders, link program, look up uinforms
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some lines (calls gl.createBuffer, gl.bindBuffer, gl.bufferData 
    // for each array)
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [ 
          -.5, -.5, 
           .7, -.3,
           .7, -.3,
          -.1,  .8,
          -.1,  .8,
          -.8,  .2,
        ],
      },
      u: {
        numComponents: 1, 
        data: [
          0, 1,  // these numbers define how many times
          0, 2,  // the pattern repeats for each line segment
          0, 3,  
        ],
      },
    });

    function render(time) {
      time *= 0.001; // seconds
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, { time: -time });
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    body { background: #444; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Of course you can also use a texture instead of code for the colors


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");
    const vs = `
    attribute vec4 position;
    attribute float u;
    varying float v_u;
    void main() {
      gl_Position = position;
      v_u = u;
    }
    `;
    const fs = `
    precision mediump float;
    varying float v_u;
    uniform float time;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, vec2(fract(v_u + time), 0.5));;
    }
    `;

    // compile shaders, link program, look up uinforms
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some lines (calls gl.createBuffer, gl.bindBuffer, gl.bufferData 
    // for each array)
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [ 
          -.5, -.5, 
           .7, -.3,
           .7, -.3,
          -.1,  .8,
          -.1,  .8,
          -.8,  .2,
        ],
      },
      u: {
        numComponents: 1, 
        data: [
          0, 1,  // these numbers define how many times
          0, 2,  // the pattern repeats for each line segment
          0, 3,
        ],
      },
    });

    // make a simple 16x1 texture
    // calls gl.creatTexture, gl.bindTexture, gl.texImage2D, gl.texPamameteri
    const texture = twgl.createTexture(gl, {
      height: 1,
      src: [
         0xFF, 0x00, 0x00, 0xFF,
         0xFF, 0x44, 0x00, 0xFF,
         0xFF, 0x88, 0x00, 0xFF,
         0xCC, 0xFF, 0x00, 0xFF,
         0x88, 0xFF, 0x00, 0xFF,
         0x44, 0xFF, 0x00, 0xFF,
         0xCC, 0xFF, 0x00, 0xFF,
         0xCC, 0xFF, 0x00, 0xFF,
         0xCC, 0xFF, 0x44, 0xFF,
         0xCC, 0xFF, 0x88, 0xFF,
         0xCC, 0xFF, 0xCC, 0xFF,
         0xCC, 0xCC, 0xFF, 0xFF,
         0xCC, 0x88, 0xFF, 0xFF,
         0xCC, 0x44, 0xFF, 0xFF,
         0xCC, 0x00, 0xFF, 0xFF,
         0xFF, 0xFF, 0xFF, 0xFF,
      ],
    });

    function render(time) {
      time *= 0.001; // seconds
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, { 
        time: -time,
        tex: texture,
      });
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { background: #444; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


