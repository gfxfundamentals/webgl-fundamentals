Title: Bind multiple Uniform Buffer Objects
Description:
TOC: qna

# Question:

With WebGL 2 we now can play with Uniform Buffer Objects.

They look like a great idea, not having to attach common uniforms to every single program (like projection and view matrices that are common to every object being rendered).

I created an helper class which I call every time I want to bind a uniform buffer object.

    class UniformBuffer {
        constructor(gl, data, boundLocation = 0) {
            this.boundLocation = boundLocation;

            this.data = new Float32Array(data);

            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferData(gl.UNIFORM_BUFFER, this.data, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }

        update(gl, data, offset = 0) {
            this.data.set(data, offset);

            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data, 0, null);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }
    };

The idea if to create the uniform buffers like this

    const perScene = new UniformBuffer(gl, [
        ...vec4.create(),
        ...vec4.create(),
    ], 0); // and bind it to bind location 0?

    const perObject = new UniformBuffer(gl, [
        ...vec4.create(),
    ], 1); // and bind it to bind location 1?
   
In my render loop, I then update the "perScene" uniforms by calling

    perScene.update(gl, [
        ...vec4.fromValues(1, 0, 0, 1),
    ], 4); // giving an offset to update only the 2nd color.

Then I'll look through all the objects in the scene and my idea is to update the perObject uniform buffer like this

    for (let i = 0; i < objects.length; i++) {
        perObject.update(gl, [
           ...vec4.fromValues(0, 0, 1, 1),
        ]);
    } 

I'm talking about `vec4` just to make the example easier, but the idea is to have matrices (projection and view) on the perScene, and (object and normal matrices) on the perObject.

In my shader I have them declared as

    uniform perScene {
        vec4 color1;
        vec4 color2;
    };


    uniform perModel {
        vec4 color3;
    };

I have a working snippet here

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    class UniformBuffer {
        constructor(gl, data, boundLocation = 0) {
            this.boundLocation = boundLocation;

            this.data = new Float32Array(data);

            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferData(gl.UNIFORM_BUFFER, this.data, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }

        update(gl, data, offset = 0) {
            this.data.set(data, offset);

            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data, 0, null);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }
    };

    const vertex = `#version 300 es

    uniform perScene {
     vec4 color1;
        vec4 color2;
    };

    uniform perModel {
     vec4 color3;
    };

    in vec3 a_position;
    out vec3 v_color;

    void main() {
     gl_Position = vec4(a_position, 1.0);
     v_color = color1.rgb + color2.rgb; // WORKS
        // v_color = color1.rgb + color2.rgb + color3.rgb; // DOESNT WORK
    }
    `;

    const fragment = `#version 300 es
    precision highp float;
    precision highp int;

    in vec3 v_color;
    out vec4 outColor;

    void main() {
     outColor = vec4(v_color, 1.0);
    }
    `;

    const geometry = {
        positions: [-0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0],
        indices: [0, 2, 1, 1, 2, 3],
    };

    const renderList = [];

    // STEP 1 (create canvas)
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log('no webgl2 buddy');
    }

    // STEP 2 (create program)
    const v = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(v, vertex);
    gl.compileShader(v);

    const f = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(f, fragment);
    gl.compileShader(f);

    const program = gl.createProgram();
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);

    // STEP 3 (create VAO)
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const colorUniformLocation = gl.getUniformLocation(program, 'color');

    const positionsBuffer = gl.createBuffer();
    const indicesBuffer = gl.createBuffer();

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // position & indices
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);

    // STEP 4 (create UBO)

    // bound to location 0
    const perScene = new UniformBuffer(gl, [
        ...vec4.create(), // color 1
        ...vec4.create(), // color 2
    ], 0);

    // bound to location 1 ?
    const perModel = new UniformBuffer(gl, [
        ...vec4.create(), // color 3
    ], 3);

    // STEP 5 (add instances)
    for (let i = 0; i < 1; i++) {
        renderList.push({
            id: i,
            vao: vao,
            program: program,
            color: [0, 1, 1],
        });
    }

    // STEP 6 (draw)
    gl.clearColor(0, 0, 0, 0);

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, canvas.width, canvas.height);

    perScene.update(gl, [
        ...vec4.fromValues(1, 0, 0, 1),
        ...vec4.fromValues(0, 1, 0, 1),
    ]);

    for (let i = 0; i < renderList.length; i++) {
        const current = renderList[i];
        gl.useProgram(current.program);
        gl.bindVertexArray(current.vao);

        // update perObject
        perModel.update(gl, [
            ...vec4.fromValues(0, 0, 1, 1),
        ]);

        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);

        // unbind
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    console.log('compiled!');


<!-- language: lang-css -->

    canvas {
        background-color: black;
    }


<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

<!-- end snippet -->

Shouldn't I be seeing a white square since all colours added up result in a `vec4(1.0, 1.0, 1.0, 1.0)`? (jsfiddle line 41)

What am I doing wrong?
Thanks

# Answer

So, the first thing you're doing wrong is you're not calling `gl.getUniformBlockIndex`. Just like uniform you have to query the location or in this case the index of each block.

The second thing is block uniforms are indirected one level and you need to call `gl.uniformBlockBinding(program, uniformBlockIndex, uniformBufferIndex)`;

