Title: Remove blue square in TWGL
Description:
TOC: qna

# Question:

My problem is that I'm using the TWGL library to make shaders with textures, it happens that when they load the images always appears a blue box before loading. I could not find anything about that problem or in the documentation, or even in other works.

How can I remove that blue box?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    class MathUtils {
      constructor() {}

      lerp(a, b, n) {
        return n * (b - a) + a;
      }
    }

    const main = () => {
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      const mathUtils = new MathUtils();
      const mouse = { x: 0, y: 0 };
      const lastmouse = [0, 0];
      if (!gl) {
        return;
      }
      
      const textures = [
        "https://i.ibb.co/9WvFgbZ/fancycrave-165873-unsplash.jpg",
        "https://i.ibb.co/NSfVqTq/map2.jpg",
        "https://i.ibb.co/cy79kN4/blur.jpg"
      ];
      const textLoaded = [];
      for (let tex of textures) {
        textLoaded.push(
          twgl.createTexture(gl, {
            src: tex,
            crossOrigin: ""
          })
        );
      }

      let originalImage = { width: 1, height: 1 }; // replaced after loading
      const text0 = twgl.createTexture(
        gl,
        {
          src: textures[0],
          crossOrigin: ""
        },
        (err, texture, source) => {
          originalImage = source;
        }
      );

      let uniforms = {};
      let anim = { value: 1 };
      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      const render = time => {
        time *= 0.001; // seconds

        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = originalImage.width / originalImage.height;
        let mat = m3.scaling(imageAspect / canvasAspect, -1);

        // this assumes we want to fill vertically
        let horizontalDrawAspect = imageAspect / canvasAspect;
        let verticalDrawAspect = -1;
        // does it fill horizontally?
        if (horizontalDrawAspect < 1) {
          // no it does not so scale so we fill horizontally and
          // adjust vertical to match
          verticalDrawAspect /= horizontalDrawAspect;
          horizontalDrawAspect = 1;
        }
        mat = m3.scaling(horizontalDrawAspect, verticalDrawAspect);

        uniforms = {
          u_text: textLoaded[0],
          u_map: textLoaded[1],
          u_blur: textLoaded[2],
          u_matrix: mat,
          u_time: time * 10,
          u_res: [gl.canvas.clientWidth, gl.canvas.clientHeight],
          u_mouse: lastmouse
        };

        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, uniforms);

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);

        lastmouse[0] = mathUtils.lerp(lastmouse[0], mouse.x, 0.1);
        lastmouse[1] = mathUtils.lerp(lastmouse[1], mouse.y, 0.1);

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
        mouse.x = -clientX / innerWidth;
        mouse.y = -clientY / innerHeight;
      });
    };

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script id="vs" type="f">
      attribute vec2 position;
      attribute vec2 texcoord;

      uniform mat3 u_matrix;

      varying vec2 v_texcoord;

      void main() {
         gl_Position = vec4(u_matrix * vec3(position, 1), 1);
         v_texcoord = texcoord;
      }
    </script>
    <script id="fs" type="f">
      precision mediump float;
      
      uniform vec2 u_mouse;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_dpi;
      uniform sampler2D u_text;
      uniform sampler2D u_map;
      uniform sampler2D u_blur;

      varying vec2 v_texcoord;
       
      void main(){
        float distAmount = .003;
          
        vec2 uv = v_texcoord; 
        vec2 parallax = u_mouse * 0.07;
        
        float freq = 70.0;
        float amp = 0.004;
        
        vec4 map = texture2D(u_map, uv);

        float dethMap = map.r - .5;
        float distMap = map.g;

        float x = uv.y * freq + u_time * 3.; 
        float y = uv.x * freq + u_time * .3;
        
        float distX = cos(x+y) * amp * cos(y);
        float distY = sin(x-y) * amp * cos(y);

        vec2 distPosition = vec2(uv.x + distX * distMap, uv.y + distY * distMap);
           
        vec2 turbulance = distPosition + (parallax * dethMap);
        
        vec4 ori_img = texture2D(u_text, turbulance);
        vec4 blur_img = texture2D(u_blur, turbulance);
            
        vec4 color = mix(ori_img, blur_img, length(distPosition) * distAmount);
        
        gl_FragColor = color;
      }  
    </script>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->



# Answer

I don't see any blue box

You can set the default color twgl uses to make textures immediately usable by calling

```
twgl.setDefaults({
  textureColor: [0, 0, 0, 0],  // make initial color transparent black
});
```

before loading textures.

You can set any individual texture's temporary initial color via the `color` option

```
const texture = twgl.createTexture(gl, {
  src: 'https://somedomain.com/path/to/someimage.jpg',
  color: [0, 0, 0, 0],  // make initial color transparent black
});
```

Also note you can load all images in one call to `twgl.createTextures` and that twgl should handle cross origin automatically 

