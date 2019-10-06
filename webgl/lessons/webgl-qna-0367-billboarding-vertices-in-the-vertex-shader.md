Title: billboarding vertices in the vertex shader
Description:
TOC: qna

# Question:

Code demonstrating issue
(comment/uncomment out the `gl_Position` lines in the vertex shader)


<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

        var scene;
        var book;
        var shaderMaterial;

        var renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setClearColor(0x000000);
        document.body.appendChild(renderer.domElement);

        var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 40000);


        window.onresize = function () {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        };
        window.onresize();

        scene = new THREE.Scene();

        camera.position.z = 25;
        camera.position.y = 15;
        scene.add(camera);


        var grid = new THREE.GridHelper(100, 10);
        scene.add(grid);


        var controls = new THREE.OrbitControls(camera);
        controls.damping = 0.2;
        var lettersPerSide = 16;

        function createGlpyhSheet() {

            var fontSize = 64;

            var c = document.createElement('canvas');
            c.width = c.height = fontSize * lettersPerSide;
            var ctx = c.getContext('2d');
            ctx.font = fontSize + 'px Monospace';
            var i = 0;

            for (var y = 0; y < lettersPerSide; y++) {
                for (var x = 0; x < lettersPerSide; x++, i++) {
                    var ch = String.fromCharCode(i);
                    ctx.fillText(ch, x * fontSize, -(8 / 32) * fontSize + (y + 1) * fontSize);
                }
            }

            var tex = new THREE.Texture(c);
            tex.flipY = false;
            tex.needsUpdate = true;

            return tex;
        }


        function createLabels(textArrays, positions) {
            //console.log(textArrays, positions);

            var master_geometry = new THREE.Geometry();


            for (var k = 0; k < textArrays.length; k++) {

                var geo = new THREE.Geometry();
                geo.dynamic = true;

                var str = textArrays[k];
                var vec = positions[k];
                //console.log(shaderMaterial);

                //console.log('str is', str, 'vec is', vec);


                var j = 0,
                    ln = 0;

                for (i = 0; i < str.length; i++) {

                    //console.log('creating glyph', str[i]);

                    var code = str.charCodeAt(i);
                    var cx = code % lettersPerSide;
                    var cy = Math.floor(code / lettersPerSide);
                    var oneDotOne = .55;

                    geo.vertices.push(
                    new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 0.05, 0).add(vec),
                    new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 0.05, 0).add(vec),
                    new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 1.05, 0).add(vec),
                    new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 1.05, 0).add(vec));
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);

                    var face = new THREE.Face3(i * 4 + 0, i * 4 + 1, i * 4 + 2);
                    geo.faces.push(face);
                    face = new THREE.Face3(i * 4 + 0, i * 4 + 2, i * 4 + 3);
                    geo.faces.push(face);

                    var ox = (cx + 0.05) / lettersPerSide;
                    var oy = (cy + 0.05) / lettersPerSide;
                    var off = 0.9 / lettersPerSide;

                    geo.faceVertexUvs[0].push([
                    new THREE.Vector2(ox, oy + off),
                    new THREE.Vector2(ox + off, oy + off),
                    new THREE.Vector2(ox + off, oy)]);
                    geo.faceVertexUvs[0].push([
                    new THREE.Vector2(ox, oy + off),
                    new THREE.Vector2(ox + off, oy),
                    new THREE.Vector2(ox, oy)]);
                    if (code == 10) {
                        ln--;
                        j = 0;
                    } else {
                        j++;
                    }
                }

                // i can only get this working with merge.
                // Building one giant geometry doesn't work for some reason
                master_geometry.merge(geo);

            }

            console.log(shaderMaterial);
            shaderMaterial.attributes.labelpos.needsUpdate = true;

            book = new THREE.Mesh(
            master_geometry,
            shaderMaterial);

            //book.doubleSided = true;
            scene.add(book);

        }


        var uniforms = {
            map: {
                type: "t",
                value: createGlpyhSheet()
            }
        };

        var attributes = {
            labelpos: {
                type: 'v3',
                value: []
            }
        };

        shaderMaterial = new THREE.ShaderMaterial({
            attributes: attributes,
            uniforms: uniforms,
            vertexShader: document.querySelector('#vertex').textContent,
            fragmentShader: document.querySelector('#fragment').textContent
        });
        shaderMaterial.transparent = true;
        shaderMaterial.depthTest = false;


        strings = [];
        vectors = [];
        var sizeOfWorld = 100;
        var halfSize = sizeOfWorld * 0.5;

        for (var i = 0; i < 500; i++) {

            strings.push('test' + i);
            var vector = new THREE.Vector3();
            vector.x = Math.random() * sizeOfWorld - halfSize;
            vector.y = Math.random() * sizeOfWorld - halfSize;
            vector.z = Math.random() * sizeOfWorld - halfSize;
            vectors.push(vector);

        }

        console.log('creating labels');
        createLabels(strings, vectors);

        function animate() {
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate, renderer.domElement);
        }

        animate();

