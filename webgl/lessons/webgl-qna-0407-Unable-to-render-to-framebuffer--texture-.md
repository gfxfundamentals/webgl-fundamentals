Title: Unable to render to framebuffer (texture)
Description:
TOC: qna

# Question:

I'm trying to implement shadows using shadow maps, so I need to render a scene to a separate framebuffer (texture). I cannot get it to work properly, so after stripping down my codebase I'm left with a relatively simple set of instructions which should render a scene to a texture, and then simply render the texture.

The program consists of two programs:

 1. Ground program
 2. Teapot program

The first should render a rectangle, with a certain texture. The second one should render a teapot (with colors based on its position). Eech render step does the following (well, that's the idea anyway):

 1. Switch to framebuffer
 2. Render teapot
 3. Switch to normal buffer
 4. Render teapot
 5. Render ground

Now, the ground fragment shader looks like:

    gl_FragColor = texture2D(shadowMap, fTexCoord);

'shadowMap' is the texture I render to in step 2. I *expect* to see a floating teapot with a rectangle drawn under it. That indeed works. Now, I also expect to have the 'ground' to contain a teapot. After all, we rendered the scene we are looking at without the ground to the framebuffer/texture.

Code

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var UNSIGNED_SHORT_SIZE = 2;

    // Variables filled by setup()
    var glCanvas;
    var gl, teapotProgram, groundProgram;
    var vBuffer, iBuffer, fBuffer;
    var vertices, indices, textures;

    var teapot = null;
    var model;
    var view;
    var light;
    var projection;

    var BASE_URL = "https://hmbastiaan.nl/martijn/webgl/W08P02_SO/";

    var WIDTH = 150, HEIGHT = 150;

    function makeTeapot(){
        var drawingInfo = teapot.getDrawingInfoObjects();
        var indices = drawingInfo.indices;

        for(var i=0; i < indices.length; i++){
            indices[i] += 4; // Add offset for 'ground'
        }

        return {
            indices: drawingInfo.indices,
            vertices: drawingInfo.vertices
        }
    }

    function makeRectangle(x1, x2, y1, y2, z1, z2){
        var x1 = -2,
            x2 =  2,
            y1 = -1,
            y2 = -1,
            z1 = -1,
            z2 = -5;

        var vertices = [
            vec4(x1, y2, z1, 1),
            vec4(x2, y1, z1, 1),
            vec4(x2, y1, z2, 1),
            vec4(x1, y2, z2, 1)
        ];

        var textures = [
            vec2(-1.0, -1.0),
            vec2( 1.0, -1.0),
            vec2( 1.0,  1.0),
            vec2(-1.0,  1.0)
        ];

        var indices = [
            0, 1, 2,
            0, 2, 3
        ];

        return {
            indices: indices,
            vertices: vertices,
            textures: textures
        }

    }

    function resetBuffers(){
        vertices = [];
        indices = [];
        textures = [];

        // Add rectangle
        var rectangle = makeRectangle();
        Array.prototype.push.apply(vertices, rectangle.vertices);
        Array.prototype.push.apply(indices, rectangle.indices);
        Array.prototype.push.apply(textures, rectangle.textures);

        // Add teapot
        var teapot = makeTeapot();
        Array.prototype.push.apply(vertices, teapot.vertices);
        Array.prototype.push.apply(indices, teapot.indices);

        console.log(vertices);
        console.log(indices);
        console.log(textures);

        // Send to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }

    function setup(){
        $.get(BASE_URL + "teapot.obj", function(teapot_obj_data){
            teapot = new OBJDoc(BASE_URL + "teapot.obj");

            if(!teapot.parse(teapot_obj_data, 1)){
                alert("Parsing teapot.obj failed.");
                return;
            }

            setup2();
        }).fail(function(){
            alert("Getting teapot.obj failed.");
        });
    }

    function setup2(){
        glCanvas = document.getElementById("gl-canvas");

        gl = WebGLUtils.setupWebGL(glCanvas, {stencil: true, alpha: false});
        gl.viewport(0, 0, WIDTH, HEIGHT);

        teapotProgram = initShaders(gl, BASE_URL + "vshader-teapot.glsl", BASE_URL + "fshader-teapot.glsl");
        groundProgram = initShaders(gl, BASE_URL + "vshader-ground.glsl", BASE_URL + "fshader-ground.glsl");

        light = vec3(0.0, 2.0, -2.0);
        view = lookAt(vec3(0, 0, 3), vec3(0,0,0), vec3(0,1,0));
        projection = perspective(45, 1.0, 1, 100.0);

        // Get teapot uniforms
        gl.useProgram(teapotProgram);
        teapotProgram.modelLoc      = gl.getUniformLocation(teapotProgram, "Model");
        teapotProgram.viewLoc       = gl.getUniformLocation(teapotProgram, "View");
        teapotProgram.projectionLoc = gl.getUniformLocation(teapotProgram, "Projection");

        // Upload uniforms
        gl.uniformMatrix4fv(teapotProgram.projectionLoc, false, flatten(projection));
        gl.uniformMatrix4fv(teapotProgram.viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(teapotProgram.modelLoc, false, flatten(scalem(0.25, 0.25, 0.25)));

        // Get teapot attributes
        teapotProgram.vPosition = gl.getAttribLocation(teapotProgram, "vPosition");

        // Get ground uniforms
        gl.useProgram(groundProgram);
        groundProgram.modelLoc      = gl.getUniformLocation(groundProgram, "Model");
        groundProgram.viewLoc       = gl.getUniformLocation(groundProgram, "View");
        groundProgram.projectionLoc = gl.getUniformLocation(groundProgram, "Projection");
        groundProgram.shadowMap     = gl.getUniformLocation(groundProgram, "shadowMap");

        // Get ground attributes
        groundProgram.vTexCoord = gl.getAttribLocation(groundProgram, "vTexCoord");
        groundProgram.vPosition = gl.getAttribLocation(groundProgram, "vPosition");

        // Allocate and fill vertices buffer
        vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

        gl.vertexAttribPointer(teapotProgram.vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(teapotProgram.vPosition);

        gl.vertexAttribPointer(groundProgram.vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(groundProgram.vPosition);

        // Allocate indices buffer
        iBuffer = gl.createBuffer();

        // Setup FBO
        fBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);

        fBuffer.renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, fBuffer.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);

        fBuffer.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fBuffer.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fBuffer.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fBuffer.renderbuffer);

        // Sanity checking: framebuffer seems to throw now errors
        if (!gl.isFramebuffer(fBuffer)) {
            throw("Invalid framebuffer");
        }

        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
                break;
            default:
                throw("Incomplete framebuffer: " + status);
        }

        // Set ground textures
        gl.uniform1i(groundProgram.shadowMap, 0);

        // Upload uniforms
        gl.uniformMatrix4fv(groundProgram.projectionLoc, false, flatten(projection));
        gl.uniformMatrix4fv(groundProgram.viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(groundProgram.modelLoc, false, flatten(mat4()));

        // Restore default buffers
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Set background colour
        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        resetBuffers();

        window.requestAnimationFrame(render);
    }

    function render(){
        var teapot = makeTeapot();

        gl.useProgram(teapotProgram);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        // Switch to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);

        // Draw teapot
        teapot = makeTeapot();
        gl.drawElements(gl.TRIANGLES, teapot.indices.length, gl.UNSIGNED_SHORT, 6 * UNSIGNED_SHORT_SIZE);

        // Set framebuffer to defualt buffer (in-browser output)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Draw ground
        gl.useProgram(groundProgram);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        // Render teapot
        gl.useProgram(teapotProgram);
        gl.drawElements(gl.TRIANGLES, teapot.indices.length, gl.UNSIGNED_SHORT, 6 * UNSIGNED_SHORT_SIZE);
    }

    setup();

<!-- language: lang-html -->

    <div>
        <br/>
        <canvas width="150" height="150" id="gl-canvas">Sorry :|</canvas>
    </div>
    <script type='text/javascript' src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
    <script type='text/javascript' src="https://hmbastiaan.nl/martijn/webgl/angel/webgl-utils.js"></script>
    <script type='text/javascript' src="https://hmbastiaan.nl/martijn/webgl/angel/initShaders2.js"></script>
    <script type='text/javascript' src="https://hmbastiaan.nl/martijn/webgl/angel/MV.js"></script>
    <script type='text/javascript' src="https://hmbastiaan.nl/martijn/webgl/angel/objParser.js"></script>

<!-- end snippet -->

Functions of interest:

 1. setup2(): sets up all the buffers and uniforms. 
 2. render(): renders the scene.

Disclaimer: this is for an assignment, although this code is simplified enough to not look like the original assignment at all :).

# Answer

At a glance there are several issues.

1.  Texture bindings are global. Since in setup2 you unbind the 1 texture that means it's never used.

   You need to bind whatever textures are needed before each draw call. In other words when you draw the ground you need to bind the teapot texture as in

        gl.bindTexture(gl.TEXTURE_2D, fBuffer.texture);

    Note: This is an over simplification of what's really needed. You really need to

    1.  Choose a texture unit to bind the texture to

            var unit = 5;
            gl.activeTexture(gl.TEXTURE0 + unit);

    2.  Bind the texture to that unit.

            gl.bindTexture(gl.TEXTURE_2D, fBuffer.texture);

    3.  Set the uniform sampler to that texture unit

            gl.uniform1i(groundProgram.shadowMap, unit);

    The reason you don't need those extra steps is because (a) you only
    have 1 texture so you're using texture unit #0, the default and (b) because
    uniforms default to 0 so `shadowMap` is looking at texture unit #0.

2.  Because you've made a mipmapped texture just rendering to level 0 will not update the mips.

    In other words after you render the teapot you'll have a teapot in mip level 0 but mip levels 1, 2, 3, 4, 5 etc will still have nothing in them. You need to call

        gl.generateMipmap(gl.TEXTURE_2D)

    For that texture after you've rendered the teapot to it. Either that or stop using mips

3.   You need to set the viewport every time you call `gl.bindFramebuffer`.

    `gl.bindFramebuffer` should almost always be followed by a call to `gl.viewport` to make the viewport match the size of the thing you're rendering to

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        // set to size of fb
        gl.viewport(0, 0, widthOfFb, heightOfFb);

        renderSomething();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // set to size of canvas's drawingBuffer
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);


4.   Attributes settings are global

    You setup the teapot attributes. Then you draw a teapot to the texture. You then draw ground, but you're still using the teapot attributes.

    Just like textures you need to setup attributes before each draw call.

I'm also guessing you really should not be calling `makeTeapot` in your render function but instead it should be called in setup.

You might find [this article useful](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

You should also consider [not putting properties on WebGL objects as it's arguably an anti-pattern](http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html).

Also synchronous XHR requests are not cool. You're getting this message in the JavaScript console

>    Synchronous XMLHttpRequest on the main thread is deprecated because
    of its detrimental effects to the end user's experience. For more 
    help, check http://xhr.spec.whatwg.org/.


