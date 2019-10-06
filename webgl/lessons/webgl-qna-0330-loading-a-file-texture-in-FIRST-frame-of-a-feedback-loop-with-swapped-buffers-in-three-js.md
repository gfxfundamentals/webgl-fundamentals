Title: loading a file texture in FIRST frame of a feedback loop with swapped buffers in three.js
Description:
TOC: qna

# Question:

I'm working on a website in three.js using several feedback shader loops (texture pingpong). 

When someone visits the site, the loop should continue from a certain point (depending on when he/she visits). To achieve this I intend to load a picture (eg a jpeg) from the server in the first frame, render this to my pingpong buffers and continue with my normal feedback loop from frame 2 onwards.

Here's a stripped down version of my problem, as a feedback function i simply add a small value to the color of the pixel in the previous frame.


    <!DOCTYPE html>
    <html lang="en">
     <head>
      <meta charset="utf-8">
      <title>feedbacktest</title>
      <style>canvas { width: 100%; height: 100%; }</style>
     </head>
     <body>
      <!-- Main THREE includes -->
      <script src="js/three.min.js"></script>
      <script src="js/Detector.js"></script>
      <!-------------------->
      <!-- Shaders   -->
      <!-------------------->
                    
                <!-- no change vertex shader. used for all render stages. -->
      <script id="vs_output" type="x-shader/x-vertex">
         
       varying vec2 texCoord;
    
       void main(void)
       {
        texCoord = uv;        
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
       }
      </script>
         
      <!-- feedback shader -->
      <script id="fs_feedback" type="x-shader/x-fragment">  
       // switch on high precision floats
       #ifdef GL_ES
       precision highp float;
       #endif  
       uniform sampler2D texture;
       uniform sampler2D texture2;
       varying vec2 texCoord;
       uniform float onOpen;
    
       void main() 
       {      
        // sample textures
        vec4 result = texture2D(texture, texCoord);
        vec4 startT = texture2D(texture2, texCoord);    
        result.rgb+=0.001;
        result.rgb = mod(result.rgb, 1.0);
     /*   if (onOpen <=1.0){
         result.rgb=startT.rgb;
        }*/
        result.a = 1.0;         
        gl_FragColor = result;    
       }
      </script>
    
      <!-- Final pass fragment shader. -->
      <script id="fs_output" type="x-shader/x-fragment">
      
       uniform sampler2D fb2output;      
       varying vec2 texCoord;
    
       void main (void)
       {
        vec4 col = texture2D(fb2output, texCoord);      
        gl_FragColor = col;
       }
      </script>
    
        <!-- init shader. -->
      <script id="fs_start" type="x-shader/x-fragment">
      
       uniform sampler2D texture;      
       varying vec2 texCoord;
    
       void main (void)
       {
        vec4 col = texture2D(texture, texCoord);
           
        gl_FragColor = col;
       }
      </script>
    
      <!-------------------->
      <!-- Main Logic  -->
      <!-------------------->
      <script>
       if (!Detector.webgl)
       {
        Detector.addGetWebGLMessage();
       }
       //------------------------------------------
       // Globals
       //------------------------------------------
       var cameraLoop, cameraOutput, sceneFeedback, sceneOutput, renderer, sceneStart;
       var feedbackTexture, feedbackTexture2, loadTexture;   
       var feedbackUniforms, mainUniforms, startUniforms;
       var feedbackQuad, screenQuad, startQuad;
       var feedbackMat, screenMat, startMat;
                var loopRes = new THREE.Vector2(64.0, 64.0);
       var outputRes = new THREE.Vector2(512.0, 512.0);
          
       var doLoad =0.0;
    //   var onOpen = 0.0;
          
       var renderTargetNearestFloatParams = {
        minFilter:THREE.NearestFilter,
        magFilter:THREE.NearestFilter,
        wrapS:THREE.ClampToEdgeWrapping,
        wrapT:THREE.ClampToEdgeWrapping,
        format:THREE.RGBAFormat,
        stencilBuffer:false,
        depthBuffer:false,
        needsUpdate:true,
        type:THREE.FloatType
       };
       
       //------------------------------------------
       // Main init and loop
       //------------------------------------------
       start();
       update();
    
       //------------------------------------------
       // Initialization
       //------------------------------------------
       function start() 
       { 
           
        //setup scenes   
        sceneOutput = new THREE.Scene();
        sceneFeedback = new THREE.Scene();
        sceneStart = new THREE.Scene();
        
        //setup renderer
        renderer = new THREE.WebGLRenderer({ precision:"highp"});
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(0x808080);
        renderer.autoClear = false;
        document.body.appendChild( renderer.domElement ); 
           
        // create buffers
        feedbackTexture = new THREE.WebGLRenderTarget( loopRes.x, loopRes.y, renderTargetNearestFloatParams );    
        feedbackTexture2 = new THREE.WebGLRenderTarget( loopRes.x, loopRes.y, renderTargetNearestFloatParams ); 
    
        // load a texture, set wrap mode
        var loadTexture = THREE.ImageUtils.loadTexture( "textures/tes2t.jpg" );
        loadTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadTexture.minFilter = THREE.NearestFilter;
        loadTexture.magFilter = THREE.NearestFilter;
        loadTexture.format = THREE.RGBAFormat;
        loadTexture.type = THREE.FloatType;
        
        // Setup algorithm camera
        cameraLoop = new THREE.OrthographicCamera( loopRes.x / - 2, loopRes.x / 2, loopRes.y / 2, loopRes.y / - 2, -10000, 10000 );
        
        // Setup sceneOutput camera
        cameraOutput = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 1, 10000 );
        cameraOutput.position.z = 300;
               
        // feedback shader
        feedbackUniforms = {
         texture: { type: "t", value: feedbackTexture2 },
         texture2: { type: "t", value: loadTexture },
         onOpen: { type: "f", value: 0.0 },
        };
        feedbackMat = new THREE.ShaderMaterial({
         uniforms: feedbackUniforms,
         vertexShader: document.getElementById( 'vs_output' ).textContent,
         fragmentShader: document.getElementById( 'fs_feedback' ).textContent
        });    
        var feedbackGeo = new THREE.PlaneBufferGeometry( loopRes.x, loopRes.y );
        feedbackQuad = new THREE.Mesh( feedbackGeo, feedbackMat );
        feedbackQuad.position.z = -100;
        sceneFeedback.add( feedbackQuad );
               
        // output shader
        mainUniforms = {
         fb2output: { type: "t", value: feedbackTexture2 },     
        };    
        screenMat = new THREE.ShaderMaterial({
         uniforms: mainUniforms,
         vertexShader: document.getElementById( 'vs_output' ).textContent,
         fragmentShader: document.getElementById( 'fs_output' ).textContent,
        });
        var screenGeo = new THREE.PlaneBufferGeometry( outputRes.x, outputRes.y );    
        sceneQuad = new THREE.Mesh( screenGeo , screenMat );
        sceneQuad.position.z = -200;
        sceneOutput.add( sceneQuad );    
        
           // init shader
        startUniforms = {
         texture: { type: "t", value: loadTexture },     
        };    
        startMat = new THREE.ShaderMaterial({
         uniforms: startUniforms,
         vertexShader: document.getElementById( 'vs_output' ).textContent,
         fragmentShader: document.getElementById( 'fs_start' ).textContent,
        });
        var startGeo = new THREE.PlaneBufferGeometry(  loopRes.x, loopRes.y );    
        startQuad = new THREE.Mesh( startGeo , startMat );
        startQuad.position.z = -100;
        sceneStart.add( startQuad );    
       }   
      
    
       //------------------------------------------
       // Main loop
       //------------------------------------------
       function update() 
       {
        requestAnimationFrame( update );
        console.debug(doLoad.toString());
        render();    
       }
       
       //------------------------------------------
       // Main rendering
       //------------------------------------------
       function render() 
       {
        renderer.clear();
                
        if (doLoad < 1.0){
    
         renderer.render( sceneStart, cameraLoop, feedbackTexture2);
    
         doLoad = 1.0;
    
        } else {
    
        renderer.render( sceneFeedback, cameraLoop, feedbackTexture);
    
        var a = feedbackTexture2;
        feedbackTexture2 = feedbackTexture;
        feedbackTexture = a;
        feedbackUniforms.texture.value = feedbackTexture2;
        }
    
        renderer.render( sceneOutput, cameraOutput );
     //   feedbackUniforms.onOpen.value += 0.5;
       }
    
      </script>
     </body>
    </html>  



