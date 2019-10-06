Title: Fullscreen, full dpi WebGL canvas on mobile device
Description:
TOC: qna

# Question:

There are any way to make size of canvas on mobile device 1 to 1 to devices screen real pixel size?

This is important for google cardboard (VR) application support directly from site. (in this case dpi really matters)

Currently the only way using viewport target-densitydpi is deprecated and not working on modern browsers.

# Answer

The easiest way is to use CSS to decide what size you want the canvas. Then look up what size the browser is displaying the canvas in CSS pixels using `canvas.clientWidth` and `canvas.clientHeight`. Now multiply that by `window.devicePixelRatio` to get the number of device pixels those CSS pixels represent and set the canvas's content/drawingbuffer size to match.

Example:

1.  Make a canvas

        <canvas id="c"></canvas>  

2.  Set its size using CSS

    Here I'm making the canvas be the size of the viewport (the window). 

        body {
          margin: 0;
        }
        canvas {
          width: 100vw;
          height: 100vh; 
          display: block;
        }

3. Look up the size it's displayed and match its drawingbuffer size.

        function resizeToMatchDisplaySize(canvas) {
          var displayWidth  = canvas.clientWidth  * window.devicePixelRatio;
          var displayHeight = canvas.clientHeight * window.devicePixelRatio;
          if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width  = displayWidth;
            canvas.height = displayHeight;
            return true;
          }
          return false;
        }

4. Before rendering each frame adjust the size 

        function render() {
          // resize before rendering in case of resizing or rotation
          if (resizeToMatchDisplaySize(gl.canvas)) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); 
          }
      
      
          // render scene
      
          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);


Here's an example drawing some lines

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("#c").getContext("webgl", { alpha: false });
    var programInfo = twgl.createProgramInfo(gl, ['vs', 'fs']);
    var ids = [];
    for (var i = 0; i < 500; ++i) {
      ids.push(i);
    }
    var arrays = {
      vertexId: { size:1, data: ids},
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {
      time: 0,
      numIds: ids.length,
      resolution: [0, 0],
    };

    function resizeToMatchDisplaySize(canvas) {
      var displayWidth  = canvas.clientWidth  * window.devicePixelRatio;
      var displayHeight = canvas.clientHeight * window.devicePixelRatio;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        return true;
      }
      return false;
    }

    function render(time) {
      // resize before rendering in case of resizing or rotation
      if (resizeToMatchDisplaySize(gl.canvas)) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
      
      // render scene
      gl.useProgram(programInfo.program);
      uniforms.time = time * 0.001;
      uniforms.resolution[0] = gl.drawingBufferWidth;
      uniforms.resolution[1] = gl.drawingBufferHeight;
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.LINES, bufferInfo);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <canvas id="c"></canvas>
      <script id="vs" type="notjs">
    attribute float vertexId;

    varying vec4 v_color;

    uniform float numIds;
    uniform float time;
    uniform vec2 resolution;

    #define PI radians(180.0)

    vec3 hsv2rgb(vec3 c) {
      c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }


    void main() {
      vec4 offsets = vec4(
        sin(time), 
        sin(time * .13) * PI * 2.,
        sin(time * .43) * .5 + 1.,
        cos(time * .17) * .5 + .5);

      vec4 centers = vec4(
        sin(time * .163) * .5,
        cos(time * .267) * .5,
        sin(time * .367) * .5,
        cos(time * .497) * .5);

      vec4 mult = vec4(
        1.,
        (sin(time * .1) * .5 + .5) * 3.,
        0.,
        0.);

      vec2 position = vec2(vertexId / numIds, mod(vertexId, 2.));
      vec2 offset = mix(offsets.xz, offsets.yw, position.y);
      float a = mult.x * position.x * PI * 2.0 + offset.x;//mix(u_offsets.x, u_offsets.y, a_position.y);
      float c = cos(a * mult.y);
      vec2 xy = vec2(
        cos(a),
        sin(a)) * c * offset.y +
        mix(centers.xy, centers.zw, position.y);
      vec2 aspect = vec2(resolution.y / resolution.x, 1);
      gl_Position = vec4(xy * aspect, 0, 1);
      
      float hue = position.x;
      float sat = 1.;
      float val = 1.;
      v_color = vec4(hsv2rgb(vec3(hue, sat, val)), 1);
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
      </script>
      <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->

Note that you've asked 2 questions. How to get native 1x1 pixels and how to go fullscreen. Fullscreen is harder. iOS Safari has no support for the [fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API). Chrome for android does but it requires your website be served from HTTPS.

You should also put this in your `<head>` section

    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">

And set `user-scalable` to `yes` or `no` depending on what you want
