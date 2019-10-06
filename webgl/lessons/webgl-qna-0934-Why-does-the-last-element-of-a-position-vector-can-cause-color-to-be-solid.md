Title: Why does the last element of a position vector can cause color to be solid
Description:
TOC: qna

# Question:

In the attached code, I try to draw a triangle using its texture coordinates. I'd expect the result to be in gradient color. but it turned out to be a solid color.

The reason is this line:

    gl_Position = vec4(a_position.x, a_position.y, 0.0, 0.0);

the last number of position is 0.0. If I change it to 1.0, the color will be a gradient. why?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->


    var vertexShaderSource = `#version 300 es
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec2 a_texcoord;
    out vec2 v_texcoord;

    // all shaders have a main function
    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4(a_position.x, a_position.y, 0.0, 0.0);

      // Pass the texcoord to the fragment shader.
      v_texcoord = a_texcoord;
    }
    `;

    var fragmentShaderSource = `#version 300 es

    precision highp float;

    // Passed in from the vertex shader.
     in vec2 v_texcoord;

    // The texture.
    // uniform sampler2D u_texture;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      //outColor = texture(u_texture, v_texcoord);
      outColor = vec4(v_texcoord.x, v_texcoord.y, 0.0, 1.0);
    }
    `;


        const canvas = document.querySelector('#imageA');

        const gl = canvas.getContext('webgl2');

        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var program = webglUtils.createProgramFromSources(gl,[vertexShaderSource, fragmentShaderSource]);

        // look up where the vertex data needs to go.
        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        var texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

        // Create a vertex array object (attribute state)
        //var vao = gl.createVertexArray();

        // and make it the one we're currently working with
       // gl.bindVertexArray(vao);

        // look up uniform locations
        //  var textureLocation = gl.getUniformLocation(program, "u_texture");

        var positions = new Float32Array(
        [
         -1.0,  1.0,
         1.0,  1.0, 
         -1.0,   -1.0, 
         1.0,   -1.0, 
        ]);

        var texCoords = new Float32Array(
        [
         0.0,  0.0,
         1.0,  0.0, 
         1.0,   1.0, 
         0.0,   1.0, 
        ]);
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        // Create a buffer
        var positionBuffer = gl.createBuffer();

        // Turn on the attribute

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // Set Geometry.
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocation);


        var texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        // Set Geometry.
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordAttributeLocation);



        // Tell WebGL how to convert from clip space to pixels
       // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // turn on depth testing
       // gl.disable(gl.DEPTH_TEST);

        // tell webgl to cull faces
       // gl.disable(gl.CULL_FACE);



        // Bind the attribute/buffer set we want.
        //gl.bindVertexArray(vao);

        gl.drawArrays(gl.TRIANGLES, 0, 3);


<!-- language: lang-html -->

    <html>
    <head>
        <title>
            test
        </title>
    </head>

    <canvas id="imageA" width="640" height="480"></canvas>
    <script src="https://webgl2fundamentals.org/webgl/resources/webgl-utils.js"></script>

    </html>

<!-- end snippet -->



# Answer

As others have indirectly pointed out the computation for varyings is as follows

    result = (1 - t) * a / aW + t * b / bW
             -----------------------------
                (1 - t) / aW + t / bW

Where `aW` is the W that was set on `gl_Position.w` when the varying was as set to `a` and `bW` is the W that was set on `gl_Position.w` when the varying was set to `b`.

so setting `gl_Position.w` = 0 is going to have some issues

see

https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective-correct-texturemapping.html
