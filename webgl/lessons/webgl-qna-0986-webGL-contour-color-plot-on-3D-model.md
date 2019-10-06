Title: webGL contour color plot on 3D model
Description:
TOC: qna

# Question:

I am working on software which is visualising engineering data on a surface of 3D model as color maps. For this I am using WebGL. At the moment I was able to display colors on surface of 3D model. 
But now I need to improve visualisation to make sharp transitions between colors (without color interpolation on a surface of triangles). 
I am not sure how to do it efficiently. 

smooth contours plot

[![][1]][1]

sharp contours plot

[![][2]][2]


  [1]: https://i.stack.imgur.com/FfHSa.png
  [2]: https://i.stack.imgur.com/ewiqH.png

# Answer

It's not clear what you're trying to do. You have not provided enough information to understand how your colors are chosen/computed in the first place.

I can only guess of a couple of solutions that might fit your description

1. Post process with a posterization type of technique

   You could do a simple

        gl_FragColor.rgb = floor(gl_FragColor.rgb * numLevels) / numLevels;

   Or you could do it in some color space like

        // convert to HSV
        vec3 hsv = rgb2hsv(gl_FragColor.rgb);

        // quantize hue only
        hsv.x = floor(hsv.x * numLevels) / numLevels;

        // concert back to RGB
        gl_FragColor.rgb = hsv2rgb(hsv);

   Or you could also do this in your 3D shader, it doesn't have to be post process.

   You can find rgb2hsv and hsv2rgb [here](https://github.com/greggman/hft-utils/blob/64bfc752c5563d726452ad7b0982eff3ed8436c7/dist/sprite.js#L73) but of course you could use some other color space.

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    // used to generate colors
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 1;
    ctx.canvas.height = 1;

    const vs = `
      attribute vec4 position;
      attribute vec3 normal;

      // note: there is no reason this has to come from an attrbute (per vertex)
      // it could just as easily come from a texture used in the fragment shader
      // for more resolution

      attribute vec4 color;

      uniform mat4 projection;
      uniform mat4 modelView;
      
      varying vec3 v_normal;
      varying vec4 v_color;
      
      void main () {
        gl_Position = projection * modelView * position;
        v_normal = mat3(modelView) * normal;
        v_color = color;
      }
    `;
    const fs = `
      precision mediump float;
      
      varying vec3 v_normal;
      varying vec4 v_color;
      
      uniform float numLevels;
      uniform vec3 lightDirection;

      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      vec3 hsv2rgb(vec3 c) {
        c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      void main() {
        vec3 hsv = rgb2hsv(v_color.rgb);
        
        hsv.x = floor(hsv.x * numLevels) / numLevels;
        
        vec3 rgb = hsv2rgb(hsv);
        
        // fake light
        float light = dot(normalize(v_normal), lightDirection) * .5 + .5;
        
        gl_FragColor = vec4(rgb * light, v_color.a);
        
        // uncomment next line to see without hue quantization
        // gl_FragColor = v_color;
      }
    `;
      
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const radius = 5;
    const thickness = 2;
    const radialDivisions = 32;
    const bodyDivisions = 12;
    // creates positions, normals, etc...
    const arrays = twgl.primitives.createTorusVertices(
        radius, thickness, radialDivisions, bodyDivisions);

    // add colors  for each vertex
    const numVerts = arrays.position.length / 3;
    const colors = new Uint8Array(numVerts * 4);
    for (let i = 0; i < numVerts; ++i) {
      const pos = arrays.position.subarray(i * 3, i * 3 + 3);
      const dist = v3.distance([3, 1, 3 + Math.sin(pos[0])], pos);
      colors.set(hsla(clamp(dist / 10, 0, 1), 1, .5, 1), i * 4);
    }
    arrays.color = {
      numComponents: 4,
      data: colors,
    };

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each
    // array in arrays
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const halfHeight = 8;
    const halfWidth = halfHeight * aspect;
    const projection = m4.ortho(
      -halfWidth, halfWidth,
      -halfHeight, halfHeight,
      -2, 2);
    const modelView = m4.identity();
    m4.rotateX(modelView, Math.PI * .5, modelView);

    gl.useProgram(programInfo.program);

    // calls gl.bindbuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    // for each attribute
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
    twgl.setUniforms(programInfo, {
      projection,
      modelView,
      numLevels: 8,
      lightDirection: v3.normalize([1, 2, 3]),
    });

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

    function hsla(h, s, l, a) {
      ctx.fillStyle = `hsla(${h * 360 | 0},${s * 100 | 0}%,${l * 100 | 0}%,${a})`;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data;
    }

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


2. Render in 1 channel, use a lookup table

   In this case you'd make an Nx1 texture with your N colors. Then in your shader you'd just compute a gray scale (it's not clear how you're coloring things now) and use that to look up a color from your texture

        uniform sampler2D lookupTable;  // Nx1 texture set to nearest filtering

        float gray = whateverYourDoingNow();
        vec4 color = texture2D(lookupTable, vec2((gray, 0.5);
   
        // apply lighting to color
        ...

Example:
    

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const m4 = twgl.m4;
    const v3 = twgl.v3;

    const vs = `
      attribute vec4 position;
      attribute vec3 normal;
      
      // note: there is no reason this has to come from an attrbute (per vertex)
      // it could just as easily come from a texture used in the fragment shader
      // for more resolution

      attribute float hotness;  // the data value 0 to 1
      
      uniform mat4 projection;
      uniform mat4 modelView;
      
      varying vec3 v_normal;
      varying float v_hotness;
      
      void main () {
        gl_Position = projection * modelView * position;
        v_normal = mat3(modelView) * normal;
        v_hotness = hotness;
      }
      `;
      const fs = `
      precision mediump float;
      
      varying vec3 v_normal;
      varying float v_hotness;
      
      uniform float numColors;
      uniform sampler2D lookupTable;
      uniform vec3 lightDirection;
      
      void main() {
        vec4 color = texture2D(lookupTable, vec2(v_hotness, 0.5));
        
        // fake light
        float light = dot(normalize(v_normal), lightDirection) * .5 + .5;
        
        gl_FragColor = vec4(color.rgb * light, color.a);
      }
      `;
      
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      
      const radius = 5;
      const thickness = 2;
      const radialDivisions = 32;
      const bodyDivisions = 12;
      // creates positions, normals, etc...
      const arrays = twgl.primitives.createTorusVertices(
          radius, thickness, radialDivisions, bodyDivisions);
          
      // add a hotness value, 0 <-> 1, for each vertex
      const numVerts = arrays.position.length / 3;
      const hotness = [];
      for (let i = 0; i < numVerts; ++i) {
        const pos = arrays.position.subarray(i * 3, i * 3 + 3);
        const dist = v3.distance([3, 1, 3 + Math.sin(pos[0])], pos);
        hotness[i] = clamp(dist / 10, 0, 1);
      }
      arrays.hotness = {
        numComponents: 1,
        data: hotness,
      };

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each
      // array in arrays
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
      
      const colors = [
         255,   0,   0, 255,  // red
         255, 150,  30, 255,  // orange
         255, 255,   0, 255,  // yellow
           0, 210,   0, 255,  // green
           0, 255, 255, 255,  // cyan
           0,   0, 255, 255,  // blue
         160,  30, 255, 255,  // purple
         255,   0, 255, 255,  // magenta
      ];
      // calls gl.createTexture, gl.texImage2D, gl.texParameteri
      const lookupTableTexture = twgl.createTexture(gl, {
        src: colors,
        width: colors.length / 4,
        wrap: gl.CLAMP_TO_EDGE,
        minMag: gl.NEAREST,   // comment this line out to see non hard edges
      });
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const halfHeight = 8;
      const halfWidth = halfHeight * aspect;
      const projection = m4.ortho(
        -halfWidth, halfWidth,
        -halfHeight, halfHeight,
        -2, 2);
      const modelView = m4.identity();
      m4.rotateX(modelView, Math.PI * .5, modelView);
      
      gl.useProgram(programInfo.program);

      // calls gl.bindbuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      // for each attribute
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
        lookupTable: lookupTableTexture,
        lightDirection: v3.normalize([1, 2, 3]),
      });
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);
      
      
      function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
      }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


