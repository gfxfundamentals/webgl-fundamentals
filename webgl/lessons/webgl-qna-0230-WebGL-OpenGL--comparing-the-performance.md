Title: WebGL/OpenGL: comparing the performance
Description:
TOC: qna

# Question:

For educational purposes I need to compare the performance of WebGL with OpenGL. I have two equivalent programs written in WebGL and OpenGL, now I need to take the frame rate of them and compare them.  

In Javascript I use `requestAnimationFrame` to animate, and I noticed that it causes the frame rate to be always at 60 FPS, and it goes down only if I switch tab or window. On the other hand if I always call the render function recursively, the window freezes for obvious reasons.  

###This is how I am taking the FPS:  

    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '450px';
    stats.domElement.style.top = '750px';
    
    document.body.appendChild( stats.domElement );
    
    setInterval( function () {
    
        stats.begin();
        stats.end();
    }, 1000 / 60 );
    
       
    var render= function() {
        requestAnimationFrame(render);
        renderer.render(scene,camera);
    }
    
    render();

Now the problem if having always the scene at 60 FPS is that I cannot actually compare it with the frame rate of OpenGL, since OpenGL redraws the scene only when it is somehow modified (for example if I rotate the object) and `glutPostRedisplay()` gets called.
  
So I guess if there is a way in WebGL to redraw the scene only when it is necessary, for example when the object is rotated or if some attributes in the shaders are changed. 

# Answer

You can't compare framerates directly across GPUs in WebGL by pushing frames. Rather you need to figure out how much work you can get done within a single frame.

So, basically pick some target framerate and then keep doing more and more work until you go over your target. When you've hit your target that's how much work you can do. You can compare that to some other machine or GPU using the same technique.

Some people will suggest using `glFinish` to check timing. Unfortunately that doesn't actually work because it stalls the graphics pipeline and that stalling itself is not something that normally happens in a real app. It would be like timing how fast a car can go from point A to point B but instead of starting long before A and ending long after B you slam on the brakes before you get to B and measure the time when you get to B. That time includes all the time it took to slow down which is different on every GPU and different between WebGL and OpenGL and even different for each browser. You have no way of knowing how much of the time spent is time spent slowing down and how much of it was spent doing the thing you actually wanted to measure.

So instead, you need to go full speed the entire time. Just like a car you'd accelerate to top speed before you got to point A and keep going top speed until after you pass B. The same way they time cars on qualifying laps.

You don't normally stall a GPU by slamming on the breaks (glFinish) so adding the stopping time to your timing measurements is irrelevant and doesn't give you useful info. Using glFinish you'd be timing drawing + stopping. If one GPU draws in 1 second and stops in 2 and another GPU draws in 2 seconds and stops in 1, your timing will say 3 seconds for both GPUs. But if you ran them without stopping one GPU would draw 3 things a second, the other GPU would only draw 1.5 things a second. One GPU is clearly faster but using glFinish you'd never know that.

Instead you run full speed by drawing as much as possible and then measure how much you were able to get done and maintain full speed.

Here's one example:
http://webglsamples.org/lots-o-objects/lots-o-objects-draw-elements.html

It basically draws each frame. If the frame rate was 60fps it draws 10 more objects the next frame. If the frame rate was less than 60fps it draws less.

Because browser timing is not perfect you might be to choose a slightly lower target like 57fps to find how fast it can go.

On top of that, WebGL and OpenGL really just talk to the GPU and the GPU does the real work. The work done by the GPU will take the exact same amount of time regardless of if WebGL asks the GPU to do it or OpenGL. The only difference is in the overhead of setting up the GPU. That means you really don't want to draw anything heavy. Ideally you'd draw almost nothing. Make your canvas 1x1 pixel, draw a single triangle, and check the timing (as in how many single triangles can you draw one triangle at a time in WebGL vs OpenGL at 60fps).

It gets even worse though. A real app will switch shaders, switch buffers, switch textures, update attributes and uniforms often. So, what are you timing? How many times you can call `gl.drawBuffers` at 60fps? How many times you can call `gl.enable` or `gl.vertexAttribPointer` or `gl.uniform4fv` at 60fps? Some combination? What's a reasonable combination? 10% calls to `gl.verterAttribPointer` + 5% calls to `gl.bindBuffer` + 10% calls to `gl.uniform`. The timing of those calls are the only things different between WebGL and OpenGL since ultimately they're talking to the same GPU and that GPU will run the same speed regardless.





