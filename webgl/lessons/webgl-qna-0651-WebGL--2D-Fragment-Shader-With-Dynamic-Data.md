Title: WebGL: 2D Fragment Shader With Dynamic Data
Description:
TOC: qna

# Question:

I am working on a top-down 2D HTML5 game that uses pixel-by-pixel area sampling and manipulation to create a wave rippling effect. I got this up and running in JavaScript, but the performance was iffy on FireFox and completely unacceptable on Chrome. I considered porting my entire prototype to a platform with better performance but learned about GL shaders along the way.

I thought it would be simple enough to adapt my algorithm to a GL fragment shader. I am on my fourth consecutive day trying to get my shader to produce any output whatsoever. I've done my very best to adapt solutions from other questions and tutorials to what I'm doing, but none of them are quite close enough to my specific needs.

First, I'll present an overview of what I need to happen conceptually. Then I'll provide code and explain the approach that I've tried to take so far. I'm willing to start from scratch if I can just make sense of what I need to do.

The algorithm for the wave effect works as described [here][1]. It involves rendering a new image from a source image by displacing certain pixels based on wave height data for each pixel, stored in two matrices with a corresponding entry for each pixel in the image. One is used as the current state of the water, and the other stores the results of the previous frame to use for calculating the current.

Per frame: waveMapCurrent is calculated by averaging values waveMapPrevious

Per pixel: displacement is calculated from the height in waveMapCurrent and (in psuedocode) `newPixelData[current] = sourcePixelData[current+displacement]`

At a minimum, I need my fragment shader to be able to access the data from the current wave height matrix and the image to use as a source. If I understand things correctly, it would be the most beneficial for performance to minimize the number of times I pass new data to the GL pipeline and instead perform the wave height calculations within a shader, but I can alternatively do the calculations in my script and pass the updated version of the wave height matrix to the fragment shader each frame.

