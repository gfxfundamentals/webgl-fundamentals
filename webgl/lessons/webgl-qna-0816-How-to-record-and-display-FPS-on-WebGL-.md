Title: How to record and display FPS on WebGL?
Description:
TOC: qna

# Question:

I am trying to display the frames per second on my html canvas. I dont mind where its placed on the canvas for now as I can tweak it at later period. Here what I have so far:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->


            var updateAnimation = function () {

                requestAnimFrame(updateAnimation);

                var anim = global.animation;
                var e = global.events;

                //Set current time
                anim.animationCurrentTime = Date.now();
                //Set start time
                if (anim.animationStartTime === undefined) {
                    anim.animationStartTime = anim.animationCurrentTime;
                }

                //Clear the animationStage
                webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);



                //Draw scene
                drawScene();


                //Set previous time as current time to use in next frame
                anim.animationLastTime = anim.animationCurrentTime;
            }

            global.document.animationStage = document.getElementById("animation-scene");

            webgl = setupScene(global.document.animationStage);

            setupShaders();
            setupAllBuffers();
            setupEvents();
            setupLight();
            setupTextures();

            initScene();
            }

<!-- language: lang-html -->

    <header>
        <h1 style="text-align: center">Applied Computer Graphics and Vision</h1>
        <p>Instructions<span>
        <br />
        <br />
        Rotation - Click and drag in the direction of rotation <br />
        Increase/Decrease Orbit Radius - Up and Down Keys <br />
        Increase/Decrease Orbit Speed - Left and Right Keys <br />
        Translation Of X - Shift plus mouse drag <br />
        Translation Of Y - Alt plus mouse drag <br />
        Translation Of Z - Mouse scroll
        </span></p>
    </header>

    <canvas style="float:left" ; id="animation-scene"></canvas>
    <canvas id="myCanvas" width="1400" height="800"></canvas>
    <script>
     /* Sets */
        var area = document.getElementById('animation-scene');
        area.setAttribute('height', window.innerHeight);
        area.setAttribute('width', window.innerWidth);
    </script>
    </body>
    </html>


<!-- end snippet -->

Any help or advice would be great. I know the basic idea of having to count the number of frames rendered and once one second has passed store that in the fps variable but not sure on how to implement this through my update animation function.

I also have methods that sets the current/start time for the scene within the update animation function.

# Answer

Displaying FPSs is pretty simple and has really nothing to do with WebGL other than it's common to want to know. Here's a small FPS display

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fpsElem = document.querySelector("#fps");

    let then = 0;
    function render(now) {
      now *= 0.001;                          // convert to seconds
      const deltaTime = now - then;          // compute time since last frame
      then = now;                            // remember time for next frame
      const fps = 1 / deltaTime;             // compute frames per second
      fpsElem.textContent = fps.toFixed(1);  // update fps display
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-html -->

    <div>fps: <span id="fps"></span></div>


<!-- end snippet -->

You should probably not use `Date.now()` for computing FPS as `Date.now()` only returns milliseconds. `requestAnimationFrame` already gets passed the time in microseconds since the page loaded.

Also you don't really "place it on the canvas". Just use another HTML element separate from the canvas. If you want them to overlap then use CSS to make them overlap

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("#c").getContext("webgl");
    const fpsElem = document.querySelector("#fps");

    let then = 0;
    function render(now) {
      now *= 0.001;                          // convert to seconds
      const deltaTime = now - then;          // compute time since last frame
      then = now;                            // remember time for next frame
      const fps = 1 / deltaTime;             // compute frames per second
      fpsElem.textContent = fps.toFixed(1);  // update fps display
      
      drawScene(now);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function drawScene(time) {
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(1, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const halfWidth = gl.canvas.width / 2;
      const halfHeight = gl.canvas.height / 2
      const x = halfWidth - f(time) * halfWidth;
      const y = halfHeight - f(time * 1.17) * halfHeight;
      const w = (halfWidth - x) * 2;
      const h = (halfHeight - y ) * 2;
      gl.scissor(x, y, w, h);
      gl.enable(gl.SCISSOR_TEST);
      gl.clearColor(f(time * 1.1), f(time * 1.3), f(time * 1.2), 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function f(v) {
      return Math.sin(v) * .5 + .5;
    }

<!-- language: lang-css -->

    #container {
      position: relative;   /* needed so child elements use this as their base */
    }
    #hud {
      position: absolute;
      left: 5px;
      top: 5px;
      background: rgba(0, 0, 0, 0.5);  /* 50% opaque black */
      color: white;
      padding: .5em;
      font-family: monospace;
      border-radius: .5em;
    }
      

<!-- language: lang-html -->

    <div id="container">
      <canvas id="c"></canvas>
      <div id="hud">fps: <span id="fps"></span></div>
    </div>

<!-- end snippet -->


