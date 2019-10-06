Title: WebGL2 flat type makes colors "flash"
Description:
TOC: qna

# Question:

I'm trying to make a simple WebGL2 scene with low-poly terrain. Everything is working as expected when I let the shader interpolate between the three vertex colors. But as soon as I add the `flat` type the whole thing breaks and every triangle starts "flashing".

Vertex Shader

    #version 300 es
    precision mediump float;
    
    in vec3 in_vertexPosition;
    in vec3 in_color;
    
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_viewMatrix;
    
    flat out vec3 pass_fragColor;
    
    void main() {
     gl_Position = u_projectionMatrix * u_viewMatrix * vec4(in_vertexPosition, 1.0);
    
     pass_fragColor = in_color;
    }

Fragment Shader

    #version 300 es
    precision mediump float;
    
    flat in vec3 pass_fragColor;
    
    out vec4 out_fragColor;
    
    void main() {
         out_fragColor = vec4(pass_fragColor, 1.0);
    }

Vertices, indices and colors:

     const vertices = [
          0, 0, 0, // bottom left
          1, 0, 0, // bottom right
          1, 1, 0, // top right
          0, 1, 0 // top left
     ];

     const colors = [
          0.3, 0.3, 0.8, // bottom left
          0.3, 0.3, 0.6, // bottom right
          0.3, 0.3, 0.4, // top right
          0.3, 0.3, 0.2 // top left
     ];

     const indices = [
          0, 1, 3, // bl, br, tl
          3, 1, 2 // tl, br, tr
     ];

I've tried different ways using indices and other types of vertices but nothing seems to work. Using VBOs for better structure.

I do notice that when all the three vertices in the triangle has the same color the flashing obviously stops. What I've read is that the `flat` type makes all three vertices in a triangle use the color of the provoking vertex (last vertex in triangle by default). Unfortunately that makes the triangles "flash" and I do not understand why.

Using my NVIDIA GTX 1060 graphics card.

GIF showing the "flashing":
https://gyazo.com/7d3ba42afe1ba1458cd2820729490e47

# Answer

Maybe you have a driver bug? Or maybe there's something else wrong with your code? Post some working code? It's not flickering for me.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    #version 300 es
    precision mediump float;

    in vec3 in_vertexPosition;
    in vec3 in_color;

    uniform mat4 u_projectionMatrix;
    uniform mat4 u_viewMatrix;

    flat out vec3 pass_fragColor;

    void main() {
        gl_Position = u_projectionMatrix * u_viewMatrix * vec4(in_vertexPosition, 1.0);

        pass_fragColor = in_color;
    }
    `
    const fs = `
    #version 300 es
    precision mediump float;

    flat in vec3 pass_fragColor;

    out vec4 out_fragColor;

    void main() {
         out_fragColor = vec4(pass_fragColor, 1.0);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl2');

    const vertices = [
         0, 0, 0, // bottom left
         1, 0, 0, // bottom right
         1, 1, 0, // top right
         0, 1, 0 // top left
    ];

    const colors = [
         0.3, 0.3, 0.8, // bottom left
         0.3, 0.3, 0.6, // bottom right
         0.3, 0.3, 0.4, // top right
         0.3, 0.3, 0.2 // top left
    ];

    const indices = [
         0, 1, 3, // bl, br, tl
         3, 1, 2 // tl, br, tr
    ];
     
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
       in_vertexPosition: vertices,
       in_color: {
         numComponents: 3,
         data: colors,
       },
       indices,
    });

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      const fov = Math.PI * .25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      twgl.setUniforms(programInfo, {
        u_projectionMatrix: m4.perspective(fov, aspect, 0.1, 50),
        u_viewMatrix: m4.inverse(m4.lookAt(
          [ // eye,
            Math.sin(time * 1.2) * 2, 
            Math.cos(time * 1.1) * 2, 
            Math.sin( time * 1.3) * -3
          ], 
          [0, 0, 0], // target,
          [Math.cos(time), Math.sin(time), 0], // up
        )),
      });
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);



<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