```
  // replaced after loading
  let srcs = {
    text: { width: 1, height: 1 },
  };
  const textures = twgl.createTextures(gl, {
    text: {src: "https://i.ibb.co/9WvFgbZ/fancycrave-165873-unsplash.jpg" },
    map: {src: "https://i.ibb.co/NSfVqTq/map2.jpg" },
    blur: {src: "https://i.ibb.co/cy79kN4/blur.jpg" },
  }, (err, textures, sources) => {
    srcs = sources;
  });
```

```
const imageAspect = srcs.text.width / srcs.text.height;
```

```
        uniforms = {
          u_text: textures.text,
          u_map: textures.map,
          u_blur: textures.blur,
        ...
```
<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    class MathUtils {
      constructor() {}

      lerp(a, b, n) {
        return n * (b - a) + a;
      }
    }

    const main = () => {
      const canvas = document.getElementById("canvas");
      const gl = canvas.getContext("webgl");
      const mathUtils = new MathUtils();
      const mouse = { x: 0, y: 0 };
      const lastmouse = [0, 0];
      if (!gl) {
        return;
      }
      
      twgl.setDefaults({
        textureColor: [0, 0, 0, 0],
      });
      // replaced after loading
      let srcs = {
        text: { width: 1, height: 1 },
      };
      const textures = twgl.createTextures(gl, {
        text: {src: "https://i.ibb.co/9WvFgbZ/fancycrave-165873-unsplash.jpg" },
        map: {src: "https://i.ibb.co/NSfVqTq/map2.jpg" },
        blur: {src: "https://i.ibb.co/cy79kN4/blur.jpg" },
      }, (err, textures, sources) => {
        srcs = sources;
      });

      let uniforms = {};
      let anim = { value: 1 };
      // compile shaders, link program, lookup location
      const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for a quad
      const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

      const render = time => {
        time *= 0.001; // seconds

        twgl.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const imageAspect = srcs.text.width / srcs.text.height;
        let mat = m3.scaling(imageAspect / canvasAspect, -1);

        // this assumes we want to fill vertically
        let horizontalDrawAspect = imageAspect / canvasAspect;
        let verticalDrawAspect = -1;
        // does it fill horizontally?
        if (horizontalDrawAspect < 1) {
          // no it does not so scale so we fill horizontally and
          // adjust vertical to match
          verticalDrawAspect /= horizontalDrawAspect;
          horizontalDrawAspect = 1;
        }
        mat = m3.scaling(horizontalDrawAspect, verticalDrawAspect);

        uniforms = {
          u_text: textures.text,
          u_map: textures.map,
          u_blur: textures.blur,
          u_matrix: mat,
          u_time: time * 10,
          u_res: [gl.canvas.clientWidth, gl.canvas.clientHeight],
          u_mouse: lastmouse
        };

        // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
        twgl.setUniforms(programInfo, uniforms);

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);

        lastmouse[0] = mathUtils.lerp(lastmouse[0], mouse.x, 0.1);
        lastmouse[1] = mathUtils.lerp(lastmouse[1], mouse.y, 0.1);

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      canvas.addEventListener("mousemove", ({ clientX, clientY }) => {
        mouse.x = -clientX / innerWidth;
        mouse.y = -clientY / innerHeight;
      });
    };

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script id="vs" type="f">
      attribute vec2 position;
      attribute vec2 texcoord;

      uniform mat3 u_matrix;

      varying vec2 v_texcoord;

      void main() {
         gl_Position = vec4(u_matrix * vec3(position, 1), 1);
         v_texcoord = texcoord;
      }
    </script>
    <script id="fs" type="f">
      precision mediump float;
      
      uniform vec2 u_mouse;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_dpi;
      uniform sampler2D u_text;
      uniform sampler2D u_map;
      uniform sampler2D u_blur;

      varying vec2 v_texcoord;
       
      void main(){
        float distAmount = .003;
          
        vec2 uv = v_texcoord; 
        vec2 parallax = u_mouse * 0.07;
        
        float freq = 70.0;
        float amp = 0.004;
        
        vec4 map = texture2D(u_map, uv);

        float dethMap = map.r - .5;
        float distMap = map.g;

        float x = uv.y * freq + u_time * 3.; 
        float y = uv.x * freq + u_time * .3;
        
        float distX = cos(x+y) * amp * cos(y);
        float distY = sin(x-y) * amp * cos(y);

        vec2 distPosition = vec2(uv.x + distX * distMap, uv.y + distY * distMap);
           
        vec2 turbulance = distPosition + (parallax * dethMap);
        
        vec4 ori_img = texture2D(u_text, turbulance);
        vec4 blur_img = texture2D(u_blur, turbulance);
            
        vec4 color = mix(ori_img, blur_img, length(distPosition) * distAmount);
        
        gl_FragColor = color;
      }  
    </script>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->


