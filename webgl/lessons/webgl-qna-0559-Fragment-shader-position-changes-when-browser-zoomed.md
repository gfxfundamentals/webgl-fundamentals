Title: Fragment shader position changes when browser zoomed
Description:
TOC: qna

# Question:

I am using cocos2d-js webgl mode to create a very simple shader effect:

draw a filled circle with a give center position and a radius.

The fragment shader :

    uniform vec2 position;
    uniform vec3 lightColor;
    uniform float lightSize;
    
        void main()
        {
            float distance = distance(gl_FragCoord.xy, position);
            if (distance <= lightSize) {
             gl_FragColor = vec4(lightColor, 1.0);
            }
            else {
             gl_FragColor = vec4(lightColor, 0.0); 
            }
        }


This code works fine when the browser is not scaled (100 %).

But, when I try to zoom the browser to 80% or 120%, I found that the circle was drawn with a offset from the center position I set.


I am not sure how to fix this problem to make sure that the circle is always on the CENTER POSITION I set no matter how I zoom the browser.

Any advice will be appreciated, thanks :)


# Answer

Trying your shader below I see no issues

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var fs = `
    precision mediump float;
    uniform vec2 position;
    uniform vec3 lightColor;
    uniform float lightSize;

        void main()
        {
            float distance = distance(gl_FragCoord.xy, position);
            if (distance <= lightSize) {
                gl_FragColor = vec4(lightColor, 1.0);
            }
            else {
                gl_FragColor = vec4(lightColor, 0.0);   
            }
        }
    `;
    var vs = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: { 
        numComponents: 2,
        data: [
          -1, -1,
          -1,  1,
           1, -1,
           1, -1,
          -1,  1,
           1,  1,
        ],
      },
    });

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var uniforms = {
        position: [gl.canvas.width / 2, gl.canvas.height / 2],
        lightColor: [0.5 + Math.sin(time * 10) * 0.25, 0, 0],
        lightSize: 100,
      };    
          
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
          

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

What are you setting position to? The code above is setting it to `gl.canvas.width / 2, gl.canvas.height / 2` which is the middle of the canvas
