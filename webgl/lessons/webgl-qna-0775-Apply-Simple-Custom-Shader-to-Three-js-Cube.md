Title: Apply Simple Custom Shader to Three.js Cube
Description:
TOC: qna

# Question:

I'm trying to apply a simple custom shader to a cube in Three.js but I'm having a bit of trouble. When I try to apply the shader the cube disappears. If I use a regular Toon or Lambert Material this isn't a problem - the cube rotates and can be manipulated as normal.

Orbit Controls also stops working when I try to apply the custom shader. Although I've gone through the examples I can't seem to get it work. 


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    //Set Scene
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 3;

    //Create Light
    var light = new THREE.PointLight(0xFE938C, 1.5);
          light.position.set(0,5,20);
          scene.add(light);

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );

     var uniforms = {
        u_time: {type: 'f', value: 0.2},
        u_resolution: {type: 'v2', value: new THREE.Vector2()},
      };
      
     var material = new THREE.ShaderMaterial({
         uniforms: uniforms,
         vertexShader: document.getElementById( 'vertexShader' ).textContent,
         fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        });


    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(0, 0 , 0);

    scene.add( cube );

    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );


       var render = function () {
        requestAnimationFrame( render );

        //cube.rotation.x += 0.1;
        //cube.rotation.y += 0.005;

        renderer.render(scene, camera);
       };

    render();


<!-- language: lang-html -->

    <script id="vertexShader" type="x-shader/x-vertex">
        void main() {
                gl_Position = vec4( position, 1.0 );
            }
    </script>
    <script id="fragmentShader" type="x-shader/x-fragment">
     uniform vec2 u_resolution;
     uniform float u_time;

            void main() {
                vec2 st = gl_FragCoord.xy/u_resolution.xy;
                gl_FragColor=vec4(st.x,st.y,0.0,1.0);
            }
    </script>

<!-- end snippet -->


# Answer

At a minimum you need to use a vertex shader that takes into account the projection matrix and model view matrix that three defines and passes in

        void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    //Set Scene
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 3;

    //Create Light
    var light = new THREE.PointLight(0xFE938C, 1.5);
          light.position.set(0,5,20);
          scene.add(light);

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );

     var uniforms = {
        u_time: {type: 'f', value: 0.2},
        u_resolution: {type: 'v2', value: new THREE.Vector2()},
      };
      
     var material = new THREE.ShaderMaterial({
         uniforms: uniforms,
         vertexShader: document.getElementById( 'vertexShader' ).textContent,
         fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        });


    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(0, 0 , 0);

    scene.add( cube );

    var renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );



       var render = function () {
        requestAnimationFrame( render );

            uniforms.u_resolution.value.x = window.innerWidth;
            uniforms.u_resolution.value.y = window.innerHeight;
            
        cube.rotation.x += 0.1;
        cube.rotation.y += 0.005;

        renderer.render(scene, camera);
       };

    render();

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/86/three.min.js"></script>
    <script id="vertexShader" type="x-shader/x-vertex">
        void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
    </script>
    <script id="fragmentShader" type="x-shader/x-fragment">
     uniform vec2 u_resolution;
     uniform float u_time;

            void main() {
                vec2 st = gl_FragCoord.xy/u_resolution.xy;
                gl_FragColor=vec4(st.x,st.y,0.0,1.0);
            }
    </script>

<!-- end snippet -->


