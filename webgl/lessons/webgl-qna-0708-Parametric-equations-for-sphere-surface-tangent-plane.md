Title: Parametric equations for sphere surface tangent plane
Description:
TOC: qna

# Question:

Excuse my first post, it is literally that. I've been banging my head for three days trying to get squares to align properly on a sphere. Does anyone know the **parametric equations for the tangents of a plane**? See tangents X, Y and Z in  the code below...

[Here is the output for reference. My stupid face is there, as a bonus, for you all to hate on][1]

[1]: https://i.stack.imgur.com/lKzFn.png

The code is a part of a much larger library on multiple pages. It is kind of a distraction from the question. I have scoured math sites and StackOverflow for the answer.  I am baking the positional and rotational data into Float32 arrays before sending it to the renderer. So, lookAt and other THREE and WebGL functions won't work. I need the pure math solution.  

    this.sphere = function()
    {
        var args = arguments[ 0 ];
        var offsets = offset( args.parameters.offsets );
        var arrays =
        {
            unique: [],
            position: [],
            rotation: []
        };
        var phi, theta;
        var x, y, z;
        var tangentX, tangentY, tangentZ;
        var pos = [];
        var d360 = Math.PI * 2;
        var d180 = Math.PI;
        var d90 = Math.PI / 2;
        var cap = false;

        for ( var p = 0; p <= args.parameters.stacks; p++ )
        {
            // stacks
            phi = d180 * p / args.parameters.stacks;

            for ( var t = 0; t < args.parameters.slices; t++ )
            {
                var predicate = true;

                // slices
                theta = d360 * t / args.parameters.slices;

                x = precision( Math.cos( theta ) * Math.sin( phi ), 3 ) * args.parameters.scale.x + offsets.position.x;
                y = precision( Math.cos( phi ), 3 )                     * args.parameters.scale.y + offsets.position.y;
                z = precision( Math.sin( theta ) * Math.sin( phi ), 3 ) * args.parameters.scale.z + offsets.position.z;

                pos = [ x, y, z ];

                // caps - both sin and cos are 0
                cap = !( precision( Math.sin( phi ), 0 ) || precision( Math.cos( theta ), 0 ) );

                /* This is my problem area ************************************/
                tangentX = - Math.sign( Math.sin( theta ) ) * Math.tan( y );
                tangentY = d90 - theta;
                tangentZ = 0;

                //if ( predicate ) console.log( p, t, degrees( theta ), degrees( tangentY ), Math.sign( Math.sin( phi ) ) );

                // add only once
                if ( !hash( arrays.unique, pos ) && predicate )
                {
                    arrays.unique.push( pos );

                    arrays.position.push( x, y, z );
                    arrays.rotation.push( tangentX, tangentY, tangentZ );
                }
            }
        }

        return { position: new Float32Array( arrays.position ), rotation: new Float32Array( arrays.rotation ) };
    };


  

# Answer

The easiest way to put cubes on a sphere is to use a good `lookAt` function, one that returns a world matrix not an inverse world matrix (although if you have one that returns an inverse world matrix you can invert it to get a world matrix)

Just pick a point on the sphere then call

    const positionOnSphere = (pick a point on the sphere)
    const target = [0, 0, 0];  // look at the center of the sphere
    const up = [0, 1, 0];      // will work as long as you're not putting 
                               // sphere at the exact poles
    const worldMatrix = yourMathLibsLookAtFunction(positionOnSphere, target, up);

Or

    const invMatrix = yourMathLibsInverseLookAtFunction(positionOnSphere, target, up);
    const worldMatrix = yourMathLibsInverseFunction(invMatrix);


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    twgl.setDefaults({attribPrefix: "a_"});
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = twgl.getWebGLContext(document.getElementById("c"));
    const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

    // adapted from http://stackoverflow.com/a/26127012/128511
    function fibonacciSphere(samples, i) {
      const rnd = 1.;  
      const offset = 2. / samples;
      const increment = Math.PI * (3. - Math.sqrt(5.));

      //  for i in range(samples):
      const y = ((i * offset) - 1.) + (offset / 2.);
      const r = Math.sqrt(1. - Math.pow(y ,2.));

      const phi = ((i + rnd) % samples) * increment;

      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      return [x, y, z];
    }

    // Shared values
    const lightWorldPosition = [1, 8, -10];
    const lightColor = [1, 1, 1, 1];
    const camera = m4.identity();
    const view = m4.identity();
    const viewProjection = m4.identity();

    const objects = [];
    const drawObjects = [];
    const numObjects = 100;
    for (var ii = 0; ii < numObjects; ++ii) {

      const position = v3.mulScalar(fibonacciSphere(numObjects, ii + 1), 10);
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      
      const world = m4.lookAt(position, target, up);
      m4.scale(world, [1, 1, 0.1], world);

      const uniforms = {
        u_lightWorldPos: lightWorldPosition,
        u_lightColor: lightColor,
        u_diffuseColor: [1, ii / numObjects, 0, 1],
        u_specular: [1, 1, 1, 1],
        u_shininess: 50,
        u_specularFactor: 1,
        u_viewInverse: camera,
        u_world: world,
        u_worldInverseTranspose: m4.identity(),
        u_worldViewProjection: m4.identity(),
      };
      drawObjects.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: uniforms,
      });
      objects.push({
        uniforms: uniforms,
      });
    }

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
      const radius = 25;
      const eye = [Math.cos(time) * radius, Math.sin(time * 0.3) * radius, Math.sin(time) * radius];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      m4.lookAt(eye, target, up, camera);
      m4.inverse(camera, view);
      m4.multiply(projection, view, viewProjection);

      objects.forEach(function(obj) {
        const uni = obj.uniforms;
        const world = uni.u_world;
        m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
      });

      twgl.drawObjectList(gl, drawObjects);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body {
        margin: 0;
    }
    canvas {
        display: block;
        width: 100vw;
        height: 100vh;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;
    uniform vec3 u_lightWorldPos;
    uniform mat4 u_world;
    uniform mat4 u_viewInverse;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    void main() {
      v_texCoord = a_texcoord;
      v_position = (u_worldViewProjection * a_position);
      v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
      v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
      v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
      gl_Position = v_position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    uniform vec4 u_lightColor;
    uniform vec4 u_diffuseColor;
    uniform vec4 u_specular;
    uniform float u_shininess;
    uniform float u_specularFactor;

    vec4 lit(float l ,float h, float m) {
      return vec4(1.0,
                  abs(l),//max(l, 0.0),
                  (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                  1.0);
    }

    void main() {
      vec3 a_normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      vec3 surfaceToView = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLight + surfaceToView);
      vec4 litR = lit(dot(a_normal, surfaceToLight),
                        dot(a_normal, halfVector), u_shininess);
      vec4 outColor = vec4((
      u_lightColor * (u_diffuseColor * litR.y +
                    u_specular * litR.z * u_specularFactor)).rgb,
          u_diffuseColor.a);
      gl_FragColor = outColor;
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->


