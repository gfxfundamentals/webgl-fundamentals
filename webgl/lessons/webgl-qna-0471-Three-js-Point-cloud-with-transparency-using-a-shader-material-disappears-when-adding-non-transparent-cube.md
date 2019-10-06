Title: Three.js Point cloud with transparency using a shader material disappears when adding non transparent cube
Description:
TOC: qna

# Question:

The behavior happens only on firefox. (I use the developper edition).

I have some point clouds which need to use a shader with transparency activated.

When I add a CubeGeometry to the scene without transparency it makes the point cloud disappear.

I also noted that using a point cloud with a PointMaterial works as intended, but in my program I need to use shaders.

If you use shaderMaterial on the cube in this part of the code:

     mesh = new THREE.Mesh(geometry, material);
     //mesh = new THREE.Mesh(geometry, shaderMaterial);

The cloud appears correctly as well, but of course I need a non transparent cube with some other material than the shader of the cloud.

I'm using three.js r74

Thank you for your help!

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var $ = document.querySelector.bind(document);
    var camera, scene, renderer, geometry, material, mesh;

    init();
    animate();

    function init() {

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 500;
      scene.add(camera);

      var pointMaterial = new THREE.PointsMaterial();

      var vShader = $('#vertexshader');
      var fShader = $('#fragmentshader');
      var shaderMaterial =
          new THREE.ShaderMaterial({
            vertexShader:   vShader.text,
            fragmentShader: fShader.text
          });

      shaderMaterial.transparent = true;
      shaderMaterial.vertexColors = THREE.VertexColors;
      shaderMaterial.depthWrite = true;

      geometry = new THREE.Geometry(); 

      particleCount = 20000;

      for (i = 0; i < particleCount; i++) {

        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 2000 - 1000;
        vertex.y = Math.random() * 2000 - 1000;
        vertex.z = Math.random() * 2000 - 1000;

        geometry.vertices.push(vertex);
      }

      parameters = [
        [
          [1, 1, 0.5], 5
        ],
        [
          [0.95, 1, 0.5], 4
        ],
        [
          [0.90, 1, 0.5], 3
        ],
        [
          [0.85, 1, 0.5], 2
        ],
        [
          [0.80, 1, 0.5], 1
        ]
      ];
      parameterCount = parameters.length;

      for (i = 0; i < parameterCount; i++) {

        color = parameters[i][0];
        size = parameters[i][1];

        //If we use pointMaterial instead of ShaderMaterial the cloud is visible
        particles = new THREE.Points(geometry, shaderMaterial);
        particles.sizeAttenuation = true;
        particles.sortParticles = true;
        particles.colorsNeedUpdate = true;
        particles.scale.set(1, 1, 1);

        particles.rotation.x = Math.random() * 6;
        particles.rotation.y = Math.random() * 6;
        particles.rotation.z = Math.random() * 6;

        scene.add(particles);
      }

      geometry = new THREE.CubeGeometry(200, 200, 200);

      //POINT CLOUD DISAPPEARS WHEN USING NON TRANSPARENT MATERIAL
      material = new THREE.MeshBasicMaterial({color: 0x00ff00});

      mesh = new THREE.Mesh(geometry, material);
      //mesh = new THREE.Mesh(geometry, shaderMaterial);

      scene.add(mesh);

      renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);

      document.body.appendChild(renderer.domElement);

    }

    function animate() {
      requestAnimationFrame(animate);
      render();
    }

    function render() {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;

      renderer.render(scene, camera);
    }

<!-- language: lang-html -->

    <script type="x-shader/x-vertex" id="vertexshader">

    void main()
    {
      gl_PointSize = 5.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }

    </script>

    <script type="x-shader/x-fragment" id="fragmentshader">

    precision highp float;

    void main()
    {
      gl_FragColor  = vec4(1.0,0.0,1.0,1.0);
    }

    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.js"></script>

<!-- end snippet -->



# Answer

It's not clear what effect you're trying to achieve

Do you want to see the points inside to cube? 

Your shader is returning opaque purple

     gl_FragColor = vec4(1.0,0.0,1.0,1.0);

So your particles will not be transparent regardless of the `transparent` setting on the material.

Your cube is Non-Transparent so of course the points inside the cube disappear. That's the definition of *non-transparent*. 

Setting the cube to transparent won't fix the issue either. Dealing with transparency is hard. You generally need to draw things front to back. To do that three.js needs every object to be able to be drawn separately so it can first draw all the particles behind the cube, then the back of the cube, then the particles inside the cube, then the front of the cube, then the particles in front of the cube.

To do that requires you split the cube into 6 planes and put every particle in it's own scene object.

There are ways to fake it. Turning off depthTest can sometimes be used as a substitute but it won't be totally correct.