As you can see in the render function I'm trying to render sceneStart in Frame 1 and sceneFeedback afterwards (if/else block). Unfortunately, this doesn't work. I've tried all kinds of stuff, also doing the switch to the start texture in the shader itself (see commented code), but no luck.
I found out that when I change the line 

    doLoad = 1.0;

to

    doLoad +=0.4;

or anything below 0.5 it will work. So as I understand it has to write 3 times into my feedback buffer until the normal loop can work from there....but WHY?

Writing into both feedback textures in the first frame also doesn't work, as you might suggest....

Unfortunately, rendering it for 3 frames is no solution for me, as it will break one of my actual shaders involved and also brings up other issues which are supposedly way more complicated to solve than loading a picture in the first frame.....

On a sidenote, how can i debug the very first frames of a three.js app? I'm aware of WebGL Inspector but if I slow down the framerate there and then refresh playback settings are back to normal...any suggestions?  

thank you very much!



# Answer

I'm pretty sure you need to wait for the image to load before you start rendering. Images load async so your first few frames will not have the texture loaded yet.

It looks like you're using `THREE.ImageUtils.loadTexture`. [According to the docs](http://threejs.org/docs/#Reference/Extras/ImageUtils.loadTexture) `loadTexture` takes 4 arguments (`.loadTexture (url, mapping, onLoad, onError)`) the 3rd one is a callback when the image is loaded.

You probably don't want to render until the image is loaded. At the beginning of your code you have

    start();
    update();   // delete this line

Delete the update line, then change your `loadTexture` line to

    // load a texture, set wrap mode
    var loadTexture = THREE.ImageUtils.loadTexture( 
        "textures/tes2t.jpg", undefined, update );

That way `update` will be called when the image is finished loading and start rendering.
