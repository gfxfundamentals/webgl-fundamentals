Title: Efficient particle system in javascript? (WebGL)
Description: Efficient particle system in javascript? (WebGL)
TOC: Efficient particle system in javascript? (WebGL)

## Question:

I'm trying to write a program that does some basic gravity physics simulations on particles. I initially wrote the program using the standard Javascript graphics (with a 2d context), and I could get around 25 fps w/10000 particles that way. I rewrote the tool in WebGL because I was under the assumption that I could get better results that way. I am also using the glMatrix library for vector math. However, with this implementation I'm getting only about 15fps with 10000 particles. 

I'm currently an EECS undergrad and I have had a reasonable amount of experience programming, but never with graphics, and I have little clue as to how to optimize Javascript code.
There is a lot I don't understand about how WebGL and Javascript work. What key components affect performance when using these technologies? Is there a more efficient data structure to use to manage my particles (I'm just using a simple array)? What explanation could there be for the performance drop using WebGL? Delays between the GPU and Javascript maybe?

Any suggestions, explanations, or help in general would be greatly appreciated. 

I'll try to include only the critical areas of my code for reference.

Here is my setup code:

    gl = null;
    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    }
    catch(e) {}

    if(gl){
            gl.clearColor(0.0,0.0,0.0,1.0);
            gl.clearDepth(1.0);                 // Clear everything
            gl.enable(gl.DEPTH_TEST);           // Enable depth testing
            gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    
            // Initialize the shaders; this is where all the lighting for the
            // vertices and so forth is established.
    
            initShaders();
    
            // Here's where we call the routine that builds all the objects
            // we'll be drawing.
    
            initBuffers();
        }else{
            alert("WebGL unable to initialize");
        }
    
        /* Initialize actors */
        for(var i=0;i<NUM_SQS;i++){
            sqs.push(new Square(canvas.width*Math.random(),canvas.height*Math.random(),1,1));            
        }

        /* Begin animation loop by referencing the drawFrame() method */
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
        requestAnimationFrame(drawFrame,canvas);

The draw loop: 

    function drawFrame(){
        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        //mvTranslate([-0.0,0.0,-6.0]);
        for(var i=0;i<NUM_SQS;i++){
            sqs[i].accelerate();
            /* Translate current buffer (?) */
            gl.uniform2fv(translationLocation,sqs[i].posVec);
            /* Draw current buffer (?) */;
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        window.requestAnimationFrame(drawFrame, canvas);
    }

Here is the class that Square inherits from:

    function PhysicsObject(startX,startY,size,mass){
        /* Class instances */
        this.posVec = vec2.fromValues(startX,startY);
        this.velVec = vec2.fromValues(0.0,0.0);
        this.accelVec = vec2.fromValues(0.0,0.0);
        this.mass = mass;
        this.size = size;
    
        this.accelerate = function(){
                var r2 = vec2.sqrDist(GRAV_VEC,this.posVec)+EARTH_RADIUS;
                var dirVec = vec2.create();
                vec2.set(this.accelVec,
                    G_CONST_X/r2,
                    G_CONST_Y/r2
                );
    
            /* Make dirVec unit vector in direction of gravitational acceleration */
            vec2.sub(dirVec,GRAV_VEC,this.posVec)
            vec2.normalize(dirVec,dirVec)
            /* Point acceleration vector in direction of dirVec */
            vec2.multiply(this.accelVec,this.accelVec,dirVec);//vec2.fromValues(canvas.width*.5-this.posVec[0],canvas.height *.5-this.posVec[1])));
    
            vec2.add(this.velVec,this.velVec,this.accelVec);
            vec2.add(this.posVec,this.posVec,this.velVec);
        };
    }

These are the shaders I'm using:

     <script id="shader-fs" type="x-shader/x-fragment">
            void main(void) {
            gl_FragColor = vec4(0.7, 0.8, 1.0, 1.0);
            }
        </script>
    
        <!-- Vertex shader program -->
    
        <script id="shader-vs" type="x-shader/x-vertex">
            attribute vec2 a_position;
    
            uniform vec2 u_resolution;
    
            uniform vec2 u_translation;
    
            void main() {
            // Add in the translation.
            vec2 position = a_position + u_translation;
            // convert the rectangle from pixels to 0.0 to 1.0
            vec2 zeroToOne = position / u_resolution;
    
            // convert from 0->1 to 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;
    
            // convert from 0->2 to -1->+1 (clipspace)
            vec2 clipSpace = zeroToTwo - 1.0;
    
            gl_Position = vec4(clipSpace*vec2(1,-1), 0, 1);
            }
        </script>

I apologize for this being long-winded. Again, any suggestions or nudges in the right direction would be huge. 

## Answer:

It depends on what you are trying to do. When you say "gravity" to you mean some kind of physical simulation with collisions or do you just mean `velocity += acceleration; position += velocity`?

If the latter then you can do all the math in the shader. Example is here

https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html

These particles are done entirely in the shader. The only input after setup is `time`. Each "particle" consists of 4 vertices. Each vertex contains 

* local_position (for a unit quad)
* texture_coord
* lifetime
* starting_position
* starting_time
* velocity
* acceleration
* start_size
* end_size
* orientation (quaterion)
* color multiplier

Given time you can compute the particles's local time (time since it starts)

     local_time = time - starting_time;

Then you can compute a position with

     base_position = start_position + 
                     velocity * local_time + 
                     acceleration * local_time * local_time;

That's acceleration * time^2. You then add the local_position to that base_position to get the position needed to render the quad.

You can also compute a 0 to 1 lerp over the lifetime of the particle

     lerp = local_time / lifetime;

This gives you a value you can use to lerp all the other values

     size = mix(start_size, end_size, lerp);

If the particle a size of 0 if it's outside the it's lifetime

     if (lerp < 0.0 || lerp > 1.0) {
       size = 0.0;
     }

This will make the GPU not draw anything.

Using a ramp texture (a 1xN pixel texture) you can easily have the particle change colors over time.

     color = texture2D(rampTexture, vec4(lerp, 0.5));

etc...

If you [follow through the shaders][1] you'll see other things similarly handled including spinning the particle (something that would be harder with point sprites), animating across a texture for frames, doing both 2D and 3D oriented particles. 2D particles are fine for smoke, exhaust, fire, explosions. 3D particles are good for ripples, possibly tire tracks, and can be combined with 2D particles for ground puffs to hide some of the z-issues of 2D only particles. etc..

There are also examples of one shots (explosions, puffs) as well as trails. Press 'P' for a puff. Hold 'T' to see a trail.

AFAIK these are pretty efficient particles in that JavaScript is doing almost nothing.

  [1]: https://www.khronos.org/registry/webgl/sdk/demos/google/resources/o3djs/particles.js

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://NONE">Austen</a>
    from
    <a data-href="https://stackoverflow.com/questions/15215968">here</a>
  </div>
</div>
