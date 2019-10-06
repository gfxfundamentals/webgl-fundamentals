Title: Precompiling multiple programs
Description:
TOC: qna

# Question:

So far i have had good succes in rendering to an output texture with the use of input data (texture)

In the interest of speed, i want a set of precompiled webgl programs ready for "use" depending on what i want to do

is it possible to (pseudocode)
```
 createProgram #1
 createProgram #2
 createProgram #3
 createProgram #4

1: useProgram #1
2: attach selected frame buffers/uniforms
3: setViewPort (depended on output framebuffer attached texture)
3: drawArrays
4: readPixels
```
At this point i want to use another program (#2 for example) 
what happens to the attached uniforms and buffers to program #1
do i need to clear them? can i leav them in place and re-use them later?

If i issue "useProgram #1" are all the active uniforms and framebuffers i selected for program #1 still intact??




# Answer

Yes, you can have multiple programs setup at init time. That's the normal thing to do.

notes:

### Uniform locations are unique to each program

For example let's make 2 shader programs with exactly the same content and try to use the uniform location from one program with the other program.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    void main() {
      // draw a 10 pixel "POINT" in the center of the canvas
      gl_PointSize = 10.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;

    // make 2 identical programs
    // compile shaders, link programs
    const p1 = twgl.createProgram(gl, [vs, fs]);
    const p2 = twgl.createProgram(gl, [vs, fs]);

    // look up color location from first program
    const colorLoc = gl.getUniformLocation(p1, 'color');

    // try to use colorLoc with second program
    gl.useProgram(p2);  // make p2 the current program
    gl.uniform4fv(colorLoc, [1, 0, 0, 1]);

    console.log('error:', glEnumToString(gl, gl.getError()));

    function glEnumToString(gl, v) {
      return Object.keys(WebGLRenderingContext.prototype)
          .filter(k => gl[k] === v)
          .join(' | ');
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

It fails with `INVALID_OPERATION`. You need to look up locations separate for each program

### uniform state is per program

so for example let's make the same programs, we'll set the uniforms on them before rendering with them to show that the uniform settings are "per program"


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    void main() {
      // draw a 10 pixel "POINT" in the center of the canvas
      gl_PointSize = 10.0;
      gl_Position = position;
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;

    // make 3 identical programs
    // compile shaders, link programs, force position to location 0 by calling 
    // bindAttribLocation
    const p1 = twgl.createProgram(gl, [vs, fs], ['position']);
    const p2 = twgl.createProgram(gl, [vs, fs], ['position']);
    const p3 = twgl.createProgram(gl, [vs, fs], ['position']);

    // look up color location for each program
    const colorLocP1 = gl.getUniformLocation(p1, 'color');
    const colorLocP2 = gl.getUniformLocation(p2, 'color');
    const colorLocP3 = gl.getUniformLocation(p3, 'color');

    // set the color uniform on each program
    gl.useProgram(p1);
    gl.uniform4fv(colorLocP1, [1, 0, 0, 1]);
    gl.useProgram(p2);
    gl.uniform4fv(colorLocP2, [0, 1, 0, 1]);
    gl.useProgram(p3);
    gl.uniform4fv(colorLocP3, [0, 0, 1, 1]);

    // draw with each program
    const positionIndex = 0; 
    gl.vertexAttrib2f(positionIndex, -0.5, 0);
    gl.useProgram(p1);
    gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point

    gl.vertexAttrib2f(positionIndex, 0.0, 0);
    gl.useProgram(p2);
    gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point

    gl.vertexAttrib2f(positionIndex, 0.5, 0);
    gl.useProgram(p3);
    gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

### attributes are part of vertex array state

Each enabled attribute has a buffer attached when you call `vertexAttribPointer`

### texture units are global state. 

Which texture unit a particular program's uniform sampler uses is program state (it's a uniform so it's program state). But what textures are on each texture unit is global state.  In other words if you have a shader program with

    uniform sampler2D foo;

Then you tell that shader program which texture unit to use with

    gl.uniform1i(fooLocation, indexOfTextureUnit);

But but state if each texture unit itself is global state. For example if it was implemented in JavaScript

```
gl = {
  activeTexture: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, ... },
    ... MAX_COMBINED_TEXTURE_UNITS ...
  ],
};
```

and the functions that manipulate textures work on those units like this

```
gl = {
  activeTexture(unitEnum) {
    this.activeTexture = unitEnum - gl.TEXTURE0;
  }
  bindTexture(target, texture) {
    const textureUnit = this.textureUnits[this.activeTexture];
    textureUnit[target] = texture;
  }
  texImage2D(target, ...args) {
    const textureUnit = this.textureUnits[this.activeTexture];
    updateDataToTexture(textureUnit[target], ...args);
  }
}
```    

### Current framebuffer bindings are global state.

