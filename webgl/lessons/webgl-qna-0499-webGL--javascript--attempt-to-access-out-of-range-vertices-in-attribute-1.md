Title: webGL, javascript: attempt to access out of range vertices in attribute 1
Description:
TOC: qna

# Question:

I'm not understanding how to fix this error.  I was able to do an xz-plane with two spheres in two corners.  The spheres are shaded (one goroud, one phong) with the plane being a flat color.  However, when I tried to texturize the plane in a checkerboard pattern, I started to receive this error.

Here is my HTML:

    <html>
    <script id="BsphereV" type="x-shader/x-vertex">
    attribute vec4 vPosition;
    attribute vec4 vNormal;
    varying vec3 N;
    varying vec3 L;
    varying vec3 E;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec4 lightPosition;
    uniform mat3 normalMatrix;
    
    void main() {
        //----- Color Code
        // vPos in eye coords
        vec3 pos = (modelViewMatrix * vPosition).xyz;
        
        // directional light check
        if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
        else L = normalize(lightPosition.xyz - pos);
        
        // vPos to eye vector
        E = -normalize(pos);
        
        // transform vNorm to eye coords
        N = normalize(normalMatrix * vNormal.xyz);
        
        //----- Postion code
        mat4 SnT = mat4(0.3, 0.0, 0.0, 0.0,
                        0.0, 0.3, 0.0, 0.0,
                        0.0, 0.0, 0.3, 0.0,
                        0.7, 0.0,-0.7, 1.0);
        
        gl_Position = projectionMatrix * modelViewMatrix * SnT * vPosition;
    }
    </script>
    
    <script id="SphereCB" type="x-shader/x-fragment">
    precision mediump float;
    varying vec3 N;
    varying vec3 L;
    varying vec3 E;
    uniform vec4 ambientProduct;
    uniform vec4 diffuseProduct;
    uniform vec4 specularProduct;
    uniform float shininess;
    
    void main() {
        vec4 fColor;
        
        // halfway vector
        vec3 H = normalize(L + E);
        
        // Light calcs
        vec4 ambient = ambientProduct;
        
        float Kd = max(dot(L, N), 0.0);
        vec4 diffuse = Kd * diffuseProduct;
        
        float Ks = pow(max(dot(N, H), 0.0), shininess);
        vec4 specular = Ks * specularProduct;
        
        if(dot(L, N) < 0.0) specular = vec4(0.0, 0.0, 0.0, 1.0);
        
        // set color
        //fColor = ambient + diffuse + specular;
        fColor = ambient + specular;
        fColor.a = 1.0;
        
        gl_FragColor = fColor;
    }
    </script>
    
    <script id="RsphereV" type="x-shader/x-vertex">
    attribute vec4 vPosition;
    attribute vec4 vNormal;
    varying vec4 fColor;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec4 ambientProduct;
    uniform vec4 diffuseProduct;
    uniform vec4 specularProduct;
    uniform vec4 lightPosition;
    uniform float shininess;
    uniform mat3 normalMatrix;
    
    void main() {
        //----- Color code
        // vPos in eye coords
        vec3 pos = (modelViewMatrix * vPosition).xyz;
        
        // vec from vPos to light source
        vec3 L;
        
        // directional light check
        if(lightPosition.w == 0.0) L = normalize(lightPosition.xyz);
        else L = normalize(lightPosition.xyz - pos);
        
        // vPos to eye vector
        vec3 E = -normalize(pos);
        
        // halfway vector
        vec3 H = normalize(L + E);
        
        // transform vNorm to eye coords
        vec3 N = normalize(normalMatrix * vNormal.xyz);
        
        // Light calcs
        vec4 ambient = ambientProduct;
        
        float Kd = max(dot(L, N), 0.0);
        vec4 diffuse = Kd * diffuseProduct;
        
        float Ks = pow(max(dot(N, H), 0.0), shininess);
        vec4 specular = Ks * specularProduct;
        
        if(dot(L, N) < 0.0) specular = vec4(0.0, 0.0, 0.0, 1.0);
        
        // set color
        //fColor = ambient + diffuse + specular;
        fColor = ambient + diffuse;
        fColor.a = 1.0;
        
        //----- Position code    
        mat4 SnT = mat4(0.3, 0.0, 0.0, 0.0,
                        0.0, 0.3, 0.0, 0.0,
                        0.0, 0.0, 0.3, 0.0,
                       -0.7, 0.0,-0.7, 1.0);
        
        gl_Position = projectionMatrix * modelViewMatrix * SnT * vPosition;
    }
    </script>
    
    <script id="SphereCR" type="x-shader/x-fragment">
    precision mediump float;
    varying vec4 fColor;
    
    void main() {
        gl_FragColor = fColor;
    }
    </script>
    
    <script id="floorV" type="x-shader/x-vertex">
    attribute vec4 vPosition;
    attribute vec2 vTexCoord;
    varying vec2 fTexCoord;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
        mat4 SnT = mat4(1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.7, 0.0, 1.0);
        
        gl_Position = projectionMatrix * modelViewMatrix * SnT * vPosition;
        fTexCoord = vTexCoord;
    }
    </script>
    
    <script id="floorC" type="x-shader/x-fragment">
    precision mediump float;
    varying vec2 fTexCoord;
    uniform sampler2D texture;
    
    void main() {
        vec4 fColor = vec4(0, 1, 0, 1);
        gl_FragColor = fColor * texture2D(texture, fTexCoord);
    }
    </script>
    
    <script type="text/javascript" src="../Common/webgl-utils.js"></script>
    <script type="text/javascript" src="../Common/initShaders.js"></script>
    <script type="text/javascript" src="../Common/MV.js"></script>
    <script type="text/javascript" src="assign4snt.js"></script>
    
    <body>
    <canvas id="gl-canvas" width="600" height="600">
    Oops... your browser doesn't support the HTML5 canvas element.
    </canvas>
    </body>
    </html>

