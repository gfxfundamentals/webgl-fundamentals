Title: react-native display image in GLView
Description:
TOC: qna

# Question:

I'm trying to display an image on a GLView in react native.
I was inspired by this link to write my code https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html

I have this component who calls a GLContext2D class:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    import React, { Component } from 'react';
    import { Text, View, StyleSheet } from 'react-native';
    import Expo from 'expo';

    import GLContext2D from '../../lib/GLContext2D';

    export default class Scene extends Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          ready: false,
        };
      }

      componentDidMount() {
        (async () => {
          this._textureAsset = Expo.Asset.fromModule(
            require('../../test.jpg')
          );
          await this._textureAsset.downloadAsync();
          console.log("ok");
          this.setState({ ready: true });
        })();
      }

      render () {
        return this.state.ready
          ? <Expo.GLView
              style={styles.view}
              onContextCreate={this._onContextCreate}
            />
          : <Expo.AppLoading />;
      }

      _onContextCreate = gl => {
        console.log(this._textureAsset);
        var ctx = new GLContext2D(gl);
        var test = ctx.createTextureFromAsset(this._textureAsset);
        ctx.clear();
        gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        ctx.drawImage(test.texture, test.width, test.height, 0, 200);
              gl.flush();
            gl.endFrameEXP();
      }
    }

    const styles = StyleSheet.create({
      view: {
        width: 500,
        height: 1000,
        backgroundColor: 'yellow'
      }
    });


<!-- end snippet -->


And the GLContext2D class:

