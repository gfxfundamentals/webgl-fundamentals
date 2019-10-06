Title: Access WebGL constants/enums without context
Description:
TOC: qna

# Question:

I find it strange that all WebGL constants are defined as members of the rendering context. This means that if the context is wrapped in some library, accessing those constants becomes problematic.

Is there any reason why I can't define them all explicitly? Or, if they are implementation defined, maybe the first time a context is created, write all enum values to some global object?

Basically, instead of writing `new renderer.Texture(renderer.gl.TEXTURE_2D)` or `new renderer.Texture("TEXTURE_2D")`, I want to write something like `new renderer.Texture(WebGL.TEXTURE_2D)`.

# Answer

you are free to define them as your own constants. In fact it may make your code faster

    const TEXTURE_2D = 0x0DE1
    ...
    gl.bindTexture(TEXTURE_2D, someTexture);

Is perfectly fine. And, if that code is run through a modern JavaScript compressor it will get turned into this

    gl.bindTexture(0x0DE1, someTexture);

Which will arguably be faster. Faster then `gl.TEXTURE_2D` because using `gl.TEXTURE_2D` the JavaScript engine has to always check that someone didn't assign `gl.TEXTURE_2D` to something else.  Faster than `TEXTURE_2D` because even a const variable represents something being created where as `0x0DE1` definitely does not.

Just because I'll probably get some questions later, my point above about speed is the JavaScript engine has to check every single time you call

     gl.bindTexture(gl.TEXTURE2D, ...)

That someone somewhere didn't do

     gl.TEXTURE_2D = 123

or make a property getter

     Object.defineProperty(gl, 'TEXTURE_2D', {
       enumerable: true,
       writable: false,
       get() {
         console.log('TEXTURE_2D was accessed at', (new Error()).stack));
         return 0xDE1;
       }
     });

The JavaScript engine can't assume the the `TEXTURE_2D` property was not changed. It has to check every time.

As for `const` there may or may not be a general speed difference but for example if we make a function that returns a function like this

    function makeFuncThatReturnsValue(value) {
      const v = value;
      return function() {
        return v;
      }
    }

We can see that every time we call `makeFuncThatReturnsValue` a new `v` will be created and captured in the closure. 

Just using a literal directly won't have that issue, nothing will be created. Of course you don't want to use the literal directly, magic numbers are bad, but if you compile your JavaScript with a modern compressor it will swap any `const`s for literals where appropriate.

Running an example through [Google's closure compiler](https://developers.google.com/closure/compiler/)

Code:

    const w = {
      TEXTURE_2D: 0x0DE1,
    };
    
    gl.bindTexture(w.TEXTURE_2D, null);

[Result](https://closure-compiler.appspot.com/home#code%3D%252F%252F%2520%253D%253DClosureCompiler%253D%253D%250A%252F%252F%2520%2540compilation_level%2520ADVANCED_OPTIMIZATIONS%250A%252F%252F%2520%2540output_file_name%2520default.js%250A%252F%252F%2520%253D%253D%252FClosureCompiler%253D%253D%250A%250A%252F%252F%2520ADD%2520YOUR%2520CODE%2520HERE%250Aconst%2520w%2520%253D%2520%257B%250A%2520%2520TEXTURE_2D%253A%25200x0DE1%252C%250A%257D%253B%250A%250Agl.bindTexture(w.TEXTURE_2D%252C%2520null)%253B%250A%250A):

    gl.bindTexture(3553,null);