Here is my javascript:

    //----- General variables
    var gl;
    var canvas;
    var pointsArray = [];
    
    //----- Sphere variables
    var pSphereB;
    var pSphereR;
    var index = 0;
    var indexRedStart;
    var numTimesToSubdivide = 4;
    var va = vec4( 0.0,  0.0, -1.0, 1);
    var vb = vec4( 0.0,  0.9,  0.3, 1);
    var vc = vec4(-0.8, -0.5,  0.3, 1);
    var vd = vec4( 0.8, -0.5,  0.3, 1);
    var normalsArray = [];
    
    //----- Light variables
    var lightPosition = vec4(5.0, 5.0, 5.0, 0.0);
    var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    var pointLight = true;
    
    //----- Red Sphere Coloring (goroud)
    var redMatAmbient = vec4(1.0, 0.0, 0.0, 1.0);
    var redMatDiffuse = vec4(1.0, 0.0, 0.0, 1.0);
    var redMatSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    var redMatShininess = 150.0;
    var normalMatrixR;
    var normalMatrixLocR;
    
    //----- Blue Sphere Coloring (phong)
    var blueMatAmbient = vec4(0.0, 0.0, 1.0, 1.0);
    var blueMatDiffuse = vec4(0.0, 0.0, 1.0, 1.0);
    var blueMatSpecular = vec4(1.0, 1.0, 1.0, 1.0);
    var blueMatShininess = 8.0;
    var normalMatrixB;
    var normalMatrixLocB;
    
    //----- Plane variables
    var pFloor;
    var texCoordsArray = [];
    var texSize = 64;
    var texture;
    
    //----- Camera variables
    var modelViewMatrix;
    var projectionMatrix;
    var bMVLoc;
    var bPVLoc;
    var rMVLoc;
    var rPVLoc;
    var fMVLoc;
    var fPVLoc;
    var fov = 45;
    var near = 0.5;
    var far = 1000;
    var x;
    var y = 3;
    var z;
    var eye;
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var degrees = 90;
    var angles;
    var RADIUS = 3;
    
    //----- Checkerboard Texture
    // create using floats
    var image1 = new Array();
        for(var i = 0; i < texSize; i++) image1[i] = new Array();
        for(var i = 0; i < texSize; i++)
            for(var j = 0; j < texSize; j++)
                image1[i][j] = new Float32Array(4);
        for(var i = 0; i < texSize; i++)
            for(var j = 0; j < texSize; j++) {
                var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
                image1[i][j] = [c, c, c, 1];
            }
    // convert floats to ubytes
    var image2 = new Uint8Array(4 * texSize * texSize);
        for(var i = 0; i < texSize; i++)
            for(var j = 0; j < texSize; j++)
                for(var k = 0; k < 4; k++)
                    image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];
    
    //==============================================================================
    window.onload = function init() {
        //----- Initialize WebGL
        canvas = document.getElementById("gl-canvas");
        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) alert("WebGL isn't available");
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.9, 0.9, 0.9, 1);
        gl.enable(gl.DEPTH_TEST);
        
        //----- Initialize Shaders
        pSphereB = initShaders(gl, "BsphereV", "SphereCB");
        pSphereR = initShaders(gl, "RsphereV", "SphereCR");
        pFloor = initShaders(gl, "floorV", "floorC");
        
        //----- Create Spheres
        sphere(va, vb, vc, vd, numTimesToSubdivide);
        
        indexRedStart = index;
        sphere(va, vb, vc, vd, numTimesToSubdivide);
        
        //----- Create Plane
        plane();
        
        //----- Light Calcs (Red Sphere)
        var redAmbientProd = mult(lightAmbient, redMatAmbient);
        var redDiffuseProd = mult(lightDiffuse, redMatDiffuse);
        var redSpecularProd = mult(lightSpecular, redMatSpecular);
        var blueAmbientProd = mult(lightAmbient, blueMatAmbient);
        var blueDiffuseProd = mult(lightDiffuse, blueMatDiffuse);
        var blueSpecularProd = mult(lightSpecular, blueMatSpecular);
            
        //----- Vertex Buffer Code
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
        
        var vPosBlue = gl.getAttribLocation(pSphereB, "vPosition");
        gl.vertexAttribPointer(vPosBlue, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosBlue);
        
        var vPosRed = gl.getAttribLocation(pSphereR, "vPosition");
        gl.vertexAttribPointer(vPosRed, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosRed);
        
        var vPlane = gl.getAttribLocation(pFloor, "vPosition");
        gl.vertexAttribPointer(vPlane, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPlane);
        
        //----- Texture Buffer Code
        var tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
        
        var vTexCoord = gl.getAttribLocation(pFloor, "vTexCoord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);
        
        //----- Normals Buffer Code
        var nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
        
        var nBlue = gl.getAttribLocation(pSphereB, "vNormal");
        gl.vertexAttribPointer(nBlue, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(nBlue);
        
        var nRed = gl.getAttribLocation(pSphereR, "vNormal");
        gl.vertexAttribPointer(nRed, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(nRed);
        
        //----- Process Texture
        configureTexture(image2);
        
        //----- Link Camera
        bMVLoc = gl.getUniformLocation(pSphereB, "modelViewMatrix");
        bPVLoc = gl.getUniformLocation(pSphereB, "projectionMatrix");
        rMVLoc = gl.getUniformLocation(pSphereR, "modelViewMatrix");
        rPVLoc = gl.getUniformLocation(pSphereR, "projectionMatrix");
        fMVLoc = gl.getUniformLocation(pFloor, "modelViewMatrix");
        fPVLoc = gl.getUniformLocation(pFloor, "projectionMatrix");
        
        //----- Link Nomrmals
        normalMatrixLocR = gl.getUniformLocation(pSphereR, "normalMatrix");
        normalMatrixLocB = gl.getUniformLocation(pSphereB, "normalMatrix");
        
        //----- Link Blue Lights
        gl.useProgram(pSphereB);
        gl.uniform4fv(gl.getUniformLocation(pSphereB, "ambientProduct"),
                flatten(blueAmbientProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereB, "diffuseProduct"),
                flatten(blueDiffuseProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereB, "specularProduct"),
                flatten(blueSpecularProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereB, "lightPosition"),
                flatten(lightPosition));
        gl.uniform1f(gl.getUniformLocation(pSphereB, "shininess"),
                blueMatShininess);
    
        //----- Link Red Lights
        gl.useProgram(pSphereR);
        gl.uniform4fv(gl.getUniformLocation(pSphereR, "ambientProduct"),
                flatten(redAmbientProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereR, "diffuseProduct"),
                flatten(redDiffuseProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereR, "specularProduct"),
                flatten(redSpecularProd));
        gl.uniform4fv(gl.getUniformLocation(pSphereR, "lightPosition"),
                flatten(lightPosition));
        gl.uniform1f(gl.getUniformLocation(pSphereR, "shininess"),
                redMatShininess);
        
        //----- Initialize camera location    
        setInitialXZ();
        
        //----- Navigation Control
        window.addEventListener("keydown", function() {
           if(event.keyCode == 65 || event.keyCode == 37) {    // A (left)
               degrees -= 5;
               angles = radians(degrees);
               x = RADIUS * Math.cos(angles);
               z = RADIUS * Math.sin(angles);
           }
           if(event.keyCode == 68 || event.keyCode == 39) {    // D (right)
               degrees += 5;
               angles = radians(degrees);
               x = RADIUS * Math.cos(angles);
               z = RADIUS * Math.sin(angles);
           }
        });
        
        //----- Draw Screen
        render();
    }
    
    //==============================================================================
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        //----- Set Camera
        projectionMatrix = perspective(fov, canvas.width/canvas.height, near, far);
        eye = vec3(x, y, z);
        modelViewMatrix = lookAt(eye, at, up);
        normalMatrix = [
            vec3(modelViewMatrix[0][0], modelViewMatrix[0][1],
                    modelViewMatrix[0][2]),
            vec3(modelViewMatrix[1][0], modelViewMatrix[1][1],
                    modelViewMatrix[1][2]),
            vec3(modelViewMatrix[2][0], modelViewMatrix[2][1],
                    modelViewMatrix[2][2]),
        ];
        
        //----- Draw Blue Sphere
        gl.useProgram(pSphereB);
        gl.uniformMatrix4fv(bMVLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(bPVLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLocB, false, flatten(normalMatrix));
        for(var i = 0; i < indexRedStart; i += 3)
            gl.drawArrays(gl.TRIANGLES, i, 3);
        
        //----- Draw Red Sphere
        gl.useProgram(pSphereR);
        gl.uniformMatrix4fv(rMVLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(rPVLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLocR, false, flatten(normalMatrix));
        for(var i = indexRedStart; i < index; i += 3)
            gl.drawArrays(gl.TRIANGLES, i, 3);
        
        //----- Draw Plane
        gl.useProgram(pFloor);
        gl.uniformMatrix4fv(fMVLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(fPVLoc, false, flatten(projectionMatrix));
        gl.drawArrays(gl.TRIANGLES, index, 6);
        
        //----- Draw Again
        requestAnimFrame(render);
    }
    
    //==============================================================================
    function configureTexture(image) {
        texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA,
                gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    
    //==============================================================================
    function setInitialXZ() {
        angles = radians(degrees);
        x = RADIUS * Math.cos(angles);
        z = RADIUS * Math.sin(angles);
    }
    
    //==============================================================================
    function plane() {
        var vertices = [
            vec4( 1,-1, 1, 1),  // 0 #4 upper right
            vec4(-1,-1, 1, 1),  // 1 #3 upper left
            vec4(-1,-1,-1, 1),  // 2 #1 lower left
            vec4( 1,-1,-1, 1)   // 3 #2 lower right
        ];
        
        var texCoord = [
            vec2(0, 0),
            vec2(0, 1),
            vec2(1, 1),
            vec2(1, 0)
        ];
        
        pointsArray.push(vertices[0]);
        pointsArray.push(vertices[1]);
        pointsArray.push(vertices[2]);
        pointsArray.push(vertices[0]);
        pointsArray.push(vertices[2]);
        pointsArray.push(vertices[3]);
        
        texCoordsArray.push(texCoord[0]);
        texCoordsArray.push(texCoord[1]);
        texCoordsArray.push(texCoord[2]);
        texCoordsArray.push(texCoord[0]);
        texCoordsArray.push(texCoord[2]);
        texCoordsArray.push(texCoord[3]);
    }
    
    //==============================================================================
    function sphere(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }
    
    //==============================================================================
    function divideTriangle(a, b, c, count) {
        if (count > 0) {
            //----- Find midpoint
            var ab = mix(a, b, 0.5);
            var ac = mix(a, c, 0.5);
            var bc = mix(b, c, 0.5);
    
            //----- Find Normal Vector
            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);
    
            //----- Repeat
            divideTriangle(a, ab, ac, count-1);
            divideTriangle(ab, b, bc, count-1);
            divideTriangle(bc, c, ac, count-1);
            divideTriangle(ab, bc, ac, count-1);
        } else {
            triangle(a, b, c);
        }
    }
    
    //==============================================================================
    function triangle(a, b, c) {
        pointsArray.push(a);
        pointsArray.push(b);
        pointsArray.push(c);
        
        normalsArray.push(a[0], a[1], a[2], 0);
        normalsArray.push(b[0], b[1], b[2], 0);
        normalsArray.push(c[0], c[1], c[2], 0);
        
        index += 3;
    } 

Any help would be appreciated.



# Answer

Attributes are global state. That means you have to set them before each draw call (or each change in vertices), not at init time.

The code seems to think that attributes are per-program. 

For example this part

    var vPosBlue = gl.getAttribLocation(pSphereB, "vPosition");
    gl.vertexAttribPointer(vPosBlue, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosBlue);

    var vPosRed = gl.getAttribLocation(pSphereR, "vPosition");
    gl.vertexAttribPointer(vPosRed, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosRed);

    var vPlane = gl.getAttribLocation(pFloor, "vPosition");
    gl.vertexAttribPointer(vPlane, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPlane);

The code above is probably setting the same attribute 3 times meaning only the last one is having any effect since if they are the same attribute location the global attribute at that location has been overwritten with the last 2 lines.

uniforms are shader program state. **ALL OTHER STATE IS GLOBAL**. For example attributes, texture units, and everything else.

[You might find this article useful](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)


