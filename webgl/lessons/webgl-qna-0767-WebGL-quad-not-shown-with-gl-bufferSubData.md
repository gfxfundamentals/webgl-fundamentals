Title: WebGL quad not shown with gl.bufferSubData
Description:
TOC: qna

# Question:

I have basic knowledge of WebGL/OpenGL but not with `gl.bufferSubData`.
So my goal was to create a SpriteBatch class like in this question [First Question][1]
Since I think the problem is related to the `gl.bufferSubData`, I will only post the pieces of code that are related the render calls. Also I include unknown variables but will show their value in comments.

So when a SpriteBatch is constructed this piece of code is called (inside constructor)

    // this.capacity = 750, VERTEX_OFFSET = 18
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.capacity * VERTEX_OFFSET), this.gl.STREAM_DRAW);
    this.gl.enableVertexAttribArray(this.program.vertexLocation);
    this.gl.vertexAttribPointer(this.program.vertexLocation, 3, gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

When i add a sprite to the SpriteBatch this piece of code is called
    
    //s == new Sprite()
    // UNIT_QUAD_COORDS = new Float32Array([-0.5, -0.5, 1.0, 0.5, -0.5, 1.0, -0.5, 0.5, 1.0, -0.5, 0.5, 1.0, 0.5, -0.5, 1, 0.5, 0.5, 1.0]);
    this.numberUsedVertices += VERTEX_OFFSET; //  VERTEX_OFFSET=18
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    let data = UNIT_QUAD_COORDS; // new Float32Array([-0.5, -0.5, 1.0, 0.5, -0.5, 1.0, -0.5, 0.5, 1.0, -0.5, 0.5, 1.0, 0.5, -0.5, 1, 0.5, 0.5, 1.0]);

    for (let k = 0; k < VERTEX_OFFSET; k += 3) {
      let x = s.size * UNIT_QUAD_COORDS[k] * Math.cos(s.rotation) - s.size * UNIT_QUAD_COORDS[k + 1] * Math.sin(s.rotation);
      let y = s.size * UNIT_QUAD_COORDS[k] * Math.sin(s.rotation) + s.size * UNIT_QUAD_COORDS[k + 1] * Math.cos(s.rotation);
      x += s.x;
      y += s.y;
      data[k] = x;
      data[k + 1] = y;
    }
    // s.index = 0, VERTEX_OFFSET=18
    gl.bufferSubData(gl.ARRAY_BUFFER, VERTEX_OFFSET * s.index, data)

And finally when i draw the SpriteBatch:

    gl.useProgram(this.program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.program.vertexLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.numberUsedVertices); // this.numberUsedVertices =18


Please note that when `gl.vertexAttribPointer(this.program.vertexLocation, 3, gl.FLOAT, false, 0, 0); ` is used I only see a white screen. But when i use `gl.vertexAttribPointer(this.program.vertexLocation, 2, gl.FLOAT, false, 0, 0);` is see many different triangles.
Please also note that when I draw normally, which means without `gl.bufferSubData` and SpriteBatch, the quad is shown.

So my assumption is that my usage of `gl.bufferSubData` is wrong. 
  [1]: https://gamedev.stackexchange.com/questions/142853/removing-updating-spritebatch

# Answer

the offset to `gl.bufferSubData` is in bytes so you probably want

    gl.bufferSubData(gl.ARRAY_BUFFER, VERTEX_OFFSET * s.index * 4, data);

or if you want to be pedantic

    const offset = VERTEX_OFFSET * s.index * Float32Array.BYTES_PER_ELEMENT;
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");

    const vs = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
      gl_PointSize = 10.;
    }
    `
    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `

    const program = twgl.createProgram(gl, [vs, fs]);

    const positionLoc = gl.getAttribLocation(program, "position");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const numVerts = 100;
    const vertSize = 2 * 4;  // 2 floats, 4 bytes each
    gl.bufferData(gl.ARRAY_BUFFER, numVerts * vertSize, gl.STREAM_DRAW);

    const vert = new Float32Array(2);

    function render() {
      // replace one vertex
      const ndx = Math.random() * numVerts | 0;
      vert[0] = Math.random() * 2 - 1;
      vert[1] = Math.random() * 2 - 1;
      const offset = ndx * vertSize;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, offset, vert);
      
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      
      gl.useProgram(program);

      gl.drawArrays(gl.POINTS, 0, numVerts);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    canvas { border: 1px solid black }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>


<!-- end snippet -->