Before I can even think about what the fragment shader is doing, though, there is the task of setting up an object to actually draw fragments to. As far as I can tell, this requires setting up vertices to represent the canvas and setting them to the corners of the canvas to get WebGL to render it as a flat, 2D image, but that seems unintuitive. I either need to render this to an image to use as a background texture or initialize a second canvas and set the background of the first to be transparent (which is what I've tried to do in my code below). If there is any way to get the fragment shader to run and simply render its output with each fragment corresponding 1:1 with the pixels of the canvas/image, that would be sublime, but I assume nothing with GLSL.

What I've tried to do is pack the current wave height matrix as a texture and send it in as a uniform sampler2D. In its current state, my code runs, but WebGL tells me that active texture 1, which is my wave height matrix packed as a texture, is incomplete and that it's minification/magnification filtering is not set to NEAREST, even though I have tried to explicitly set it to NEAREST. I have no idea how to debug it any further, because WebGL is citing my call to gl.drawElements as the source of the error.

That is as intelligently as I can describe this. Here is what I have:

        ws.glProgram = function(gl, tex) {
        
        var flExt = gl.getExtension("OES_texture_float");
        ws.program = gl.createProgram();
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        
        var vertSrc = [
            
        "attribute vec4 position;",
            
        "void main(void) {",
            "gl_Position = position;",
        "}"
            
        ]
        
        var fragSrc = [
        "precision highp float;",
        
        "uniform sampler2D canvasTex;",
        "uniform sampler2D dataTex;",
            
        "uniform vec2 mapSize;",
        "uniform float dispFactor;",
        "uniform float lumFactor;",
            
        "void main(void) {",
            
            
            "vec2 mapCoord = vec2(gl_FragCoord.x+1.5, gl_FragCoord.y+1.5);",
            "float wave = texture2D(dataTex, mapCoord).r;",
            "float displace = wave*dispFactor;",
            
            "if (displace < 0.0) {",
                "displace = displace+1.0;",
            "}",
        
            "vec2 srcCoord = vec2(gl_FragCoord.x+displace,gl_FragCoord.y+displace);",
            
            "if (srcCoord.x < 0.0) {",
                "srcCoord.x = 0.0;",
            "}",
            "else if (srcCoord.x > mapSize.x-2.0) {",
                "srcCoord.x = mapSize.x-2.0;",
            "}",
            
            "if (srcCoord.y < 0.0) {",
                "srcCoord.y = 0.0;",
            "}",
            "else if (srcCoord.y > mapSize.y-2.0) {",
                "srcCoord.y = mapSize.y-2.0;",
            "}",
            
            "float lum = wave*lumFactor;",
            "if (lum > 40.0) { lum = 40.0; }",
            "else if (lum < -40.0) { lum = -40.0; }",
            
            "gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);", // Fragment Shader is not producing output
            
            /*"gl_FragColor = texture2D(canvasTex, srcCoord);",
            "gl_FragColor.r = gl_FragColor.r + lum;",
            "gl_FragColor.g = gl_FragColor.g + lum;",
            "gl_FragColor.b = gl_FragColor.b + lum;",*/
            
        "}"];
        
        vertSrc = vertSrc.join('\n');
        fragSrc = fragSrc.join('\n');
        
        gl.shaderSource(vertShader, vertSrc);
        gl.compileShader(vertShader);
        gl.attachShader(ws.program, vertShader);
        
        gl.shaderSource(fragShader, fragSrc);
        gl.compileShader(fragShader);
        gl.attachShader(ws.program, fragShader);
        
        console.log(gl.getShaderInfoLog(vertShader));
        
        gl.linkProgram(ws.program);
        gl.useProgram(ws.program);
        
        // Vertex Data for rendering surface
        var vertices = [ 0,0,0, 1,0,0,
                         0,1,0, 1,1,0 ];
        var indices = [  0,1,2, 0,2,3 ];
        
        ws.program.vertices = new Float32Array(vertices);
        ws.program.indices = new Float32Array(indices);
        
        gl.enableVertexAttribArray(0);
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, ws.program.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        
        var iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ws.program.indices, gl.STATIC_DRAW);
        
        // Send texture data from tex to WebGL
        var canvasTex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, canvasTex);
        
        // Non-Power-of-Two Texture Dimensions
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.imageData);
        gl.uniform1i(gl.getUniformLocation(ws.program, "canvasTex"), 2);
        
        // Send empty wave map to WebGL
        ws.activeWaveMap = new Float32Array((ws.width+2)*(ws.height+2));
        ws.dataPointerGL = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, ws.dataPointerGL);
        
        // Non-Power-of-Two Texture Dimensions
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, ws.width+2,ws.height+2,0, gl.LUMINANCE, gl.FLOAT, ws.activeWaveMap);
        gl.uniform1i(gl.getUniformLocation(ws.program, "dataTex"), 1);
        
        // Numeric Uniforms
        gl.uniform2f(gl.getUniformLocation(ws.program, "mapSize"), ws.width+2,ws.height+2);
        gl.uniform1f(gl.getUniformLocation(ws.program, "dispFactor"), ws.dispFactor);
        gl.uniform1f(gl.getUniformLocation(ws.program, "lumFactor"), ws.lumFactor);
        
        return ws.program;
        
    }

        ws.render = function(gl, moves, canvas) {
        //canvas.clear();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // specify gl.clearColor?
        
        for (g=0, fl=0; g < ws.tempWaveMap.length; g++) {
            for (b=0; b < ws.tempWaveMap[g].length; b++) {
                ws.tempWaveMap[g][b] = ws.activeWaveMap[fl];
                fl += 1;
            }
        }
        
        for (j=0; j < moves.length; j++) {
            ws.setWave(moves[j],ws.tempWaveMap);
        }
            
        for (x=1; x <= ws.width; x++) {
            for (y=1; y <= ws.height; y++) {
                ws.resolveWaves(ws.inactiveWaveMap, ws.tempWaveMap, x,y);
            }
        }
        
        for (g=0, fl=0; g < ws.inactiveWaveMap.length; g++) {
            for (b=0; b < ws.inactiveWaveMap[g].length; b++) {
                ws.outgoingWaveMap[fl] = ws.inactiveWaveMap[g][b];
                ws.inactiveWaveMap[g][b] = ws.tempWaveMap[g][b];
                fl += 1;
            }
        }
        
        ws.activeWaveMap.set(ws.outgoingWaveMap);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, ws.width+2,ws.height+2,0, gl.LUMINANCE, gl.FLOAT, ws.activeWaveMap);
        
        gl.drawElements(gl.TRIANGLES, ws.program.indices.length, gl.UNSIGNED_BYTE, 0);
    }


**Update:** I've managed to set up my 2D drawing surface using corner vertices. (The tutorial [here][2] was very helpful for getting my foundations in using VAO's.) Now I am trying to work out the best way to upload, store, and manipulate my data.

**SOLVED:** I got my code working, thanks to gman. The wave behavior itself still needs debugging, but everything in terms of the GL pipeline is running as it should. In addition to strange wave behavior, the game lags every several seconds for just a moment and then resumes at normal speed. Performance tests show that non-incremental garbage collection is the cause, and this doesn't happen when the water effect is disabled, so it's definitely something in my code, probably the array `newIndices` being freshly initialized every frame, but I'm not sure. Unless it's something to do with GL's behavior, it's beyond the scope of this question.

