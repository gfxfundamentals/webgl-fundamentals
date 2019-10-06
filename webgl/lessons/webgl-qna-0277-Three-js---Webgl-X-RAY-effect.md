Title: Three.js / Webgl X-RAY effect
Description:
TOC: qna

# Question:

How to achieve an x-ray-style effect in three.js / webgl? Some sort of this

![enter image description here][1]

#UPD

I need real-time render with this stuff, not a still image. This can be done with shaders, that change density in non-linear way on overlaps based on distance. I briefly understand theory, but have no practice, that is why I need help with this

  [1]: http://i.stack.imgur.com/K36XV.jpg

# Answer

This is the as Владимир Корнилов's example except I changed the shader a little.

I'm not sure what he was going for with the `dot(vNormal, vNormel)`. Doing `abs(dot(vNormal, vec3(0, 0, 1))` will give you something that is brighter when facing toward or away from the view. Making it `1.0 - abs(dot(vNormal, vec3(0, 0, 1))` will flip that so perpendicular to the view is brighter. Then add the pow and it looks better to me but I guess that's subjective


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var human;

    var $ = document.querySelector.bind(document);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setClearColor(0x000000, 1.0);

    lookAt = scene.position;
    lookAt.y = 15;
    camera.lookAt(lookAt);

    document.body.appendChild(renderer.domElement);

    var customMaterial = new THREE.ShaderMaterial(
      {
        uniforms: {
          p: { type: "f", value: 2 },
          glowColor: { type: "c", value: new THREE.Color(0x84ccff) },
        },
        vertexShader: $('#vertexShader').text,
        fragmentShader: $('#fragmentShader').text,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });

    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load('http://greggman.github.io/doodles/assets/woman.dae', function (collada) {
      dae = collada.scene;

      dae.traverse( function ( child ) {

        if (child instanceof THREE.Mesh) {
          console.log(child);
          child.material = customMaterial;
        }

      } );

      dae.scale.x = 0.2;
      dae.scale.y = 0.2;
      dae.scale.z = 0.2;
      human = dae;
      scene.add(human);
    });


    function resize() {
      var canvas = renderer.domElement;
      var width  = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }
        
    // call the render function
    function render(time) {
      time *= 0.001;
      
      resize();

      camera.position.x = -20 * (Math.cos(time));
      camera.position.z = (20 * (Math.sin(time)));
      camera.position.y = 20;

      camera.lookAt(lookAt);

      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-html -->

    <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/r71/three.min.js"></script>
    <script src="//greggman.github.io/doodles/js/three/js/loaders/ColladaLoader.js"></script>

    <script id="vertexShader" type="x-shader/x-vertex">
            uniform float p;
            varying float intensity;
            void main()
            {
                vec3 vNormal = normalize( normalMatrix * normal );
                intensity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
    </script>

    <!-- fragment shader a.k.a. pixel shader -->
    <script id="fragmentShader" type="x-shader/x-vertex">
            uniform vec3 glowColor;
            varying float intensity;
            void main()
            {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4( glow, 1.0 );
            }
    </script>
    <style>
      html, body {
        margin: 0;
        overflow: hidden;
        height: 100%;
      }
      canvas {
        width: 100%;
        height: 100%;
      }
    </style>

<!-- end snippet -->


