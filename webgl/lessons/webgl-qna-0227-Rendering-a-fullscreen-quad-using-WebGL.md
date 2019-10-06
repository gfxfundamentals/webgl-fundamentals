Title: Rendering a fullscreen quad using WebGL
Description:
TOC: qna

# Question:

I have a framebuffer to which I rendered my scene and now I want to render this to a "fullscreen" quad. How can I set my camera and what should I put in my vertex shader in order to render the framebuffer's texture to the whole screen.

I've tried creating a fullscreen quad like this

    var gl = this.gl;
    var quad_vertex_buffer = gl.createBuffer();
    var quad_vertex_buffer_data = new Float32Array([ 
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
         1.0,  1.0, 0.0]);
    gl.bufferData(quad_vertex_buffer, quad_vertex_buffer_data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.drawArrays(gl.TRIANGLES,0, 6);

but it still renders everything black. Any ideeas or examples/tutorials I can follow?

# Answer

Why do you need a camera to render a fullscreen quad? Rendering a fullscreen quad is pretty much the simplest thing you can do in WebGL. Given the buffer you already setup just use a shader like this

vertex shader:

    attribute vec4 v_position;

    void main() {
      gl_Position = v_position;
    }     

fragment shader:

    precision mediump float;

    void main() {
       gl_FragColor = vec4(0,1,0,1); // green
    }

You should get a green screen.

There's a few bugs in the code though. You need to bind the buffer *before* you try up put data in it. You need to reference the buffer through the bind point, not the buffer object.

old (incorrect)

    gl.bufferData(quad_vertex_buffer, quad_vertex_buffer_data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);

new (correct)

    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad_vertex_buffer_data, gl.STATIC_DRAW);

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
        attribute vec4 v_position;

        void main() {
          gl_Position = v_position;
        }     
    `;

    const fs = `
        precision mediump float;

        void main() {
           gl_FragColor = vec4(0,1,0,1); // green
        }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var shader_program = twgl.createProgram(gl, [vs, fs]);
    gl.useProgram(shader_program);
    var vertexPositionAttribute = gl.getAttribLocation(shader_program, "v_position");
    var quad_vertex_buffer = gl.createBuffer();
    var quad_vertex_buffer_data = new Float32Array([ 
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
         1.0,  1.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad_vertex_buffer_data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute)
    gl.drawArrays(gl.TRIANGLES, 0, 6);


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Another example with a simple pattern to show it's working

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
        attribute vec4 v_position;

        void main() {
          gl_Position = v_position;
        }     
    `;

    const fs = `
        precision mediump float;

        void main() {
           gl_FragColor = vec4(fract(gl_FragCoord.xy / vec2(16., 32.)),0,1); 
        }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var shader_program = twgl.createProgram(gl, [vs, fs]);
    gl.useProgram(shader_program);
    var vertexPositionAttribute = gl.getAttribLocation(shader_program, "v_position");
    var quad_vertex_buffer = gl.createBuffer();
    var quad_vertex_buffer_data = new Float32Array([ 
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
         1.0,  1.0, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad_vertex_buffer_data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute)
    gl.drawArrays(gl.TRIANGLES, 0, 6);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

I'd suggest you read some [WebGL tutorials](https://weglfundamentals.org/).

