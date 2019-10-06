Title: WebGL - apply several programs successively
Description:
TOC: qna

# Question:

How can I get WebGl to apply several programs successively, like

 - draw something
 - convert it to black and white

In this example, it's easy to put all that in a single shader, but I'd like to be able to keep things separated for reusability of larger shaders.

So far to do one pass I've something like

    gl = canvas.getContext("webgl");
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    fragmentShader = attachShader(fragmentShaderCode, gl, gl.FRAGMENT_SHADER);
    vertexShader = attachShader(vertexShaderCode, gl, gl.VERTEX_SHADER);
    
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    gl.useProgram(program);
    
    // attach textures and variables
    
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    
and I'm not sure how to add a second pass taking input from the first pass efficiently. My best guess atm is to use a second canvas that takes the first one as texture input. But that sounds like rendering twice and that's not awesome.

# Answer

What @ssube said except in WebGL terms ...

At init time

1. You create a framebuffer (gl.createFramebuffer)
2. You attach a texture to it (gl.framebufferTexture2D). 
3. If your scene needs a depth buffer you also need to attach a depth buffer to your framebuffer (gl.renderbufferStorage, gl.framebufferRenderbuffer). 

At render time

1. You renderer you scene into the texture though the framebuffer.

        // make rendering render to framebuffer's attachments
        gl.bindFramebuffer(gl.FRAMEBUFFER, yourFramebuffer);

        // .. render scene ..

2. You then render to framebuffer's texture to the canvas using your post processing shader

        // make rendering render to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // .. render framebuffer's texture to canvas with post processing shader..

As @ssube said to apply multiple post processing effects you create framebuffers with attached textures. You render the scene to the first framebuffer-texture, then you render that texture using your first post processing effect into the second texture, now you can render this second texture back into the first using your next post processing effect. That last post processing effect renders to the canvas.
 
[For an example of applying multiple effects see this](http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html)

