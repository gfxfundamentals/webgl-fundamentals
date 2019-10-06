Title: WebGl: Draw Circle running into an error (specified inside)
Description:
TOC: qna

# Question:

While attempting to create a `createRegularPolygon` function I have run into an issue where I can't seem to get it to render. It throws an error telling me that I have attempted to access an out of range vertices.

> [.Offscreen-For-WebGL-0x7f8c4a89c400]GL ERROR :GL_INVALID_OPERATION : glDrawElements: attempt to access out of range vertices in attribute 0

The following is my code for generating the geometry, below that will be the whole of the tests code. Something about the below code breaks the formatting

    export const createRegularPolygon =
      (gl: WebGLRenderingContext) =>
        (position: [number, number], sides: number, radius: number): FlatGeometry | null => {

          const points: number[] = [...position, 0];
          const indices = [];
          let i = -1;
          while (++i <= sides) {
            const segment = i * 2 * Math.PI / sides;
            points.push(
              radius * Math.cos(segment) + position[0],
              radius * Math.sin(segment) + position[1],
              0,
            );
          }
          i = 0;
          while (++i <= sides) indices.push(i, i + 1, 0);

          const verticiesBufferData = new Float32Array(points);
          const verticiesBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, verticiesBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            verticiesBufferData,
            gl.STATIC_DRAW,
          );
          gl.bindBuffer(gl.ARRAY_BUFFER, null);


          const indicesBufferData = new Float32Array(indices);
          const indicesBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
          gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            indicesBufferData,
            gl.STATIC_DRAW,
          );
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

          if (!verticiesBuffer || !indicesBuffer) return null;

          return {
            verticies: verticiesBuffer,
            indices: indicesBuffer,
            size: indices.length,
          };
        };


Below is the compiled code: 

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    (function () {
    'use strict';

    function reduce(array, func, base) {
        let i = -1;
        while (++i < array.length)
            base = func(base, array[i], i, array);
        return base;
    }

    const map = (array, func) => reduce(array, (result, value, index, array) => add(result, func(value, index, array)), []);


    const flatten = (array) => [].concat(...array);

    const copy = (array) => array.slice(0);

    const add = (array, value, index = 0) => {
        const result = copy(array);
        result.splice(index, 0, value);
        return result;
    };

    const createTriangle = (gl) => (points) => {
        const vertices = flatten(map(points, pnt => [...pnt, 0]));
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer)
            return null;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer)
            return null;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            verticies: vertexBuffer,
            indices: indexBuffer,
            size: 3,
        };
    };

    const createRectangle = (gl) => (width, height = width) => {
        const vertices = [
            -width / 2, height / 2, 0,
            width / 2, height / 2, 0,
            -width / 2, -height / 2, 0,
            width / 2, -height / 2, 0,
        ];
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer)
            return null;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        const indexBuffer = gl.createBuffer();
        if (!indexBuffer)
            return null;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 3, 2]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return {
            verticies: vertexBuffer,
            indices: indexBuffer,
            size: 6,
        };
    };

    const createRegularPolygon = (gl) => (position, sides, radius) => {
        const points = [...position, 0];
        const indices = [];
        let i = -1;
        while (++i <= sides) {
            const segment = i * 2 * Math.PI / sides;
            points.push(radius * Math.cos(segment) + position[0], radius * Math.sin(segment) + position[1], 0);
        }
        i = 0;
        while (++i <= sides)
            indices.push(i, i + 1, 0);
        const verticiesBufferData = new Float32Array(points);
        const verticiesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticiesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticiesBufferData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        const indicesBufferData = new Float32Array(indices);
        const indicesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesBufferData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        if (!verticiesBuffer || !indicesBuffer)
            return null;
        console.log(verticiesBufferData, indicesBufferData);
        return {
            verticies: verticiesBuffer,
            indices: indicesBuffer,
            size: indices.length,
        };
    };

    const draw = (gl) => (shader) => (geometry) => {
        gl.useProgram(shader.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.verticies);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
        gl.drawElements(gl.TRIANGLES, geometry.size, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(shader.attribLocations.vertexPosition);
    };

    const createShaderLoader = (gl) => (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const createShader = (gl) => (vsSource, fsSource) => {
        const loadShader = createShaderLoader(gl);
        const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!shaderProgram || !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            return null;
        }
        return {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            }
        };
    };

    const vs = `
        attribute vec4 aVertexPosition;

        void main() {
          gl_Position = aVertexPosition;
        }
    `;
    const fs = `
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `;

    function main(gl) {
        if (!gl)
            return false;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const polygonT = createTriangle(gl)([[-1, 1], [-1, -1], [1, -1]]);
        const polygonP = createRegularPolygon(gl)([0, 0], 3, 0.5);
        const polygonR = createRectangle(gl)(2, 0.25);
        const defaultShader = createShader(gl)(vs, fs);
        if (!defaultShader || !polygonT || !polygonR || !polygonP)
            return false;
        [polygonP].forEach(draw(gl)(defaultShader));
        return true;
    }

    const canvas = document.querySelector(`canvas`);
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl');
        if (gl)
            main(gl);
    }

    }());


<!-- language: lang-html -->

    <html>
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
      }
      html,
      body,
      canvas {
        padding: 0;
        margin: 0;
      }
    </style>

    <body>
      <canvas></canvas>
    </body>

    </html>


<!-- end snippet -->



# Answer

The bug is just a typo

This line in `createRegularPolygon`

    const indicesBufferData = new Float32Array(indices);

Should be this

    const indicesBufferData = new Uint16Array(indices);