`uniformBlockIndex` is the index you got from `gl.getUniformBlockIndex`. `uniformBufferIndex` similar to a texture unit. There are N uniform buffer indices. You can choose any buffer index from `0` to `MAX_UNIFORM_BUFFER_BINDINGS - 1`.

This indirection helps if you have one program that uses blocks A, B and another that uses A and C. In this case block A might have a different index in the 2 programs but you have it pull its values from the same uniformBufferIndex.

Note that this state is per program state so can probably set it at init time if you plan to always use the same uniform buffer index for the same uniform block.

To spell it out even more. You have a shader program. It has state

    var someProgram = {
      uniforms: {
        projectionMatrix: [1, 0, 0, 0, 0, ... ],  // etc
      },
      uniformBlockIndcies[  // one per uniform block
        0, 
        0,
        0,
      ],
      ...
    }

Next you have uniform buffer indices which are global state

    glState = {
      textureUnits: [ ... ],
      uniformBuffers: [ null, null, null ..., ], 
    };

You tell the program for each uniform buffer block, which uniform buffer index to use with `gl.uniformBlockBinding`. You then bind a buffer to that index with `gl.bindBufferBase` or `gl.bindBufferRange`.

It's very similar to telling a program which texture unit to use and then binding a texture to that unit. When you do this, at init time or render time is really up to you. In my mind it seems more likely I could decide at init time that my perScene stuff is always on buffer index 0 and perModel stuff at index 1 and therefore I could set them up the program parts (the calls to `gl.uniformBlockBinding`) at init time.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    class UniformBuffer {
        constructor(gl, data, boundLocation = 0) {
            this.boundLocation = boundLocation;

            this.data = new Float32Array(data);

            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferData(gl.UNIFORM_BUFFER, this.data, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }

        update(gl, data, offset = 0) {
            this.data.set(data, offset);

            gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data, 0, null);
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, this.boundLocation, this.buffer);
        }
    };

    const vertex = `#version 300 es

    uniform perScene {
     vec4 color1;
        vec4 color2;
    };

    uniform perModel {
     vec4 color3;
    };

    in vec3 a_position;
    out vec3 v_color;

    void main() {
     gl_Position = vec4(a_position, 1.0);
     v_color = color1.rgb + color2.rgb + color3.rgb; 
    }
    `;

    const fragment = `#version 300 es
    precision highp float;
    precision highp int;

    in vec3 v_color;
    out vec4 outColor;

    void main() {
     outColor = vec4(v_color, 1.0);
    }
    `;

    const geometry = {
        positions: [-0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0],
        indices: [0, 2, 1, 1, 2, 3],
    };

    const renderList = [];

    // STEP 1 (create canvas)
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log('no webgl2 buddy');
    }

    // STEP 2 (create program)
    const v = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(v, vertex);
    gl.compileShader(v);

    const f = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(f, fragment);
    gl.compileShader(f);

    const program = gl.createProgram();
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);

    // STEP 3 (create VAO)
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const colorUniformLocation = gl.getUniformLocation(program, 'color');

    const positionsBuffer = gl.createBuffer();
    const indicesBuffer = gl.createBuffer();

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // position & indices
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);

    // STEP 4 (create UBO)

    // bound to location 0
    const perScene = new UniformBuffer(gl, [
        ...vec4.create(), // color 1
        ...vec4.create(), // color 2
    ], 0);

    // bound to location 1 ?
    const perModel = new UniformBuffer(gl, [
        ...vec4.create(), // color 3
    ], 1);

    gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, "perScene"), perScene.boundLocation);
    gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, "perModel"), perModel.boundLocation);


    // STEP 5 (add instances)
    for (let i = 0; i < 1; i++) {
        renderList.push({
            id: i,
            vao: vao,
            program: program,
            color: [0, 1, 1],
        });
    }

    // STEP 6 (draw)
    gl.clearColor(0, 0, 0, 0);

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, canvas.width, canvas.height);

    perScene.update(gl, [
        ...vec4.fromValues(1, 0, 0, 1),
        ...vec4.fromValues(0, 1, 0, 1),
    ]);

    for (let i = 0; i < renderList.length; i++) {
        const current = renderList[i];
        gl.useProgram(current.program);
        gl.bindVertexArray(current.vao);

        // update perObject
        perModel.update(gl, [
            ...vec4.fromValues(0, 0, 1, 1),
        ]);

        gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);

        // unbind
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    console.log('compiled!');

<!-- language: lang-css -->

    canvas {
        background-color: black;
    }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

<!-- end snippet -->

In [this example](http://twgljs.org/examples/uniform-buffer-objects.html) there are 5 uniform blocks.

1. the shared matrices like `projection` and `view` and `viewProjection`
2. the per model matrices like `world` and `worldInverseTransform`
3. the per light info like `lightPosition` and `lightColor`. 
4. There are 2 lights so the 4th block is similar to the 3rd
5. the material data like ambient color, specularity, etc..

I'm not saying that's the perfect setup. I really have no idea. But it's pretty common to make something called a "material" and share that material among more than one model so that's like a `perMaterial` block which is different from a `perModel` block. It's also common to share lighting info. I don't know what the ideal setup is, just pointing out that `perScene` and `perModel` might not be enough for fairly common situations.

One other thing, this line

        // unbind
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

makes no sense. `ELEMENT_ARRAY_BUFFER` is part of the VAO state.
