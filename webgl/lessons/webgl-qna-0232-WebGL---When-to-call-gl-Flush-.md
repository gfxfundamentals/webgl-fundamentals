Title: WebGL - When to call gl.Flush?
Description:
TOC: qna

# Question:

I just noticed today that this method, Flush() is available.
Not able to find detailed documentation on it.

What exactly does this do?
Is this required?




# Answer

`gl.flush` in WebGL does have it's uses but it's driver and browser specific. 

For example, because Chrome's GPU architecture is multi-process you can do this

    function var loadShader = function(gl, shaderSource, shaderType) {
      var shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      return shader;
    }
    
    var vs = loadShader(gl, someVertexShaderSource, gl.VERTEX_SHADER);
    var fs = loadShader(gl, someFragmentShaderSource, FRAGMENT_SHADER);
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    
At this point all of the commands might be sitting in the command
queue with nothing executing them yet. So, issue a flush

    gl.flush();

Now, because we know that compiling and linking programs is slow depending on how large and complex they are so we can wait a while before trying using them and do other stuff

    setTimeout(continueLater, 1000);  // continue 1 second later
    
now do other things like setup the page or UI or something
    
1 second later `continueLater` will get called. It's likely our shaders finished compiling and linking.

    function continueLater() {

      // check results, get locations, etc.
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS) ||
          !gl.getShaderParameter(fs, gl.COMPILE_STATUS) ||
          !gl.getProgramParameter(p, gl.LINK_STATUS)) {
         alert("shaders didn't compile or program didn't link");
         ...etc... 
       }

       var someLoc = gl.getUniformLocation(program, "u_someUniform");
       ...etc...
    }

I believe Google Maps uses this technique as they have to compile many very complex shaders and they'd like the page to stay responsive. If they called `gl.compileShader` or `gl.linkProgram` and immediately called one of the query functions like `gl.getShaderParameter` or `gl.getProgramParameter` or `gl.getUniformLocation` the program would freeze while the shader is first validated and then sent to the driver to be compiled. By not doing the querying immediately but waiting a moment they can avoid that pause in the UX.

Unfortunately this only works for Chrome AFAIK because other browsers are not multi-process and I believe all drivers compile/link synchronously.

There maybe be other reasons to call `gl.flush` but again it's very driver/os/browser specific. As an example let's say you were going to draw 1000 objects and to do that took 5000 webgl calls. It likely would require more than that but just to have a number lets pick 5000. 4 calls to `gl.uniformXXX` and 1 calls to `gl.drawXXX` per object.

It's possible all 5000 of those calls fit in the browser's (Chrome) or driver's command buffer. Without a flush they won't start executing until the the browser issues a `gl.flush` for you (which it does so it can composite your results on the screen). That means the GPU might be sitting idle while you issue 1000, then 2000, then 3000, etc.. commands since they're just sitting in a buffer. `gl.flush` tells the system "Hey, those commands I added, please make sure to start executing them". So you might decide to call `gl.flush` after each 1000 commands.

The problem though is `gl.flush` is not free otherwise you'd call it after every command to make sure it executes as soon as possible. On top of that each driver/browser works in different ways. On some drivers calling `gl.flush` every few 100 or 1000 WebGL calls might be a win. On others it might be a waste of time.

Sorry, that was probably too much info :p

