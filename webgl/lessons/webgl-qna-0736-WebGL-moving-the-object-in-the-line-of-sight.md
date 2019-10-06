Title: WebGL-moving the object in the line of sight
Description:
TOC: qna

# Question:

I defined my Model-View Matrix defining a function lookAt that represents the eye of the camera, the position of the object that I'm representing and the "up" vector of the camera. How can I move the object in the line of sight of the camera? Any tips? If I define the vector that points to the position of the object and starts at the eye of the camera (so if I define the line of sight) how can I use this to make the object move along this direction?

This is my lookAt function

  

      function lookAt( eye, at, up )
    {
        if ( !Array.isArray(eye) || eye.length != 3) {
            throw "lookAt(): first parameter [eye] must be an a vec3";
        }
    
        if ( !Array.isArray(at) || at.length != 3) {
            throw "lookAt(): first parameter [at] must be an a vec3";
        }
    
        if ( !Array.isArray(up) || up.length != 3) {
            throw "lookAt(): first parameter [up] must be an a vec3";
        }
    
        if ( equal(eye, at) ) {
            return mat4();
        }
    
        var v = normalize( subtract(at, eye) );  // view direction vector
        var n = normalize( cross(v, up) );       // perpendicular vector
        var u = normalize( cross(n, v) );        // "new" up vector
    
        v = negate( v );
    
        var result = mat4(
            vec4( n, -dot(n, eye) ),
            vec4( u, -dot(u, eye) ),
            vec4( v, -dot(v, eye) ),
            vec4()
        );
    
        return result;
    }



# Answer

Honestly I don't understand you're lookAt function. It's not setting a translation like most look at functions.

Here's a different lookAt function that generates a camera matrix,a matrix that positions the camera in the world. That's in contrast to a lookAt function that generates a view matrix, a matrix that moves everything in the world in front of the camera.

    function lookAt(eye, target, up) {
      const zAxis = v3.normalize(v3.subtract(eye, target));
      const xAxis = v3.normalize(v3.cross(up, zAxis));
      const yAxis = v3.normalize(v3.cross(zAxis, xAxis));

      return [
        ...xAxis, 0,
        ...yAxis, 0,
        ...zAxis, 0,
        ...eye, 1,
      ];
    }

Here's [an article with some detail about a lookAt matrix](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html).

I find camera matrices more useful can view matrixes because a camera matrix (or a lookAt matrix) and be used to make heads *look at* other things. Gun turrets *look at* targets, eyes *look at* interests,  where as a view matrix can pretty much only be used for one thing. You can get one from the other by taking the inverse. But since a scene with turrets, eyes, and heads of characters tracking things might need 50+ lookAt matrices it seems far more useful to generate that kind of matrix and take 1 inverse or a view matrix than to generate 50+ view matrices and have to invert all but 1 of them.

You can move any object relative to the way the camera is facing by taking an axis of the camera matrix and multiplying by some scalar. The xAxis will move left and right perpendicular to the camera, the yAxis up and down perpendicular to the camera, and the zAxis forward/backward in the direction the camera is facing.

The axis of the camera matrix are

    +----+----+----+----+
    | xx | xy | xz |    |  xaxis
    +----+----+----+----+
    | yx | yy | yz |    |  yaxis
    +----+----+----+----+
    | zx | zy | zz |    |  zaxis
    +----+----+----+----+
    | tx | ty | tz |    |  translation
    +----+----+----+----+

In other words

    const camera = lookAt(eye, target, up);
    const xaxis = camera.slice(0, 3);
    const yaxis = camera.slice(4, 7);
    const zaxis = camera.slice(8, 11);

Now you can translate forward or back with

    matrix = mult(matrix, zaxis);  // moves 1 unit away from camera

Multiply zaxis by the amount you want to move

    moveVec = [zaxis[0] * moveAmount, zaxis[1] * moveAmount, zaxis[2] * moveAmount];
    matrix = mult(matrix, moveVec);  // moves moveAmount units away from camera

Or if you have your translation stored elsewhere just add the zaxis in

    // assuming tx, ty, and tz are our translation
    tx += zaxis[0] * moveAmount;
    ty += zaxis[1] * moveAmount;
    tz += zaxis[2] * moveAmount;

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec4 v_position;
    varying vec2 v_texcoord;

    void main() {
      v_texcoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;


    "use strict";
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.getElementById("c").getContext("webgl");

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for positions, texcoords
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const tex = twgl.createTexture(gl, {
      min: gl.NEAREST,
      mag: gl.NEAREST,
      src: [
        255, 64, 64, 255,
        64, 192, 64, 255,
        64, 64, 255, 255,
        255, 224, 64, 255,
      ],
    });

    const settings = {
      xoff: 0,
      yoff: 0,
      zoff: 0,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fov = 45 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.01;
      const zFar = 100;
      const projection = m4.perspective(fov, aspect, zNear, zFar);

      const eye = [3, 4, -6];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);

      gl.useProgram(programInfo.program);

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      const t = time * .1;
      for (let z = -1; z <= 1; ++z) {
        for (let x = -1; x <= 1; ++x) {
          const world = m4.identity();
          m4.translate(world, v3.mulScalar(camera.slice(0, 3), settings.xoff), world);
          m4.translate(world, v3.mulScalar(camera.slice(4, 7), settings.yoff), world);
          m4.translate(world, v3.mulScalar(camera.slice(8, 11), settings.zoff), world);
          m4.translate(world, [x * 1.4, 0, z * 1.4], world);
          m4.rotateY(world, t + z + x, world);

          // calls gl.uniformXXX
          twgl.setUniforms(programInfo, {
            u_texture: tex,
            u_worldViewProjection: m4.multiply(viewProjection, world),
          });

          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    setupSlider("#xSlider", "#xoff", "xoff");
    setupSlider("#ySlider", "#yoff", "yoff");
    setupSlider("#zSlider", "#zoff", "zoff");

    function setupSlider(sliderId, labelId, property) {
      const slider = document.querySelector(sliderId);
      const label = document.querySelector(labelId);

      function updateLabel() {
        label.textContent = settings[property].toFixed(2);
      }

      slider.addEventListener('input', e => {
        settings[property] = (parseInt(slider.value) / 100 * 2 - 1) * 5;
        updateLabel();
      });

      updateLabel();
      slider.value = (settings[property] / 5 * .5 + .5) * 100;
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
      <div><input id="xSlider" type="range" min="0" max="100"/><label>xoff: <span id="xoff"></span></label></div>
      <div><input id="ySlider" type="range" min="0" max="100"/><label>yoff: <span id="yoff"></span></label></div>
      <div><input id="zSlider" type="range" min="0" max="100"/><label>zoff: <span id="zoff"></span></label></div>
    </div>

<!-- end snippet -->


