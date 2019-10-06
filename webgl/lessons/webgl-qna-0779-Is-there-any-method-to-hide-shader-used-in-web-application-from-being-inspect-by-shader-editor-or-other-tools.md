Title: Is there any method to hide shader used in web application from being inspect by shader editor or other tools
Description:
TOC: qna

# Question:

I am digging 3D web application for VR. And I want to hide my shader from being inspected by firefox shader editer and webGL inspector. I used the way to uglify the shader and put the shader in a return function rather than in a var. But none of them works.

So, is there any method to hide web application's shader?

# Answer

The answer is simple, no there isn't

Just printing out the shaders is pretty easy. All someone has to do is write an extension that does this

    WebGLRenderingContext.prototype.shaderSource = function(origFn) {
      return function(shader, src) {
        console.log(src);
        origFn.call(this, shader, src);
      };
    }(WebGLRenderingContext.prototype.shaderSource);

Even if you did find a way to prevent someone from looking at the shader in the inspector they could just as easily run system level tools like [Microsoft's PIX](https://blogs.msdn.microsoft.com/pix/2017/01/17/introducing-pix-on-windows-beta/), or [Apple's OpenGL Profiler](https://developer.apple.com/library/content/technotes/tn2178/_index.html#//apple_ref/doc/uid/DTS40007990). They could even run the browser using [OSMesa](https://www.mesa3d.org/osmesa.html) and compile it to print out the shaders. Chrome already runs with OSMesa as part of their testing setup. It would be trivial to make it print out the shaders, then use it to run/view your website.

The better question is why do you care? People inspect shaders all the time, [even in AAA games](http://www.adriancourreges.com/blog/). People can decompile assembly language if they want. Your shaders are not special. You're wasting your time trying to prevent them from being inspected.
