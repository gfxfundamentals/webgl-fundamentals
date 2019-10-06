Title: How should I set a vertex limit in WebGL?
Description:
TOC: qna

# Question:

I've built an [audio spectrogram][1] with WebGL

[![audio spectrogram][2]][2]

I'm currently creating a buffer based on the height of the canvas (in turn, based on the height of the window):

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, 1024 * h, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_value, 1, gl.BYTE, true, 1, 0)
    gl.enableVertexAttribArray(a_value)

    // within rAF
    // Assigning values with a rolling offset
    gl.bufferSubData(gl.ARRAY_BUFFER, idx * 1024, freqData, 1024);
    gl.drawArrays(gl.POINTS, 0, w * h)
    idx = (idx + 1) % h


My question is - I feel like I should put limit on the number of vertices/points I'm using; but how should I choose this limit?

In testing (adjusting the zoom of the page adjusts the points generated) - over 2M points seems to work on my macbook; though puts my CPU usage up.

_note: I'm planning another version that uses an image texture (which I think would solve this issue), but I've had this question a few times in different projects_

  [1]: https://benjaminbenben.com/audio-image/03/
  [2]: https://i.stack.imgur.com/HKLW5.jpg

# Answer

I don't know if this is really an answer to your question or not but you should probably be using a texture for this. Using a texture has multiple advantages

*  You can render the entire screen with just a single quad.

    This is rendered destination based meaning it will do the minimal amount of work, one unit of work per destination pixel whereas with lines/points you're likely doing far far more work per destination pixel. This means you shouldn't have to worry about performance.

*  Textures are random access meaning you use the data in more ways than you can with buffers/attributes

*  Textures are sampled so handling the case where `freqData.length !== w` is handled better.

*  Because textures are random access you could pass `idx` into the shader and use it to manipulate the texture coordinates so that the top or bottom line is always the newest data and the rest scrolls. This would be harder with attributes/buffers

*  Textures can be written to from the GPU by attaching them to a framebuffer. This would also let you scroll where you use 2 textures, each frame copy `h - 1` lines from tex1 to tex2 but shifted up or down one line. Then copy `freqData` to the first or last line. Next frame do the same but use tex2 for the source and tex1 for the destiantion.

  This would also let you scroll the data. It's arguably slightly slower than passing `idx` into the shader and manipulating the texture coordinates but it makes the texture coordinate usage consistent so if you want to do any fancier visualization you don't have to take `idx` into account every where you sample the texture.

  [vertexshaderart.com](https://vertexshaderart.com) uses this technique so shaders don't have to take into account some value like `idx` to figure out where the newest data is in the texture. The newest data is always at texture coordinate `v = 0`

Here's a sample. It does neither of the last 2 things, just uses a texture instead of a buffer.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function start() {
      const audio = document.querySelector('audio');
      const canvas = document.querySelector('canvas');

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      audio.play();

      const gl = canvas.getContext('webgl');

      const frag = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(frag, `
        precision mediump float;
        varying vec2 v_texcoord;

        uniform sampler2D tex;

        float P = 5.5;

        void main() {
          // these 2 lines convert from 0.0 -> 1.0 to -1. to +1
          // assuming that signed bytes were put in the texture.
          // This is what the previous buffer based code was doing
          // by using BYTE for its vertexAttribPointer type.
          // The thing is AFAICT the audio data from getByteFrequencyData
          // is unsigned data. See
          // https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-getByteFrequencyData-void-Uint8Array-array
          // But, this is what the old code was doing
          // do I thought I should repeat it here.

          float value = texture2D(tex, v_texcoord).r * 2.;
          value = mix(value, -2. + value, step(1., value));

          float r = 1.0 + sin(value * P);
          float g = 1.0 - sin(value * P);
          float b = 1.0 + cos(value * P);

          gl_FragColor = vec4(r, g, b, 1);
        }
      `);
      gl.compileShader(frag);

      const vert = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vert, `
        attribute vec2 a_position;
        varying vec2 v_texcoord;

        void main() {
          gl_Position = vec4(a_position, 0, 1);

          // we can do this because we know a_position is a unit quad
          v_texcoord = a_position * .5 + .5;  
        }
      `);
      gl.compileShader(vert);

      const program = gl.createProgram();
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);

      const a_value = gl.getAttribLocation(program, 'a_value');
      const a_position = gl.getAttribLocation(program, 'a_position');
      gl.useProgram(program);

      const w = freqData.length;
      let h = 0;

      const pos_buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, true, 0, 0);
      gl.enableVertexAttribArray(a_position);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      let idx = 0
      function render() {
        resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        if (gl.canvas.height !== h) {
           // reallocate texture. Note: more work would be needed
           // to save old data. As is if the user resizes the 
           // data will be cleared
           h = gl.canvas.height;
           gl.bindTexture(gl.TEXTURE_2D, texture);
           gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, 
                         gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
           idx = 0;
        }

        analyser.getByteFrequencyData(freqData);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, idx, w, 1, 
                         gl.LUMINANCE, gl.UNSIGNED_BYTE, freqData);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        idx = (idx + 1) % h;

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    function resizeCanvasToDisplaySize(canvas) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    document.querySelector("#ui").addEventListener('click', (e) => {
      e.target.style.display = 'none';
      start();
    });

<!-- language: lang-css -->

    body{ margin: 0; font-family: monospace; }
    canvas { 
      position: absolute;
      left: 0;
      top: 0;
      width: 100vw; 
      height: 100vh; 
      display: block; 
      z-index: -1;
    }
    #ui {
      position: fixed;
      top: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #ui>div {
      padding: 1em;
      background: #8ef;
      cursor: pointer;
    }

<!-- language: lang-html -->

    <audio src="https://twgljs.org/examples/sounds/DOCTOR VOX - Level Up.mp3" crossOrigin=""></audio>
    <div>music: <a href="http://youtu.be/eUX39M_0MJ8">DOCTOR VOX - Level Up</a></div>
    <canvas></canvas>
    <div id="ui"><div>click to start</div></div>

<!-- end snippet -->