Here is the relevant code. All you really need to know outside of what's here is that the GL context, vertex shader for drawing the 2D surface, and VAO are passed in from another object, and that object runs the `render` function every frame.

    function waterStage(gl, vao, vShader) {
    
    var ws = new Object();

    ws.width = game.world.width; ws.height = game.world.height;
    
    // Initialize Background Texture
    ws.img = game.make.bitmapData(ws.width, ws.height);
    
    ws.img.fill(0,10,40);
    ws.img.ctx.strokeStyle = "#5050FF";
    ws.img.ctx.lineWidth = 2;
    ws.img.ctx.moveTo(0,0);
    for (y=0; y < ws.height; y+=10) {
        ws.img.ctx.beginPath();
        ws.img.ctx.moveTo(0,y);
        ws.img.ctx.lineTo(ws.width,y);
        ws.img.ctx.closePath();
        ws.img.ctx.stroke();
    }
    
    ws.img.update();
    
    gl.flExt = gl.getExtension("OES_texture_float");
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    // Source Image
    ws.srcTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ws.srcTexture);
    
        // Enable all texture sizes
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ws.img.imageData);
    
    delete ws.img;
    
    // Map Textures
    
    ws.clearProgram = gl.createProgram();
    gl.attachShader(ws.clearProgram, vShader);
    
    var clearSrc = [
        "precision highp float;",
        
        "void main(void) {",
            "gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);",
        "}"
    ];
    
    clearSrc = clearSrc.join("\n");
    var clearShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(clearShader, clearSrc);
    gl.compileShader(clearShader);
    gl.attachShader(ws.clearProgram, clearShader);
    gl.linkProgram(ws.clearProgram);
    
    ws.mapTextures = [];
    ws.frameBuffers = [];
    for (t=0; t < 2; t++) {
        
        var map = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, map);
        
            // Enable all texture sizes
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Initialize empty texture of the same size as the canvas
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ws.width, ws.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        ws.mapTextures.push(map);
        
        var fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map, 0);
        
        ws.frameBuffers.push(fbo);
        
        gl.useProgram(ws.clearProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); // Set output to new map
        gl.vao_ext.bindVertexArrayOES(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // Blank texture to be copied to in render()
    ws.copyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ws.copyTexture);
    
        // Enable all texture sizes
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ws.width, ws.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    // Blank texture for entering new wave values through GL
    ws.nwTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ws.nwTexture);
    
        // Enable all texture sizes
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ws.width, ws.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    ws.newWaves = new Array(ws.width*ws.height);
    
    ws.nwProgram = gl.createProgram();
    ws.mapProgram = gl.createProgram();
    ws.displaceProgram = gl.createProgram();
    
    gl.attachShader(ws.nwProgram, vShader);
    gl.attachShader(ws.mapProgram, vShader);
    gl.attachShader(ws.displaceProgram, vShader);
    
    var nwSrc = [
        "precision highp float;",
        
        "uniform sampler2D newWaves;",
        "uniform sampler2D previous;",
        "uniform vec2 size;",
        
        "void main(void) {",
            "vec2 texCoord = vec2((gl_FragCoord.x/size.x),(gl_FragCoord.y/size.y));",
            "float nw = texture2D(newWaves, texCoord).r;",
        
            "if (nw == 0.0) {",
                "gl_FragColor = texture2D(previous, texCoord);",
            "}",
            "else {",
                "float current = texture2D(previous, texCoord).r;",
                "nw = float(current+nw);",
                "gl_FragColor = vec4(nw, nw, nw, 1.0);",
            "}",
        "}"
    ]
    
    nwSrc = nwSrc.join("\n");
    var nwShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(nwShader, nwSrc);
    gl.compileShader(nwShader);
    
    console.log(gl.getShaderInfoLog(nwShader));
    
    gl.attachShader(ws.nwProgram, nwShader);
    gl.linkProgram(ws.nwProgram);
    
    var mapSrc = [
        "precision highp float;",
        
        "uniform sampler2D previous;",
        "uniform sampler2D current;",
        "uniform vec2 size;",
        "uniform float damper;",
        
        "void main(void) {",
            "vec4 surrounding;",
            "vec2 texCoord = vec2((gl_FragCoord.x/size.x),(gl_FragCoord.y/size.y));",
        
            "float active = texture2D(current, texCoord).r-0.5;",
        
            "vec2 shifted = vec2(((gl_FragCoord.x-1.0)/size.x),texCoord.y);", // x-1
        
            "if (gl_FragCoord.x == 0.0) {",
                "surrounding.x = 0.0;",
            "}",
            "else {",
                "surrounding.x = texture2D(previous, shifted).r-0.5;",
            "}",
        
            "shifted = vec2(((gl_FragCoord.x+1.0)/size.x),texCoord.y);", // x+1
        
            "if (gl_FragCoord.x == size.x-1.0) {",
                "surrounding.z = 0.0;",
            "}",
            "else {",
                "surrounding.z = texture2D(previous, shifted).r-0.5;",
            "}",
        
            "shifted = vec2(texCoord.x,((gl_FragCoord.y-1.0)/size.y));", // y-1
        
            "if (gl_FragCoord.y == 0.0) {",
                "surrounding.y = 0.0;",
            "}",
            "else {",
                "surrounding.y = texture2D(previous, shifted).r-0.5;",
            "}",
        
            "shifted = vec2(texCoord.x,((gl_FragCoord.y+1.0)/size.y));", // y+1
        
            "if (gl_FragCoord.y == size.y-1.0) {",
                "surrounding.w = 0.0;",
            "}",
            "else {",
                "surrounding.w = texture2D(previous, shifted).r-0.5;",
            "}",
        
            "active = ((surrounding.x+surrounding.y+surrounding.z+surrounding.w)/2.0)-active;",
            "active = active-(active/damper);",
            "gl_FragColor = vec4(active+0.5, active+0.5, active+0.5, 1.0);",
            // "gl_FragColor = texture2D(current, vec2(gl_FragCoord.x/size.x),(gl_FragCoord.y/size.y));",
        "}"
    ];
    
    
    mapSrc = mapSrc.join("\n");
    var mapShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(mapShader, mapSrc);
    gl.compileShader(mapShader);
    
    console.log(gl.getShaderInfoLog(mapShader));
    
    gl.attachShader(ws.mapProgram, mapShader);
    gl.linkProgram(ws.mapProgram);
    
    var displaceSrc = [
        "precision highp float;",
        
        "uniform sampler2D current;",
        "uniform sampler2D srcImg;",
        "uniform vec2 size;",
        "uniform float dspFactor;",
        "uniform float lumFactor;",
        
        "void main(void) {",
            
            "vec2 texCoord = vec2((gl_FragCoord.x/size.x),(gl_FragCoord.y/size.y));",
        
            "float wave = texture2D(current, texCoord).r-0.5;",
            "float displacement = wave * dspFactor * 1.5;",
        
            "if (displacement == 0.0) {",
                "gl_FragColor = texture2D(srcImg, texCoord);",
            "}",
            "else {",
        
                "if (displacement < 0.0) {",
                    "displacement = displacement + 1.0;",
                "}",
        
                "float lum = wave * lumFactor;",
                "if (lum > 0.16) { lum = 0.16; }",
                "else if (lum < -0.16) { lum = -0.16; }",
        
                "float dspX = (gl_FragCoord.x+displacement);",
                "float dspY = (gl_FragCoord.y+displacement);",
        
                "if (dspX < 0.0) { dspX = 0.0; }",
                "else if (dspX >= size.x) { dspX = size.x-1.0; }",
                "if (dspY < 0.0) { dspY = 0.0; }",
                "else if (dspY >= size.y) { dspY = size.y-1.0; }",
            
                "vec2 srcCoord = vec2((dspX/size.x),(dspY/size.y));",
        
                // Just for testing
                //"gl_FragColor = texture2D(current, vec2((gl_FragCoord.x/size.x),(gl_FragCoord.y/size.y)));",

                "vec4 newColor = texture2D(srcImg, srcCoord);", // srcCoord
                "gl_FragColor.r = newColor.r+lum;",
                "gl_FragColor.g = newColor.g+lum;",
                "gl_FragColor.b = newColor.b+lum;",
            "}",
        "}"
        
    ];
    
    displaceSrc = displaceSrc.join("\n");
    var displaceShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(displaceShader, displaceSrc);
    gl.compileShader(displaceShader);
    
    console.log(gl.getShaderInfoLog(displaceShader));
    
    gl.attachShader(ws.displaceProgram, displaceShader);
    gl.linkProgram(ws.displaceProgram);
    
    ws.render = function(gl, vao, moves) {
        // Calculate wave values as texture data, then render to screen with displacement fragment shader
        
        if (moves.length > 0) {
            
            for (x=0, len=ws.width*ws.height; x < len; x++) {
                ws.newWaves[x] = 0;
            }
            
            var newIndices = [];
            for (m=0; m < moves.length; m++) {
                newIndices.push(moves[m].y*ws.width + moves[m].x);
            }
            
            for (i=0; i < newIndices.length; i++) {
                ws.newWaves[newIndices[i]] = moves[i].magnitude/1;
            }
            
            gl.useProgram(ws.nwProgram);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, ws.nwTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, ws.width, ws.height, 0, gl.LUMINANCE, gl.FLOAT, new Float32Array(ws.newWaves));
            gl.uniform1i(gl.getUniformLocation(ws.nwProgram, "newWaves"), 0);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, ws.copyTexture);
            gl.uniform1i(gl.getUniformLocation(ws.nwProgram, "previous"), 1);
            
            gl.bindFramebuffer(gl.FRAMEBUFFER, ws.frameBuffers[0]); // Set output to previous map texture [0]
            gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, ws.width, ws.height, 0); // Copy mapTextures[0] into copyTexture
            
            gl.uniform2f(gl.getUniformLocation(ws.nwProgram, "size"), ws.width, ws.height);
            
            gl.vao_ext.bindVertexArrayOES(vao);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        
        // Map Texture Manipulation
        gl.useProgram(ws.mapProgram);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ws.mapTextures[0]);
        gl.uniform1i(gl.getUniformLocation(ws.mapProgram, "previous"), 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, ws.copyTexture);
        gl.uniform1i(gl.getUniformLocation(ws.mapProgram, "current"), 1);
        
        gl.uniform2f(gl.getUniformLocation(ws.mapProgram, "size"), ws.width, ws.height);
        gl.uniform1f(gl.getUniformLocation(ws.mapProgram, "damper"), 1000);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, ws.frameBuffers[1]); // Set output to current map texture [1]
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, ws.width, ws.height, 0); // Copy mapTextures[1] into copyTexture
        gl.vao_ext.bindVertexArrayOES(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // Output Texture Manipulation
        gl.useProgram(ws.displaceProgram);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ws.mapTextures[1]);
        gl.uniform1i(gl.getUniformLocation(ws.displaceProgram, "current"), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, ws.srcTexture);
        gl.uniform1i(gl.getUniformLocation(ws.displaceProgram, "srcImg"), 1);
        gl.uniform2f(gl.getUniformLocation(ws.displaceProgram, "size"), ws.width, ws.height);
        gl.uniform1f(gl.getUniformLocation(ws.displaceProgram, "dspFactor"), 20);
        gl.uniform1f(gl.getUniformLocation(ws.displaceProgram, "lumFactor"), 0.5);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Output to canvas
        gl.vao_ext.bindVertexArrayOES(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        ws.mapTextures.sort(function(a,b) { return 1; });
        ws.frameBuffers.sort(function(a,b) { return 1; });
    }

  [1]: https://www.gamedev.net/resources/_/technical/graphics-programming-and-theory/the-water-effect-explained-r915
  [2]: https://capnramses.github.io/opengl/webgl_starter.html

