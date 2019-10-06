Title: Rotating around an object in a circle
Description:
TOC: qna

# Question:

I'm drawing a wind-turbine and I'm trying to figure out how I should draw the blades so they rotate around in a circle. Initially, I'm trying to draw one blade that rotates in a circle but I'm having a hard time understanding how to do it. All mine does is go till a certain angle and then comes back...here's my code : 

      var t = model_transform;
      model_transform = t;
      var temp = Math.PI/180;
      var degreeOfRot = 45;
      var time = Math.sin(graphics_state.animation_time/2000); //Represents the graphics time
      model_transform = mult(model_transform, translation(0,0,0));
      model_transform = mult(model_transform, rotation(degreeOfRot*time, 0.0,0.0,1.0));
      model_transform = mult(model_transform, scale(0.3,0.9,0));
      this.shapes.box.draw(graphics_state,model_transform,this.red);

I've been looking at other answers on stack and still haven't figured it out...I feel like its something to do with the math but not sure 

# Answer

I think you want something like (note: I'm using a unit cube centered around the origin so there's an extra scale to make it long and an extra translation to move the origin)

    // spread the blades round the circle
    const rotationOffset = i / settings.numBlades * Math.PI * 2;
  
    // rotate around Z
    world = m4.multiply(world, m4.rotationZ(rotationOffset + time));

    // move it away from center 
    world = m4.multiply(world, m4.translation([settings.xoff, settings.yoff, 0]));

    // scale the unit cube to be long in Y
    world = m4.multiply(world, m4.scaling([1, 10, 1]));

    // the unit cube is centered around the origin. It's 1 unit big
    // so this tranlation will move it's origin to the bottom left edge
    world = m4.multiply(world, m4.translation([-.5, .5, 0]));

You might find [this article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) helpful and maybe [this one](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html) or [this one](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html)


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;

    void main() {
      gl_Position = u_worldViewProjection * position;
    }
    `;
    const fs = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `;


    "use strict";
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.getElementById("c").getContext("webgl");

    const settings = {
      xoff: 0,
      yoff: 0,
      numBlades: 1,
    };

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for positions, texcoords
    const centerBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12);
    const bladeBufferInfo = twgl.primitives.createCubeBufferInfo(gl);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fov = 45 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.5;
      const zFar = 100;
      const projection = m4.perspective(fov, aspect, zNear, zFar);

      const eye = [0, 0, -40];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);

      gl.useProgram(programInfo.program);
      
      // draw center
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, centerBufferInfo);
      
      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, {
        u_color: [1, 0.5, 1, 1],
        u_worldViewProjection: m4.translate(viewProjection, [0, 0, 1]),
      });

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, centerBufferInfo);
      
      
      // draw blades

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bladeBufferInfo);

      for (let i = 0; i < settings.numBlades; ++i) {
        let world = m4.identity();
        
        // spread the blades round the circle
        const rotationOffset = i / settings.numBlades * Math.PI * 2;
      
        // rotate around Z
        world = m4.multiply(world, m4.rotationZ(rotationOffset + time));

        // move it away from center 
        world = m4.multiply(world, m4.translation([settings.xoff, settings.yoff, 0]));

        // scale the unit cube to be long in Y
        world = m4.multiply(world, m4.scaling([1, 10, 1]));

        // the unit cube is centered around the origin. It's 1 unit big
        // so this tranlation will move it's origin to the bottom left edge
        world = m4.multiply(world, m4.translation([-.5, .5, 0]));

        // calls gl.uniformXXX
        twgl.setUniforms(programInfo, {
          u_color: [1, 0, 0, 1],
          u_worldViewProjection: m4.multiply(viewProjection, world),
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bladeBufferInfo);
      }
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    setupSlider("#xoffSlider", "#xoff", "xoff", 10);
    setupSlider("#yoffSlider", "#yoff", "yoff", 10);
    setupSlider("#bladesSlider", "#blades", "numBlades", 1);

    function setupSlider(sliderId, labelId, property, divisor) {
      const slider = document.querySelector(sliderId);
      const label = document.querySelector(labelId);

      function updateLabel() {
        label.textContent = settings[property];
      }

      slider.addEventListener('input', e => {
        settings[property] = parseInt(slider.value) / divisor;
        updateLabel();
      });

      updateLabel();
      slider.value = settings[property];
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #ui { 
      position: absolute; 
      left: 10px; 
      top: 10px; 
      z-index: 2; 
      background: rgba(255, 255, 255, 0.9);
      padding: .5em;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas id="c"></canvas>
    <div id="ui">
      <div><input id="xoffSlider" type="range" min="0" max="100"/><label>xoff: <span id="xoff"></span></label></div>
      <div><input id="yoffSlider" type="range" min="0" max="100"/><label>yoff: <span id="yoff"></span></label></div>
      <div><input id="bladesSlider" type="range" min="1" max="20"/><label>blades: <span id="blades"></span></label></div>
    </div>

<!-- end snippet -->