<!-- language: lang-js -->

    import Expo from 'expo';
    import {mat4} from 'gl-matrix';

    const vertSrc = `
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_textureMatrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = u_matrix * a_position;
      v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }
    `;

    const fragSrc = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_texture;

    void main() {
      if (v_texcoord.x < 0.0 ||
          v_texcoord.y < 0.0 ||
          v_texcoord.x > 1.0 ||
          v_texcoord.y > 1.0) {
        gl_FragColor = vec4(1, 0, 1, 1); // blue
        return;
      }
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    export default class GLContext2D {
      constructor(gl) {
        var vert;
        var frag;

        this._gl = gl;
        vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertSrc);
        gl.compileShader(vert);
        frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragSrc);
        gl.compileShader(frag);

        this._program = gl.createProgram();
        gl.attachShader(this._program, vert);
        gl.attachShader(this._program, frag);
        gl.linkProgram(this._program);

        this._locations = {
          position: gl.getAttribLocation(this._program, "a_position"),
          texcoord: gl.getAttribLocation(this._program, "a_texcoord"),
          matrix: gl.getUniformLocation(this._program, "u_matrix"),
          textureMatrix: gl.getUniformLocation(this._program, "u_textureMatrix"),
          texture: gl.getUniformLocation(this._program, "u_texture")
        };
        this._createBuffers();
      }

      _createBuffers() {
        var positions;
        var texcoords;
        var gl;

        gl = this._gl;
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        this._texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texcoordBuffer);
        texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
      }

      async createTextureFromAsset(asset) {
        var gl;
        var tex;
        var texData;
        var img;

        gl = this._gl;
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        texData = {
          width: 1,
          height: 1,
          texture: tex,
        };

        texData.width = asset.width;
        texData.height = asset.height;

        gl.bindTexture(gl.TEXTURE_2D, texData.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);

        return (texData);
      }

      //ctx.drawImage(tex, texWidth, texHeight, dstX, dstY);
      //ctx.drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight)
      drawImage(
            tex, texWidth, texHeight,
            srcX, srcY, srcWidth, srcHeight,
            dstX, dstY, dstWidth, dstHeight, srcRotation) {
        var gl;
        var matrix, matrix2;
        var texMatrix;

        if (dstX === undefined) {
          dstX = srcX;
          srcX = 0;
        }
        if (dstY === undefined) {
          dstY = srcY;
          srcY = 0;
        }
        if (srcWidth === undefined) {
          srcWidth = texWidth;
        }
        if (srcHeight === undefined) {
          srcHeight = texHeight;
        }
        if (dstWidth === undefined) {
          dstWidth = srcWidth;
          srcWidth = texWidth;
        }
        if (dstHeight === undefined) {
          dstHeight = srcHeight;
          srcHeight = texHeight;
        }
        if (srcRotation === undefined) {
          srcRotation = 0;
        }

        gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.useProgram(this._program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.enableVertexAttribArray(this._locations.position);
        gl.vertexAttribPointer(this._locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texcoordBuffer);
        gl.enableVertexAttribArray(this._locations.texcoord);
        gl.vertexAttribPointer(this._locations.texcoord, 2, gl.FLOAT, false, 0, 0);

        matrix = mat4.create();
        matrix2 = mat4.create();
        mat4.ortho(matrix, 0, 1000, 1000, 0, -1, 1);
        mat4.translate(matrix2, matrix, [dstX, dstY, 0]);
        mat4.copy(matrix, matrix2);
        mat4.scale(matrix2, matrix, [dstWidth, dstHeight, 1]);
        mat4.copy(matrix, matrix2);
        gl.drawingBufferHeight = 320;
        gl.uniformMatrix4fv(this._locations.matrix, false, matrix);
        texMatrix = mat4.create();
        mat4.fromScaling(texMatrix, [1 / texWidth, 1 / texHeight, 1]);
        mat4.translate(matrix2, texMatrix, [texWidth * 0.5, texHeight * 0.5, 0]);
        mat4.copy(texMatrix, matrix2);
        mat4.rotateZ(matrix2, texMatrix, srcRotation);
        mat4.copy(texMatrix, matrix2);
        mat4.translate(matrix2, texMatrix, [texWidth * -0.5, texHeight * -0.5, 0]);
        mat4.translate(texMatrix, matrix2, [srcX, srcY, 0]);
        mat4.scale(matrix2, texMatrix, [srcWidth, srcHeight, 1]);
        mat4.copy(texMatrix, matrix2);

        gl.uniformMatrix4fv(this._locations.textureMatrix, false, texMatrix);
        gl.uniform1i(this._locations.texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      clear() {
        var gl;

        gl = this._gl;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }


<!-- end snippet -->

I have a blue screen with the clear function but nothing appears from drawImage function.

# Answer

First off, please learn how to make a [*Minimal, Complete, and Verifiable example*](https://stackoverflow.com/help/mcve). Emphasis on **minimal**. 

Looking at your code in `drawImage` you have the size of the canvas hard coded

    mat4.ortho(matrix, 0, 1000, 1000, 0, -1, 1);

It seems like you'd want

    mat4.ortho(matrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

Also I have no idea what this line is for

    gl.drawingBufferHeight = 320;

Finally I notice you have `createTextureFromAsset` as an async function but you'd not calling it with an `await`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vertSrc = `
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_textureMatrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = u_matrix * a_position;
      v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }
    `;

    const fragSrc = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_texture;

    void main() {
      if (v_texcoord.x < 0.0 ||
          v_texcoord.y < 0.0 ||
          v_texcoord.x > 1.0 ||
          v_texcoord.y > 1.0) {
        gl_FragColor = vec4(1, 0, 1, 1); // blue
        return;
      }
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    class GLContext2D {
      constructor(gl) {
        var vert;
        var frag;

        this._gl = gl;
        vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vert, vertSrc);
        gl.compileShader(vert);
        frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(frag, fragSrc);
        gl.compileShader(frag);

        this._program = gl.createProgram();
        gl.attachShader(this._program, vert);
        gl.attachShader(this._program, frag);
        gl.linkProgram(this._program);

        this._locations = {
          position: gl.getAttribLocation(this._program, "a_position"),
          texcoord: gl.getAttribLocation(this._program, "a_texcoord"),
          matrix: gl.getUniformLocation(this._program, "u_matrix"),
          textureMatrix: gl.getUniformLocation(this._program, "u_textureMatrix"),
          texture: gl.getUniformLocation(this._program, "u_texture")
        };
        this._createBuffers();
      }

      _createBuffers() {
        var positions;
        var texcoords;
        var gl;

        gl = this._gl;
        this._positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        this._texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texcoordBuffer);
        texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
      }

      async createTextureFromAsset(asset) {
        var gl;
        var tex;
        var texData;
        var img;

        gl = this._gl;
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        texData = {
          width: 1,
          height: 1,
          texture: tex,
        };

        texData.width = asset.width;
        texData.height = asset.height;

        gl.bindTexture(gl.TEXTURE_2D, texData.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);

        return (texData);
      }

      //ctx.drawImage(tex, texWidth, texHeight, dstX, dstY);
      //ctx.drawImage(tex, texWidth, texHeight, dstX, dstY, dstWidth, dstHeight)
      drawImage(
            tex, texWidth, texHeight,
            srcX, srcY, srcWidth, srcHeight,
            dstX, dstY, dstWidth, dstHeight, srcRotation) {
        var gl;
        var matrix, matrix2;
        var texMatrix;

        if (dstX === undefined) {
          dstX = srcX;
          srcX = 0;
        }
        if (dstY === undefined) {
          dstY = srcY;
          srcY = 0;
        }
        if (srcWidth === undefined) {
          srcWidth = texWidth;
        }
        if (srcHeight === undefined) {
          srcHeight = texHeight;
        }
        if (dstWidth === undefined) {
          dstWidth = srcWidth;
          srcWidth = texWidth;
        }
        if (dstHeight === undefined) {
          dstHeight = srcHeight;
          srcHeight = texHeight;
        }
        if (srcRotation === undefined) {
          srcRotation = 0;
        }

        gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.useProgram(this._program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.enableVertexAttribArray(this._locations.position);
        gl.vertexAttribPointer(this._locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._texcoordBuffer);
        gl.enableVertexAttribArray(this._locations.texcoord);
        gl.vertexAttribPointer(this._locations.texcoord, 2, gl.FLOAT, false, 0, 0);

        matrix = mat4.create();
        matrix2 = mat4.create();
        mat4.ortho(matrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        mat4.translate(matrix2, matrix, [dstX, dstY, 0]);
        mat4.copy(matrix, matrix2);
        mat4.scale(matrix2, matrix, [dstWidth, dstHeight, 1]);
        mat4.copy(matrix, matrix2);
    //    gl.drawingBufferHeight = 320;
        gl.uniformMatrix4fv(this._locations.matrix, false, matrix);
        texMatrix = mat4.create();
        mat4.fromScaling(texMatrix, [1 / texWidth, 1 / texHeight, 1]);
        mat4.translate(matrix2, texMatrix, [texWidth * 0.5, texHeight * 0.5, 0]);
        mat4.copy(texMatrix, matrix2);
        mat4.rotateZ(matrix2, texMatrix, srcRotation);
        mat4.copy(texMatrix, matrix2);
        mat4.translate(matrix2, texMatrix, [texWidth * -0.5, texHeight * -0.5, 0]);
        mat4.translate(texMatrix, matrix2, [srcX, srcY, 0]);
        mat4.scale(matrix2, texMatrix, [srcWidth, srcHeight, 1]);
        mat4.copy(texMatrix, matrix2);

        gl.uniformMatrix4fv(this._locations.textureMatrix, false, texMatrix);
        gl.uniform1i(this._locations.texture, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      clear() {
        var gl;

        gl = this._gl;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }

    function loadImageP(url) {
      return new Promise((fulfill, reject) => {
        const img = new Image();
        img.crossOrigin = "";
        img.onload = fulfill;
        img.onerror = reject;
        img.src = url;
      });
    }


    const gl = document.querySelector("canvas").getContext("webgl");
    const gl2D = new GLContext2D(gl);

    async function load(url) {
      const e = await loadImageP(url);
      const tex = await gl2D.createTextureFromAsset(e.target);
      gl2D.drawImage(
         tex.texture, tex.width, tex.height,
         0, 0, 300, 150);
    };
          
    (async function() {
      await load("http://i.imgur.com/iFom4eT.png");
    }());

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


