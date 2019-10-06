Title: Declaring the indices of an UV-Sphere
Description:
TOC: qna

# Question:

I'm trying to create a uv-sphere in WebGL for a university project, but I'm having problems declaring the vertices indices correctly (I assume). I'm following this http://www.songho.ca/opengl/gl_sphere.html and I think my code is pretty similar to the one shown there. This is how I'm declaring my vertices/indices/normals/texture coordinates:
```js 
this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        let horizontalAng = 0;
        let horizontalDiff = (2 * Math.PI) / this.horizontalDiv;

        let verticalAng = Math.PI / 2;
        let verticalDiff = - (Math.PI / this.verticalDiv);


        for (var i = 0; i <= this.verticalDiv; i++) {

            let cosVert = Math.cos(verticalAng);
            let sinVert = Math.sin(verticalAng);

            for (var j = 0; j <= this.horizontlDiv; j++) {

                let cosHor = Math.cos(horizontalAng);
                let sinHor = Math.sin(horizontalAng);

                // z = (r * cos(verticalAng)) * cos(horizontalAng)
                // x = (r * cos(verticalAng)) * sin(horizontalAng)
                // y = r * sin(veritcalAng)

                let x = cosVert * sinHor;
                let y = sinVert;
                let z = cosVert * cosHor;

                this.vertices.push(x, y, z);
                this.normals.push(x, y, z);

                this.texCoords.push(j / this.horizontalDiv);
                this.texCoords.push(i / this.verticalDiv);

                horizontalAng += horizontalDiff;
            }

            verticalAng += verticalDiff;
        }


        for (var i = 0; i < this.verticalDiv; i++) {
            k1 = i * (this.horizontalDiv + 1);   
            k2 = k1 + this.horizontalDiv + 1;   

            for (var j = 0; j < this.horizontalDiv; j++) {

                if (i != 0) {
                    this.indices.push(k1);
                    this.indices.push(k2);
                    this.indices.push(k1 + 1);
                }

                if (i != (this.verticalDiv - 1)) {
                    this.indices.push(k1 + 1);
                    this.indices.push(k2);
                    this.indices.push(k2 + 1);
                }

                k1++;
                k2++;
            }
        }
    ```

# Answer

The code has several typos

It doesn't declare `k1` or `k2`. 

`horizontalDiv` is mis-spelled in places as `horizontlDiv`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    class Foo {
      constructor(horizontalDiv, verticalDiv) {
        this.horizontalDiv = horizontalDiv;
        this.verticalDiv = verticalDiv;
        
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        let horizontalAng = 0;
        let horizontalDiff = (2 * Math.PI) / this.horizontalDiv;

        let verticalAng = Math.PI / 2;
        let verticalDiff = -(Math.PI / this.verticalDiv);


        for (var i = 0; i <= this.verticalDiv; i++) {

          let cosVert = Math.cos(verticalAng);
          let sinVert = Math.sin(verticalAng);

          for (var j = 0; j <= this.horizontalDiv; j++) {

            let cosHor = Math.cos(horizontalAng);
            let sinHor = Math.sin(horizontalAng);

            // z = (r * cos(verticalAng)) * cos(horizontalAng)
            // x = (r * cos(verticalAng)) * sin(horizontalAng)
            // y = r * sin(veritcalAng)

            let x = cosVert * sinHor;
            let y = sinVert;
            let z = cosVert * cosHor;

            this.vertices.push(x, y, z);
            this.normals.push(x, y, z);

            this.texCoords.push(j / this.horizontalDiv);
            this.texCoords.push(i / this.verticalDiv);

            horizontalAng += horizontalDiff;
          }

          verticalAng += verticalDiff;
        }


        for (var i = 0; i < this.verticalDiv; i++) {
          let k1 = i * (this.horizontalDiv + 1);
          let k2 = k1 + this.horizontalDiv + 1;

          for (var j = 0; j < this.horizontalDiv; j++) {

            if (i != 0) {
              this.indices.push(k1);
              this.indices.push(k2);
              this.indices.push(k1 + 1);
            }

            if (i != (this.verticalDiv - 1)) {
              this.indices.push(k1 + 1);
              this.indices.push(k2);
              this.indices.push(k2 + 1);
            }

            k1++;
            k2++;
          }
        }
      }
    }

    const f = new Foo(10, 10);

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;
    uniform mat4 matrix;
    varying vec4 v_color;
    void main() {
      gl_Position = matrix * position;
      v_color = vec4(0, 0, 1, 1);
      
      // comment in next line to show normals
      //v_color = vec4(normal * .5 + .5, 1);
      
      // comment in next line to show texcoords
      //v_color = vec4(texcoord, 0, 1);
    }
    `;
    const fs = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
    `;

    // compile shaders, link program, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: f.vertices,
      normal: f.normals,
      texcoord: f.texCoords,
      indices: f.indices,
    });

    let matrix = m4.perspective(Math.PI * 0.25, 2, 0.1, 100);
    matrix = m4.translate(matrix, [0, 0, -5]);

    gl.useProgram(programInfo.program);
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // calls gl.uniformXXX
    twgl.setUniforms(programInfo, {
      matrix,
    });
    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