# Answer

You can't read the contents of the canvas in WebGL from a shader so instead you need to create a texture and attach that texture to a framebuffer (a framebuffer is just a collection of attachments). This way you can render to the texture and use the result in other renders

Next up, [textures, at least in WebGL 1, are always referenced by texture coordinates which go from 0 to 1](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) so this code doesn't make much sense

      vec2 mapCoord = vec2(gl_FragCoord.x+1.5, gl_FragCoord.y+1.5);
      float wave = texture2D(dataTex, mapCoord).r;

`gl_FragCoord` is not in texture coordinates it's in absolute destination pixels meaning if you rectangle in the middle of the screen `gl_FragCoord` will have the dest pixel coordinates (not starting at 0). As for the +1.5, 1.5 in any direction in texture coordinates is 1.5 * the width or height of the texture.

If you want to look one pixel left or right you need to know the size of the texture. 

One pixel unit in texture coordinates is `1 / width` in across and `1 / height` down. So in other words, if you have some texture coordinate that references a pixel

     vec2 texcoord = vec2(0.5, 0.5);  // center of texture

And you want to get one pixel to the right it's

     vec2 onePixelRight = texcoord + vec2(1.0 / textureWidth, 0);

The width of a `textureWidth` is not passed in in WebGL1 so you'll have to make a uniform and pass it in yourself.

