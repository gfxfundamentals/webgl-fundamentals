Title: Data corruption when replacing a GLSL constant with a uniform value
Description:
TOC: qna

# Question:

Follow up to [this recent question][1].

I am doing GPGPU programming in WebGL2, and I'm passing in a large 4-dimensional square array to my shaders by packing it into a texture to bypass the uniform count limits. Having freed myself from having to use a relatively small fixed-size array, I would like to be able to specify the size of the data that is actually being passed in programmatically.

Previously, I had hard-coded the size of the data to read using a `const int` as follows:

    const int SIZE = 5;
    const int SIZE2 = SIZE*SIZE;
    const int SIZE3 = SIZE2*SIZE;
    
    uniform sampler2D u_map;
    
    int get_cell(vec4 m){
     ivec4 i = ivec4(mod(m,float(SIZE)));
     float r = texelFetch(u_map, ivec2(i.x*SIZE3+i.y*SIZE2+i.z*SIZE+i.w, 0), 0).r;
     return int(r * 255.0);
    }

If I update `SIZE2` and `SIZE3` to be non-constant and initialized in main, it still works:

    const int SIZE = 5;
    int SIZE2;
    int SIZE3;
    
    uniform sampler2D u_map;
    
    int get_cell(vec4 m){
     ivec4 i = ivec4(mod(m,float(SIZE)));
     float r = texelFetch(u_map, ivec2(i.x*SIZE3+i.y*SIZE2+i.z*SIZE+i.w, 0), 0).r;
     return int(r * 255.0);
    }

    ...

    void main(){
      SIZE2 = SIZE*SIZE;
      SIZE3 = SIZE*SIZE2;

      ...
    }

However, if I then replace `const int SIZE = 5;` with `uniform int SIZE;`, and then add

    const size_loc = gl.getUniformLocation(program, "SIZE");
 gl.uniform1i(size_loc, 5);

to the JavaScript side to set it to the same integer value that used to be hardcoded, I start seeing incorrect values being read from the texture. What am I doing wrong?

UPDATE 1: I did a little experiment where I keep the constant `SIZE` specification, but then also pass in a uniform int alongside it. If they are not equal, I have the shader bail out and return all zeroes. This way, I could verify that the correct integer values are in fact being set on the uniform variable--but if I then make `SIZE` non-constant, and set it to the value of the uniform variable *with which it was just compared and found to be equal* then things break. What the heck?

UPDATE 2:

This works:

    int SIZE = 5;
    uniform int u_size;
    ....
    void main() {
      if (u_size != SIZE) return;
      SIZE = u_size;
      ...
    }

This doesn't:

    int SIZE = 5;
    uniform int u_size;
    ....
    void main() {
      SIZE = u_size;
      ...
    }


 [1]: https://stackoverflow.com/questions/55713667/data-corruption-when-replacing-uniform-array-with-1d-texture-in-webgl

# Answer

I'm not able to reproduce your issue. Post a [minimal, complete, verifiable, example](https://meta.stackoverflow.com/a/349790/128511) in a [snippet](https://stackoverflow.blog/2014/09/16/introducing-runnable-javascript-css-and-html-code-snippets/)