<!-- language: lang-css -->

            html {
                background-color: #ffffff;
            }
            * {
                margin: 0;
                padding: 0;
            }

<!-- language: lang-html -->

    <script src="http://threejs.org/build/three.min.js"></script>
    <script src="http://threejs.org/examples/js/controls/OrbitControls.js"></script>
    <script id="vertex" type="text/x-glsl-vert">
        varying vec2 vUv;
        attribute vec3 labelpos;

        void main() {
            vUv = uv;


            // standard gl_Position.  Labels stay in the correct place, but do not billboard.
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

            // this is the billboarding position as described by:
            // http://stackoverflow.com/questions/22053932/three-js-billboard-vertex-shader
        //gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));

            // this gets a little closer
            //gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, position.z, 1.0) + vec4(position.x, position.y, 0.0, 0.0));

        }
    </script>
    <script id="fragment" type="text/x-glsl-frag">
        varying vec2 vUv;
        uniform sampler2D map;
        void main() {
            vec4 diffuse = texture2D(map, vUv);
            vec4 letters = mix(diffuse, vec4(1.0, 1.0, 1.0, diffuse.a), 1.0);
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * letters;
        }
    </script>

<!-- end snippet -->

I need help billboarding labels in my scene.  My final scene will have hundreds of labels which I want to face the camera.  I cannot figure out a way of doing this via a single mesh geometry.  I've tried a few different `gl_Position` methods to get the billboarding look:


    // standard gl_Position.  Labels stay in the correct place, but do not billboard.
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
    // this is the billboarding position as described by:
    // http://stackoverflow.com/questions/22053932/three-js-billboard-vertex-shader
    gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(position.x, position.y, 0.0, 0.0));
    
    // this gets a little closer
    gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, position.z, 1.0) + vec4(position.x, position.y, 0.0, 0.0));


My thinking was to send a shader attribute to each vertex to assist with the billboarding calculation, so that's why I have a `label_pos` attribute in the vertex shader.

I *can* get the exact look and feel I want if each label (made up of characters) is added to the scene separately.  Unfortunately this results in too many draw calls per render loop, hence the reason for adding them all to a single geometry.

Any assistance on this would be greatly appreciated, thanks.



# Answer

I think you want

    gl_Position = projectionMatrix * 
                  (modelViewMatrix * vec4(labelpos, 1) +
                   vec4(position.xy, 0, 0));

and you need to not add in the position to the vertices

    geo.vertices.push(
      new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 0.05, 0),
      new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 0.05, 0),
      new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 1.05, 0),
      new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 1.05, 0));
              
Otherwise you'd be putting in the position twice.

