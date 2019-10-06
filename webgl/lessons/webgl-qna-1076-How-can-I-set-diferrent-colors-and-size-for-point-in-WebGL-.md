Title: How can I set diferrent colors and size for point in WebGL?
Description:
TOC: qna

# Question:

I did this using `webgl`. I wonder if it is possible to set the dots with different transparency and different sizes? How can this be done?


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <canvas id="particle"></canvas>
    <canvas id="canvas"></canvas>

<!-- language: lang-css -->
    
    body {
      margin: 0;
    }
    canvas {
      display: block;
    }
    
    #particle {
      background-image:url(https://i.imgur.com/HiAlf85.jpg);
    }
    #canvas {
      position: absolute;
      left: 0;
      top: 0;
    }

<!-- language: lang-js -->
    
    'use strict';
    (function() {
    let vertices = [];
    let gl = particle.getContext('webgl');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    
    resize();
    
    function resize() {
      
      particle.width = innerWidth;
      particle.height = innerHeight;
      
      let step = 10,
          w = Math.floor(particle.width/step), 
          h = Math.floor(particle.height/step);
      
      vertices = [];
      for (var x=0; x<w*100; x++) 
        for (var y=0; y<12; y++) 
          vertices.push(1/w + x*6/w - 2, 1/h + y/h)
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }
    
    let pid = gl.createProgram();
    
    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 
        
     float rand(float n) {
        return fract(sin(n) * 4358.5453123);
      }

      float noise(float p) {
        float fl = floor(p);
        float fc = fract(p);
        return mix(rand(fl), rand(fl + 1.0), fc);
      }
    
      mat3 rotateX(float a) {
        return mat3(vec3( 1.0,     -1.0,    0.0), 
                    vec3( -1.0,  cos(a), -sin(a)),
                    vec3( 2.0,  sin(a),  cos(a)));
      }
      
      mat3 rotateY(float a){
        return mat3(vec3( cos(a), 0.0, sin(a)), 
                    vec3(    0.0, 1.0,    0.0),
                    vec3(-sin(a), 0.0, cos(a)));
      }
    
      mat3 rotateZ(float a){
        return mat3(vec3( cos(a), -sin(a),  0.0), 
                    vec3( sin(a),  cos(a),  0.0),
                    vec3(    0.0,     0.0,  1.0));
      }
      
      void main(void) {    
        vec2 p = v;
        p.y += sin(p.x*4.)*noise(time/1000.);
        p.x += sin(time/14. + p.y);
        vec3 pos = vec3(p.xy, 1.)*rotateX(p.x*4. + time);
        pos.y += sin(pos.x*2.);
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 3.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(0.03, 0.54, 0.04);
      }
    `, gl.VERTEX_SHADER);
    
    shader(`
      precision highp float;
      varying vec3 c;
      void main(void) {
          gl_FragColor = vec4(c, 1.);  
      }
    `, gl.FRAGMENT_SHADER);
    gl.linkProgram(pid);
    gl.useProgram(pid);
    
    let v = gl.getAttribLocation(pid, "v");
    gl.vertexAttribPointer(v, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(v);
    
    let timeUniform = gl.getUniformLocation(pid, 'time');
    
    
    requestAnimationFrame(draw);
    addEventListener('resize', resize)
    
    function draw(t) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0.5);
      gl.uniform1f(timeUniform, t/1000);
      gl.drawArrays(gl.POINTS, 0, vertices.length/2);
    
      requestAnimationFrame(draw);
    }
    
    function shader(src, type) {
      let sid = gl.createShader(type);
      gl.shaderSource(sid, src);
      gl.compileShader(sid);
      var message = gl.getShaderInfoLog(sid);
      gl.attachShader(pid, sid);
      if (message.length > 0) {
        console.log(src.split("\n")
                       .map((str, i) => (""+(1+i))
                       .padStart(4, "0")+": "+str)
                       .join("\n"));
        throw message;
      }
    }
    }());

<!-- end snippet -->

# Answer

You pass in more attributes.

Right now you're passing in a position for each point. 

```
attribute vec2 v; 
```

Also pass in a color and a size

```
attribute vec2 v; 
attribute vec4 color;
attribute float size;
```

Fill out buffers with the per point color and per point size.

As for transparency you need to enable blending `gl.enable(gl.BLEND)` and you need to set the blending function `gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)` then set `gl_FragColor` to a premultipiled alpha color.





<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';
    (function() {
      let positions = [];
      let colors = [];
      let sizes = [];
      const gl = particle.getContext('webgl');
      const positionBuffer = gl.createBuffer();
      const sizeBuffer = gl.createBuffer();
      const colorBuffer = gl.createBuffer();

      resize();

      function resize() {

        particle.width = innerWidth;
        particle.height = innerHeight;

        let step = 10,
          w = Math.floor(particle.width / step),
          h = Math.floor(particle.height / step);

        positions = [];
        colors = [];
        sizes = [];
        for (var x = 0; x < w * 100; x++) {
          for (var y = 0; y < 12; y++) {
            positions.push(1 / w + x * 6 / w - 2, 1 / h + y / h);
            const color = [Math.random(), y / 12, 0, y / 12];
            // pre-multiply alpha (could do this in shader)
            color[0] *= color[3];
            color[1] *= color[3];
            color[2] *= color[3];
            colors.push(...color);
            
            sizes.push(10 + y * 2);
          }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
      }

      let pid = gl.createProgram();

      shader(`
      attribute vec2 position;
      attribute vec4 color;
      attribute float size;
      uniform float time; 
      varying vec4 c; 
        
     float rand(float n) {
        return fract(sin(n) * 4358.5453123);
      }

      float noise(float p) {
        float fl = floor(p);
        float fc = fract(p);
        return mix(rand(fl), rand(fl + 1.0), fc);
      }

      mat3 rotateX(float a) {
        return mat3(vec3( 1.0,     -1.0,    0.0), 
                    vec3( -1.0,  cos(a), -sin(a)),
                    vec3( 2.0,  sin(a),  cos(a)));
      }
      
      mat3 rotateY(float a){
        return mat3(vec3( cos(a), 0.0, sin(a)), 
                    vec3(    0.0, 1.0,    0.0),
                    vec3(-sin(a), 0.0, cos(a)));
      }

      mat3 rotateZ(float a){
        return mat3(vec3( cos(a), -sin(a),  0.0), 
                    vec3( sin(a),  cos(a),  0.0),
                    vec3(    0.0,     0.0,  1.0));
      }
      
      void main(void) {    
        vec2 p = position;
        p.y += sin(p.x*4.)*noise(time/1000.);
        p.x += sin(time/14. + p.y);
        vec3 pos = vec3(p.xy, 1.)*rotateX(p.x*4. + time);
        pos.y += sin(pos.x*2.);
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = size;
        gl_Position.z = 0.0;
        c=color;
      }
    `, gl.VERTEX_SHADER);

      shader(`
      precision highp float;
      varying vec4 c;
      void main(void) {
          gl_FragColor = c;  
      }
    `, gl.FRAGMENT_SHADER);
      gl.linkProgram(pid);
      gl.useProgram(pid);

      // this code really belongs in your render loop. 
      {
        let v = gl.getAttribLocation(pid, "position");
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(v, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(v);

        let sizeLoc = gl.getAttribLocation(pid, "size");
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(sizeLoc);

        let colorLoc = gl.getAttribLocation(pid, "color");
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);
      }
      
      let timeUniform = gl.getUniformLocation(pid, 'time');


      requestAnimationFrame(draw);
      addEventListener('resize', resize)

      function draw(t) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 0.5);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(timeUniform, t / 1000);
        gl.drawArrays(gl.POINTS, 0, positions.length / 2);

        requestAnimationFrame(draw);
      }

      function shader(src, type) {
        let sid = gl.createShader(type);
        gl.shaderSource(sid, src);
        gl.compileShader(sid);
        var message = gl.getShaderInfoLog(sid);
        gl.attachShader(pid, sid);
        if (message.length > 0) {
          console.log(src.split("\n")
            .map((str, i) => ("" + (1 + i))
              .padStart(4, "0") + ": " + str)
            .join("\n"));
          throw message;
        }
      }
    }());

<!-- language: lang-css -->

    body {
      margin: 0;
    }

    canvas {
      display: block;
    }

    #particle {
      background-image: url(https://i.imgur.com/HiAlf85.jpg);
    }

    #canvas {
      position: absolute;
      left: 0;
      top: 0;
    }

<!-- language: lang-html -->

    <canvas id="particle"></canvas>

<!-- end snippet -->



Of course you don't have to use attributes. You can compute colors and/or sizes via some formula or whatever.

Let me note this is a fairly basic WebGL question so you might want to [read some articles on WebGL](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)
