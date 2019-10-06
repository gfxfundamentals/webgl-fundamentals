Title: Combine two canvas. Put the first on the second
Description:
TOC: qna

# Question:

I'm trying to do something like this abstraction. 

https://www.ciklum.com

As I understand it, need to combine the two `canvas`, put them on top of each other. But how to do it all?

Here I have two implementations, for example.
First

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-html -->

    <canvas id="particle" />
    
    <style>
        canvas {
            background-image:url(https://i.imgur.com/HiAlf85.jpg);
        }
    </style>
    
<!-- language: lang-js -->

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
      for (var x=0; x<w*3; x++) 
        for (var y=0; y<10; y++) 
          vertices.push(1/w + x*10/w - 5, 1/h + y*2/h - 1)
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }
    
    let pid = gl.createProgram();
    
    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 
    
      mat3 rotateX(float a) {
        return mat3(vec3( 1.0,     0.0,    0.0), 
                    vec3( -1.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1.0, 0.5, 0.0);
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
      gl.clearColor(0, 0, 0, 0);
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

<!-- end snippet -->

Second

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-html -->

    <canvas id="canvas" />
    
    <style>
        canvas {
        background-image:url(https://i.imgur.com/HiAlf85.jpg);
    }
    </style>

<!-- language: lang-js -->

    let vertices = [];
    let gl = canvas.getContext('webgl');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    
    resize();
    
    function resize() {
      
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      
      let step = 10,
          w = Math.floor(canvas.width/step), 
          h = Math.floor(canvas.height/step);
      
      vertices = [];
      for (var x=0; x<w*3; x++) 
        for (var y=0; y<10; y++) 
          vertices.push(1/w + x*10/w - 5, 1/h + y*2/h - 1)
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }
    
    let pid = gl.createProgram();
    
    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 
    
      mat3 rotateX(float a) {
        return mat3(vec3( -1.0,     -1.0,    0.0), 
                    vec3( 0.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1., 0., 0.);
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
      gl.clearColor(0, 0, 0, 0);
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

<!-- end snippet -->

Tell me how to combine them?

# Answer

You need to set your CSS so the 2 canvases overlap and remove the background from the top canvas

```
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
```

Further, you need to figure out how to merge your 2 snippets. Just as a quick hack I surrounded both in their own functions so the variables don't conflict but that means a bunch of code is duplicated.

The final thing is a self closing canvas as in `<canvas />` is illegal HTML. You're required to use an actual closing tag as in `<canvas></canvas>`. 

You can see this by inspecting 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <canvas />
    <canvas />

<!-- end snippet -->

in the browser's devtools

[![enter image description here][1]][1]

Notice one canvas is inside the other instead of them being separate. That's because the `/>` didn't actually end the canvas tag. Canvas tags don't display any HTML inside so the inner canvas is not displayed.

<!-- begin snippet: js hide: false console: true babel: false -->

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
      for (var x=0; x<w*3; x++) 
        for (var y=0; y<10; y++) 
          vertices.push(1/w + x*10/w - 5, 1/h + y*2/h - 1)

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    let pid = gl.createProgram();

    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 

      mat3 rotateX(float a) {
        return mat3(vec3( 1.0,     0.0,    0.0), 
                    vec3( -1.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1.0, 0.5, 0.0);
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
      gl.clearColor(0, 0, 0, 0);
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

    // ----------------------

    (function() {
    let vertices = [];
    let gl = canvas.getContext('webgl');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

    resize();

    function resize() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      
      let step = 10,
          w = Math.floor(canvas.width/step), 
          h = Math.floor(canvas.height/step);
      
      vertices = [];
      for (var x=0; x<w*3; x++) 
        for (var y=0; y<10; y++) 
          vertices.push(1/w + x*10/w - 5, 1/h + y*2/h - 1)

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    let pid = gl.createProgram();

    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 

      mat3 rotateX(float a) {
        return mat3(vec3( -1.0,     -1.0,    0.0), 
                    vec3( 0.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1., 0., 0.);
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
      gl.clearColor(0, 0, 0, 0);
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

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      display: block;
    }

    #particle {
      background-image:url(https://i.imgur.com/HiAlf85.jpg);
      background-size: cover;
    }
    #canvas {
      position: absolute;
      left: 0;
      top: 0;
    }

<!-- language: lang-html -->

    <canvas id="particle"></canvas>
    <canvas id="canvas"></canvas>

<!-- end snippet -->

Of course it's not clear why you'd want to do this. Things would likely be faster to use 1 canvas but I'll assume you have your reasons.


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';
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
      for (var x=0; x<w*3; x++) 
        for (var y=0; y<10; y++) 
          vertices.push(1/w + x*10/w - 5, 1/h + y*2/h - 1)    

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }

    let pid1 = createProgram(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 

      mat3 rotateX(float a) {
        return mat3(vec3( 1.0,     0.0,    0.0), 
                    vec3( -1.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1.0, 0.5, 0.0);
      }
    `,
    `
      precision highp float;
      varying vec3 c;
      void main(void) {
          gl_FragColor = vec4(c, 1.);  
      }
    `);

    let pid2 = createProgram(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 

      mat3 rotateX(float a) {
        return mat3(vec3( -1.0,     -1.0,    0.0), 
                    vec3( 0.0,  cos(a), -sin(a)),
                    vec3( 0.0,  sin(a),  cos(a)));
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
        p.y += 0.3;
        p.x += sin(time/4. + p.y);
        vec3 pos = vec3(p.xy, 0.0)*rotateX(p.x*3. + time);
        //pos.y += sin(pos.x) - sin(time/5.)*0.5 + cos(pos.y/3.1415)*0.5;
        gl_Position = vec4(pos, 1.);
        
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(1., 0., 0.);
      }
    `, `
      precision highp float;
      varying vec3 c;
      void main(void) {
          gl_FragColor = vec4(c, 1.);  
      }
    `);

    let v1 = gl.getAttribLocation(pid1, "v");
    let timeUniform1 = gl.getUniformLocation(pid1, 'time');

    let v2 = gl.getAttribLocation(pid2, "v");
    let timeUniform2 = gl.getUniformLocation(pid2, 'time');

    requestAnimationFrame(draw);
    addEventListener('resize', resize)

    function draw(t) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      
      gl.useProgram(pid1);
      // normally you'd bind a buffer here but since you only
      // have one and the vertex data is the same for both programs
      // we don't need to bind a different buffer
      gl.vertexAttribPointer(v1, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(v1);   
      gl.uniform1f(timeUniform1, t/1000);
      gl.drawArrays(gl.POINTS, 0, vertices.length/2);
      
      gl.useProgram(pid2);
      gl.vertexAttribPointer(v2, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(v2);   
      gl.uniform1f(timeUniform2, t/1000);
      gl.drawArrays(gl.POINTS, 0, vertices.length/2);

      requestAnimationFrame(draw);
    }

    function createProgram(vs, fs) {
      const pid = gl.createProgram();
      shader(vs, gl.VERTEX_SHADER, pid);
      shader(fs, gl.FRAGMENT_SHADER, pid);
      gl.linkProgram(pid);
      // should check for link error here!
      return pid;
    }

    function shader(src, type, pid) {
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

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      display: block;
    }
    #particle {
      background-image:url(https://i.imgur.com/HiAlf85.jpg);
      background-size: cover;
    }

<!-- language: lang-html -->

    <canvas id="particle"></canvas>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/1Mn0k.png