You can see [an example of rendering to a texture through a framebuffer and reading from nearby pixels here](http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html)

Looking at the link you posted you need 4 textures

* 1 texture is your image (I guess you want to displace this?)
* 1 texture is your current wave
* 1 texture is your previous wave
* 1 texture is your next wave

And you need 3 framebuffers. One for each wave

*   Each frame
    *  bind framebuffer that uses next wave so you'll be rendering to next wave
    *  render using shader that computes current wave from previous wave
    *  bind null for framebuffer so you'll be rendering to canvas
    *  render using shader that uses current wave texture as displacement of image texture
    *  swap newWave to current, current to prev, prev to next

       note: (This just means changing variables in the code, no data needs to be moved)

Here's some code based on the original. Since I can't run the original I have no idea what it's supposed to look like. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      var width = 256;
      var height = 256;
      var gl = document.querySelector("canvas").getContext("webgl");
      var flExt = gl.getExtension("OES_texture_float");
      // you should always check for this unless you want confused users
      if (!flExt) {
        alert("no floating point textures available on your system");
        return;
      }

      // the algoritm from the article requires all textures and the canvas
      // to be the same size
      gl.canvas.width = width;
      gl.canvas.height = height;


      // template literals or script tags are way easier than arrays of strings
      var vertSrc = `
    attribute vec4 position;

    void main(void) {
      gl_Position = position;
    }
    `;

      var waveFragSrc = `
    precision highp float;

    uniform sampler2D currentSourceMap;
    uniform sampler2D previousResultMap;

    uniform float damp;
    uniform vec2 textureSize;

    void main(void) {
      vec2 onePixel = 1. / textureSize;

      // this only works because we're drawing a quad the size of the texture
      // normally I'd pass in texture coords
      vec2 xy = gl_FragCoord.xy / textureSize;

      vec4 n = 
        (texture2D(currentSourceMap, xy + onePixel * vec2(-1, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-2, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+2, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,-2)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,+1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,+2)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-1,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-1,+1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1,+1))
        ) / 6.0 - texture2D(previousResultMap, xy);
       gl_FragColor = n - n / damp;

    }

    `;

      // need another shader to draw the result texture to the screen
      var displaceFragSrc = `
    precision highp float;

    uniform vec2 resolution;
    uniform sampler2D waveMap;
    uniform sampler2D backgroundImage;
    uniform float rIndex;

    // this code assumes the wavemap and the image and the destination
    // are all the same resolution
    void main() {
       vec2 onePixel = 1. / resolution;

       // this only works because we're drawing a quad the size of the texture
       // normally I'd pass in texture coords
       vec2 xy = gl_FragCoord.xy / resolution;

       float xDiff = floor(texture2D(waveMap, xy + onePixel * vec2(1, 0)) -
                           texture2D(waveMap, xy)).r;
       float yDiff = floor(texture2D(waveMap, xy + onePixel * vec2(0, 1)) -
                           texture2D(waveMap, xy)).r;

       float xAngle = atan( xDiff );
       float xRefraction = asin( sin( xAngle ) / rIndex );
       float xDisplace = floor( tan( xRefraction ) * xDiff );

       float yAngle = atan( yDiff );
       float yRefraction = asin( sin( yAngle ) / rIndex );
       float yDisplace = floor( tan( yRefraction ) * yDiff );

       if (xDiff < 0.) {
          // { Current position is higher - Clockwise rotation }
          if (yDiff < 0.) {
            gl_FragColor = texture2D(
                backgroundImage, xy + onePixel * vec2(-xDisplace, -yDisplace));
       } else {
            gl_FragColor = texture2D(
                 backgroundImage, xy + onePixel * vec2(-xDisplace, +yDisplace));
          }
       } else {
          // { Current position is lower - Counterclockwise rotation }
          if (yDiff < 0.) {
            gl_FragColor = texture2D(backgroundImage, vec2(+xDisplace, -yDisplace));
       } else {
            gl_FragColor = texture2D(backgroundImage, vec2(+xDisplace, +yDisplace));
          }
       }
    }

    `;

      // use some boilerplate. I'm too lazy to type all the code for looking
      // up uniforms and setting them when a tiny piece of code can hide all
      // that for me. Look up the library if it's not clear that `setUniforms`
      // does lots of `gl.uniformXXX` etc...

      // also Use **MUST** look up the attribute locations or assign them with
      // gl.bindAttribLocation **BEFORE** linking otherwise your code
      // is not portable and may not match across programs. This boilerplate
      // calls gl.bindAttributeLocation for the names passed in the 3rd argument
      var waveProgramInfo = twgl.createProgramInfo(gl, [vertSrc, waveFragSrc], ["position"]);
      var displaceProgramInfo = twgl.createProgramInfo(gl, [vertSrc, displaceFragSrc], ["position"]);

      var positionLocation = 0; // see above

      // Vertex Data for rendering surface
      // no reason for 3d points when drawing 2d
      // Not using indices. It's several more lines of un-needed code
      var vertices = new Float32Array([
        -1,-1,  1,-1, -1,1,
         1,-1, -1, 1,  1,1,
      ]);

      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      // Send texture data from tex to WebGL
      var imageTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, imageTex);

      // since we don't have an image lets make one with a canvas 2d.
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      for (var y = 0; y < width; y += 16) {
        for (var x = 0; x < height; x += 16) {
          ctx.fillStyle = "rgb(" + x / width * 256 +
                          ","    + y / height * 256 +
                          ","    + (x / 16 + y / 16) % 2 * 255 +
                          ")";
          ctx.fillRect(x, y, 16, 16);
        }
      }

      // Non-Power-of-Two Texture Dimensions
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);


      // make some data for the wave
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = "rgb(1,1,1)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2,
              ctx.canvas.width / 3, 0, Math.PI * 2, false);
      ctx.stroke();

      // You can NOT use any kind of filtering on FLOAT textures unless
      // you check for and enable OES_texture_float_linear. Note that
      // no mobile devices support it as of 2017/1

      // create 3 wave textures and 3 framebuffers, prevs, current, and next
      var waves = [];
      for (var i = 0; i < 3; ++i) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Non-Power-of-Two Texture Dimensions
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, ctx.canvas);

        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                                tex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          alert("can not render to floating point textures");
          return;
        }
        waves.push({ texture: tex, framebuffer: fb });
      }

      function render() {
        var previousWave = waves[0];
        var currentWave = waves[1];
        var nextWave = waves[2];

        // while you're only drawing 1 thing at the moment if you want to draw
        // more than one you'll need to set attributes before each draw if
        // data changes

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // draw to next wave
        gl.bindFramebuffer(gl.FRAMEBUFFER, nextWave.framebuffer);
        gl.viewport(0, 0, width, height);

        gl.useProgram(waveProgramInfo.program);

        // pass current and previous textures to shader
        twgl.setUniforms(waveProgramInfo, {
          currentSourceMap: currentWave.texture,
          previousResultMap: previousWave.texture,
          textureSize: [width, height],
          damp: 4,
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(displaceProgramInfo.program);

        // pass in the next wave to the displacement shader
        twgl.setUniforms(displaceProgramInfo, {
          waveMap: nextWave.texture,
          backgroundImage: imageTex,
          resolution: [gl.canvas.width, gl.canvas.height],
          rIndex: 4,
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // swap the buffers. 
        var temp = waves[0];
        waves[0] = waves[1];
        waves[1] = waves[2];
        waves[2] = temp;
        
        requestAnimationFrame(render);
      }
      
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

The effect is very old school as it's pixel based and lots of integers whereas shaders use floating point. I get the impression the exact algorithm is not really a good match for shaders. Or rather you could get much better results with a different algorithm.  


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      var width = 256;
      var height = 256;
      var gl = document.querySelector("canvas").getContext("webgl");
      var flExt = gl.getExtension("OES_texture_float");
      // you should always check for this unless you want confused users
      if (!flExt) {
        alert("no floating point textures available on your system");
        return;
      }

      // the algoritm from the article requires all textures and the canvas
      // to be the same size
      gl.canvas.width = width;
      gl.canvas.height = height;


      // template literals or script tags are way easier than arrays of strings
      var vertSrc = `
    attribute vec4 position;

    void main(void) {
      gl_Position = position;
    }
    `;  
      var waveFragSrc = `
    precision highp float;

    uniform sampler2D currentSourceMap;
    uniform sampler2D previousResultMap;

    uniform float damp;
    uniform vec2 textureSize;

    void main(void) {
      vec2 onePixel = 1. / textureSize;

      // this only works because we're drawing a quad the size of the texture
      // normally I'd pass in texture coords
      vec2 xy = gl_FragCoord.xy / textureSize;

      vec4 n = 
        (texture2D(currentSourceMap, xy + onePixel * vec2(-1, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-2, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+2, 0)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,-2)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,+1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2( 0,+2)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-1,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1,-1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(-1,+1)) +
         texture2D(currentSourceMap, xy + onePixel * vec2(+1,+1))
        ) / 6.0 - texture2D(previousResultMap, xy);
       gl_FragColor = n - n / damp;

    }

    `;

      // need another shader to draw the result texture to the screen
      var displaceFragSrc = `
    precision highp float;

    uniform vec2 resolution;
    uniform sampler2D waveMap;
    uniform sampler2D backgroundImage;
    uniform float fudge;

    // this code assumes the wavemap and the image and the destination
    // are all the same resolution
    void main() {
       vec2 onePixel = 1. / resolution;

       // this only works because we're drawing a quad the size of the texture
       // normally I'd pass in texture coords
       vec2 xy = gl_FragCoord.xy / resolution;

       float xDiff = (texture2D(waveMap, xy + onePixel * vec2(1, 0)) -
                      texture2D(waveMap, xy)).r;
       float yDiff = (texture2D(waveMap, xy + onePixel * vec2(0, 1)) -
                      texture2D(waveMap, xy)).r;

       gl_FragColor = texture2D(
          backgroundImage, xy + onePixel * vec2(xDiff, yDiff) * fudge);
    }

    `;
      
      var pntVertSrc = `
    uniform vec2 position;
    uniform float pointSize;

    void main(void) {
      gl_Position = vec4(position, 0, 1);
      gl_PointSize = pointSize; 
    }
    `;  
      var pntFragSrc = `
    precision mediump float;

    void main(void) {
      gl_FragColor = vec4(1);
    }
    `;  
      

      // use some boilerplate. I'm too lazy to type all the code for looking
      // up uniforms and setting them when a tiny piece of code can hide all
      // that for me. Look up the library if it's not clear that `setUniforms`
      // does lots of `gl.uniformXXX` etc...

      // also Use **MUST** look up the attribute locations or assign them with
      // gl.bindAttribLocation **BEFORE** linking otherwise your code
      // is not portable and may not match across programs. This boilerplate
      // calls gl.bindAttributeLocation for the names passed in the 3rd argument
      var waveProgramInfo = twgl.createProgramInfo(
        gl, [vertSrc, waveFragSrc], ["position"]);
      var displaceProgramInfo = twgl.createProgramInfo(
        gl, [vertSrc, displaceFragSrc], ["position"]);
      var pntProgramInfo = twgl.createProgramInfo(
        gl, [pntVertSrc, pntFragSrc], ["position"]);
      
      var positionLocation = 0; // see above

      // Vertex Data for rendering surface
      // no reason for 3d points when drawing 2d
      // Not using indices. It's several more lines of un-needed code
      var vertices = new Float32Array([
        -1,-1,  1,-1, -1,1,
         1,-1, -1, 1,  1,1,
      ]);

      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      // Send texture data from tex to WebGL
      var imageTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, imageTex);

      // since we don't have an image lets make one with a canvas 2d.
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      for (var y = 0; y < width; y += 16) {
        for (var x = 0; x < height; x += 16) {
          ctx.fillStyle = "rgb(" + x / width * 256 +
                          ","    + y / height * 256 +
                          ","    + (x / 16 + y / 16) % 2 * 255 +
                          ")";
          ctx.fillRect(x, y, 16, 16);
        }
      }

      // Non-Power-of-Two Texture Dimensions
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);


      // make some data for the wave
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = "rgb(255,255,255)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2,
              ctx.canvas.width / 3, 0, Math.PI * 2, false);
      ctx.stroke();

      // You can NOT use any kind of filtering on FLOAT textures unless
      // you check for and enable OES_texture_float_linear. Note that
      // no mobile devices support it as of 2017/1

      // create 3 wave textures and 3 framebuffers, prevs, current, and next
      var waves = [];
      for (var i = 0; i < 3; ++i) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Non-Power-of-Two Texture Dimensions
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, ctx.canvas);

        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
                                tex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          alert("can not render to floating point textures");
          return;
        }
        waves.push({ texture: tex, framebuffer: fb });
      }

      function render(time) {
        time *= 0.001; // convert to seconds
        
        var previousWave = waves[0];
        var currentWave = waves[1];
        var nextWave = waves[2];

        // while you're only drawing 1 thing at the moment if you want to draw
        // more than one you'll need to set attributes before each draw if
        // data changes

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // draw to next wave
        gl.bindFramebuffer(gl.FRAMEBUFFER, nextWave.framebuffer);
        gl.viewport(0, 0, width, height);

        gl.useProgram(waveProgramInfo.program);

        // pass current and previous textures to shader
        twgl.setUniforms(waveProgramInfo, {
          currentSourceMap: currentWave.texture,
          previousResultMap: previousWave.texture,
          textureSize: [width, height],
          damp: 40,
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // draw dot to next wave add waves
        gl.useProgram(pntProgramInfo.program);
        
        twgl.setUniforms(pntProgramInfo, {
          position: [ Math.sin(time * 0.71), Math.cos(time) ],
          pointSize: 8,
        });
        gl.drawArrays(gl.POINTS, 0, 1);

        // draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(displaceProgramInfo.program);

        // pass in the next wave to the displacement shader
        twgl.setUniforms(displaceProgramInfo, {
          waveMap: nextWave.texture,
          backgroundImage: imageTex,
          resolution: [gl.canvas.width, gl.canvas.height],
          fudge: 100,
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // swap the buffers. 
        var temp = waves[0];
        waves[0] = waves[1];
        waves[1] = waves[2];
        waves[2] = temp;
        
        requestAnimationFrame(render);
      }
      
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

  