Because all your labels are in the same mesh then there's only 1 draw call which means you won't get a different location for each label unless you pass it in (which you were in labelpos but you weren't using it)

In which case `modelViewMatrix * vec4(0,0,0,1)` is the same as just saying `modelViewMatrix[3]`  All you're doing is getting the translation of the model that contains all the labels. That would work if each label was a separate mesh and had its own matrix but since you've put them all in one mesh it won't work.

Your fix was the pass in the location of each label in a separate attribute which you had already included, you just needed to use it.

    modelViewMatrix * vec4(labelpos, 1)

gets you the root of the label

    vec4(position.x, position.y, 0.0, 0.0)

adds in the corners in view space

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var scene;
        var book;
        var shaderMaterial;

        var renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setClearColor(0x000000);
        document.body.appendChild(renderer.domElement);

        var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 40000);


        window.onresize = function () {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        };
        window.onresize();

        scene = new THREE.Scene();

        camera.position.z = 25;
        camera.position.y = 15;
        scene.add(camera);


        var grid = new THREE.GridHelper(100, 10);
        scene.add(grid);


        var controls = new THREE.OrbitControls(camera);
        controls.damping = 0.2;
        var lettersPerSide = 16;

        function createGlpyhSheet() {

            var fontSize = 64;

            var c = document.createElement('canvas');
            c.width = c.height = fontSize * lettersPerSide;
            var ctx = c.getContext('2d');
            ctx.font = fontSize + 'px Monospace';
            var i = 0;

            for (var y = 0; y < lettersPerSide; y++) {
                for (var x = 0; x < lettersPerSide; x++, i++) {
                    var ch = String.fromCharCode(i);
                    ctx.fillText(ch, x * fontSize, -(8 / 32) * fontSize + (y + 1) * fontSize);
                }
            }

            var tex = new THREE.Texture(c);
            tex.flipY = false;
            tex.needsUpdate = true;

            return tex;
        }


        function createLabels(textArrays, positions) {
            //console.log(textArrays, positions);

            var master_geometry = new THREE.Geometry();


            for (var k = 0; k < textArrays.length; k++) {

                var geo = new THREE.Geometry();
                geo.dynamic = true;

                var str = textArrays[k];
                var vec = positions[k];
                //console.log(shaderMaterial);

                //console.log('str is', str, 'vec is', vec);


                var j = 0,
                    ln = 0;

                for (i = 0; i < str.length; i++) {

                    //console.log('creating glyph', str[i]);

                    var code = str.charCodeAt(i);
                    var cx = code % lettersPerSide;
                    var cy = Math.floor(code / lettersPerSide);
                    var oneDotOne = .55;

                    geo.vertices.push(
                    new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 0.05, 0),
                    new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 0.05, 0),
                    new THREE.Vector3(j * oneDotOne + 1.05, ln * oneDotOne + 1.05, 0),
                    new THREE.Vector3(j * oneDotOne + 0.05, ln * oneDotOne + 1.05, 0));
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);
                    shaderMaterial.attributes.labelpos.value.push(vec);

                    var face = new THREE.Face3(i * 4 + 0, i * 4 + 1, i * 4 + 2);
                    geo.faces.push(face);
                    face = new THREE.Face3(i * 4 + 0, i * 4 + 2, i * 4 + 3);
                    geo.faces.push(face);

                    var ox = (cx + 0.05) / lettersPerSide;
                    var oy = (cy + 0.05) / lettersPerSide;
                    var off = 0.9 / lettersPerSide;

                    geo.faceVertexUvs[0].push([
                    new THREE.Vector2(ox, oy + off),
                    new THREE.Vector2(ox + off, oy + off),
                    new THREE.Vector2(ox + off, oy)]);
                    geo.faceVertexUvs[0].push([
                    new THREE.Vector2(ox, oy + off),
                    new THREE.Vector2(ox + off, oy),
                    new THREE.Vector2(ox, oy)]);
                    if (code == 10) {
                        ln--;
                        j = 0;
                    } else {
                        j++;
                    }
                }

                // i can only get this working with merge.
                // Building one giant geometry doesn't work for some reason
                master_geometry.merge(geo);

            }

            console.log(shaderMaterial);
            shaderMaterial.attributes.labelpos.needsUpdate = true;

            book = new THREE.Mesh(
            master_geometry,
            shaderMaterial);

            //book.doubleSided = true;
            scene.add(book);

        }


        var uniforms = {
            map: {
                type: "t",
                value: createGlpyhSheet()
            }
        };

        var attributes = {
            labelpos: {
                type: 'v3',
                value: []
            }
        };

        shaderMaterial = new THREE.ShaderMaterial({
            attributes: attributes,
            uniforms: uniforms,
            vertexShader: document.querySelector('#vertex').textContent,
            fragmentShader: document.querySelector('#fragment').textContent
        });
        shaderMaterial.transparent = true;
        shaderMaterial.depthTest = false;


        strings = [];
        vectors = [];
        var sizeOfWorld = 100;
        var halfSize = sizeOfWorld * 0.5;

        for (var i = 0; i < 500; i++) {

            strings.push('test' + i);
            var vector = new THREE.Vector3();
            vector.x = Math.random() * sizeOfWorld - halfSize;
            vector.y = Math.random() * sizeOfWorld - halfSize;
            vector.z = Math.random() * sizeOfWorld - halfSize;
            vectors.push(vector);

        }

        console.log('creating labels');
        createLabels(strings, vectors);

        function animate() {
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate, renderer.domElement);
        }

        animate();

<!-- language: lang-css -->

    html {
                background-color: #ffffff;
            }
            * {
                margin: 0;
                padding: 0;
            }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/69/three.min.js"></script>
    <script src="https://cdn.rawgit.com/mrdoob/three.js/4862f5f1111346a957ac3e0cb0858be1568d0e03/examples/js/controls/OrbitControls.js"></script>
    <script id="vertex" type="text/x-glsl-vert">
        varying vec2 vUv;
        attribute vec3 labelpos;

        void main() {
            vUv = uv;


            gl_Position = projectionMatrix * 
                          (modelViewMatrix * vec4(labelpos, 1) +
                           vec4(position.xy, 0, 0));

        }
    </script>
    <script id="fragment" type="text/x-glsl-frag">
        varying vec2 vUv;
        uniform sampler2D map;
        void main() {
            vec4 diffuse = texture2D(map, vUv);
            vec4 letters = mix(diffuse, vec4(1.0, 1.0, 1.0, diffuse.a), 1.0);
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * letters;
        }
    </script>

<!-- end snippet -->