Here's a working example

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 1.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fs = `#version 300 es
    precision highp float;
    uniform ivec4 cell;
    uniform int SIZE;
    int SIZE2;
    int SIZE3;

    uniform highp isampler2D u_map;

    int get_cell(ivec4 m){
        ivec4 i = m % SIZE;
        int r = texelFetch(u_map, ivec2(i.x*SIZE3 + i.y*SIZE2 + i.z*SIZE + i.w, 0), 0).r;
        return r;
    }

    out int result;

    void main(){
      SIZE2 = SIZE*SIZE;
      SIZE3 = SIZE*SIZE2;
      result = get_cell(cell);
    }
    `;


    const gl = document.createElement('canvas').getContext('webgl2');
    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make a 1x1 R32I texture and attach to framebuffer
    const framebufferInfo = twgl.createFramebufferInfo(gl, [
      { internalFormat: gl.R32I, minMag: gl.NEAREST, },
    ], 1, 1);

    const size = 5;
    const totalSize = size * size * size * size;
    const data = new Int32Array(totalSize);
    for (let i = 0; i < data.length; ++i) {
      data[i] = 5 + i * 3;
    }
    // create a size*size*size*size by 1
    // R32I texture
    const tex = twgl.createTexture(gl, {
      width: totalSize,
      src: data,
      minMag: gl.NEAREST,
      internalFormat: gl.R32I,
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferInfo.framebuffer);
    gl.viewport(0, 0, 1, 1);
    gl.useProgram(programInfo.program);

    const result = new Int32Array(1);

    for (let w = 0; w < size; ++w) {
      for (let z = 0; z < size; ++z) {
        for (let y = 0; y < size; ++y) {
          for (let x = 0; x < size; ++x) {
            // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
            twgl.setUniforms(programInfo, {
              cell: [x, y, z, w],
              u_map: tex,
              SIZE: size,
            });
            gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
            gl.readPixels(0, 0, 1, 1, gl.RED_INTEGER, gl.INT, result);
            log(x, y, z, w, ':', result[0], data[x * size * size * size + y * size * size + z * size + w]);
          }
        }
      }
    }

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

trying with the code you posted I see no issues either

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 1.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fs = `#version 300 es
    precision highp float;
    uniform vec4 cell;
    uniform int SIZE;
    int SIZE2;
    int SIZE3;

    uniform sampler2D u_map;

    int get_cell(vec4 m){
        ivec4 i = ivec4(mod(m,float(SIZE)));
        float r = texelFetch(u_map, ivec2(i.x*SIZE3+i.y*SIZE2+i.z*SIZE+i.w, 0), 0).r;
        return int(r * 255.0);
    }

    out float result;

    void main(){
      SIZE2 = SIZE*SIZE;
      SIZE3 = SIZE*SIZE2;
      // output to texture is normalized float
      result = float(get_cell(cell)) / 255.0;
    }
    `;


    const gl = document.createElement('canvas').getContext('webgl2');
    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const size = 5;
    const totalSize = size * size * size * size;
    const data = new Uint8Array(totalSize);
    for (let i = 0; i < data.length; ++i) {
      data[i] = (5 + i * 3) % 256;
    }
    // create a size*size*size*size by 1
    // R8 texture
    const tex = twgl.createTexture(gl, {
      width: totalSize,
      src: data,
      minMag: gl.NEAREST,
      internalFormat: gl.R8,
    });

    gl.viewport(0, 0, 1, 1);
    gl.useProgram(programInfo.program);

    const result = new Uint8Array(4);

    for (let w = 0; w < size; ++w) {
      for (let z = 0; z < size; ++z) {
        for (let y = 0; y < size; ++y) {
          for (let x = 0; x < size; ++x) {
            // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
            twgl.setUniforms(programInfo, {
              cell: [x, y, z, w],
              u_map: tex,
              SIZE: size,
            });
            gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, result);
            log(x, y, z, w, ':', result[0], data[x * size * size * size + y * size * size + z * size + w]);
          }
        }
      }
    }

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Note that I wouldn't use a 1 dimensional texture since there is a limit on dimensions. I'd use a 3 dimensional texture to increase the limit

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 1.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fs = `#version 300 es
    precision highp float;
    uniform ivec4 cell;
    uniform int SIZE;

    uniform highp isampler3D u_map;

    int get_cell(ivec4 m){
        // no idea why you made x major
        ivec4 i = m % SIZE;
        int r = texelFetch(
          u_map,
          ivec3(
              i.z * SIZE + i.w,
              i.yx),
          0).r;
        return r;
    }

    out int result;

    void main(){
      result = get_cell(cell);
    }
    `;


    const gl = document.createElement('canvas').getContext('webgl2');
    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make a 1x1 R32I texture and attach to framebuffer
    const framebufferInfo = twgl.createFramebufferInfo(gl, [
      { internalFormat: gl.R32I, minMag: gl.NEAREST, },
    ], 1, 1);

    const size = 5;
    const totalSize = size * size * size * size;
    const data = new Int32Array(totalSize);
    for (let i = 0; i < data.length; ++i) {
      data[i] = 5 + i * 3;
    }
    // create a size*size*size*size by 1
    // R32I texture 3D
    const tex = twgl.createTexture(gl, {
      target: gl.TEXTURE_3D,
      width: size * size,
      height: size,
      src: data,
      minMag: gl.NEAREST,
      internalFormat: gl.R32I,
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferInfo.framebuffer);
    gl.viewport(0, 0, 1, 1);
    gl.useProgram(programInfo.program);

    const result = new Int32Array(1);

    for (let w = 0; w < size; ++w) {
      for (let z = 0; z < size; ++z) {
        for (let y = 0; y < size; ++y) {
          for (let x = 0; x < size; ++x) {
            // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
            twgl.setUniforms(programInfo, {
              cell: [x, y, z, w],
              u_map: tex,
              SIZE: size,
            });
            gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
            gl.readPixels(0, 0, 1, 1, gl.RED_INTEGER, gl.INT, result);
            log(x, y, z, w, ':', result[0], data[x * size * size * size + y * size * size + z * size + w]);
          }
        }
      }
    }

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



