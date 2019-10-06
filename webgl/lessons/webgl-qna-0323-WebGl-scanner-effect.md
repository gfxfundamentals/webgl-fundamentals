Title: WebGl scanner effect
Description:
TOC: qna

# Question:

Hey I have just seen this short video: https://vine.co/v/hxHz5H2Q07q  and I am wondering how to achieve this scanning effect.

For start there are 2 groups needed: one holding cubes with material and a corresponding one with the same cubes but just wireframed, so it is possible to get these layers.

But how to make whe wired one appear in such "scanner" way? Is it via shaders or maybe there is some masking method in threejs for moving the mask across the rendered and displaying the given object linked with the mask?



# Answer

Copied from the description of the [original demo](http://activetheory.net/lab/scanning)

> This experiment was inspired by real-world projection mapping onto physical shapes. The field is created by random generation and merged into a single geometry. It is duplicated and the copy is rendered with a ShaderMaterial that looks at a uniform point and makes most pixels transparent other than those near the light point. Moving the point through the field creates the appearance of scanning.

So, make some geometry, draw it twice, once flat shaded, ones wireframe. For the wireframe version make a custom shader that takes a single point uniform. If the vertex (or pixel) is close to that point draw a color, if not draw transparent (or discard).

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var camera = new THREE.PerspectiveCamera( 20, 1, 1, 10000 );
    camera.position.z = 1800;

    var scene = new THREE.Scene();

    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    var flatMaterial = new THREE.MeshLambertMaterial( { color: 0x606060, shading: THREE.FlatShading } );
    var geometry = new THREE.IcosahedronGeometry( 200, 1 );

    //var wireMaterial = new THREE.MeshBasicMaterial( { color: 0x00FF00, wireframe:true  } );

    var uniforms = {
        color:           { type: "c",  value: new THREE.Color(0x00FF00) },
        lightPos:        { type: "v3", value: new THREE.Vector3(0, 0, 0) },
        range:           { type: "f",  value: 150, },
    };


    var wireMaterial = new THREE.ShaderMaterial({
        wireframe:      true,
        uniforms:       uniforms,
        attributes:     {
        },
        vertexShader:   document.getElementById('vertexshader').text,
        fragmentShader: document.getElementById('fragmentshader').text,
        depthTest:      true,
        transparent:    true,
      });


    var mesh = new THREE.Mesh( geometry, flatMaterial );
    scene.add( mesh );

    var mesh = new THREE.Mesh( geometry, wireMaterial );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    document.body.appendChild( renderer.domElement );

    function resize() {
        var canvas = renderer.context.canvas
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (width != canvas.width || height != canvas.height) {
          renderer.setSize( width, height, false );
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
    }

    function render() {
      
        resize();
      
        var time = Date.now() * 0.001;
        uniforms.lightPos.value.x = Math.sin(time) * 200;
        uniforms.lightPos.value.y = Math.cos(time) * 200;
      
        camera.lookAt( scene.position );

        renderer.render( scene, camera );

        requestAnimationFrame( render );
    }
    render();


<!-- language: lang-css -->

    html, body {
      margin: 0px;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/r70/three.min.js"></script>
    <body>
    </body>

        <script type="not-js" id="vertexshader">
          varying vec4 v_position;

          void main() {

            vec4 pos = vec4(position, 1.0);

            gl_Position = projectionMatrix * modelViewMatrix * pos;
            v_position = modelMatrix * pos;
          }

        </script>

        <script type="not-js" id="fragmentshader">

          uniform vec3 color;
          uniform vec3 lightPos;
          uniform float range;

          varying vec4 v_position;

          void main() {
            float distanceToLight = distance(lightPos, v_position.xyz);
            gl_FragColor = mix(vec4(color, 1), vec4(0,0,0,0), step(range, distanceToLight));

          }

        </script>


<!-- end snippet -->


