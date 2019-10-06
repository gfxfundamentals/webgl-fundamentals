Title: What are Vertex Arrays in OpenGL & WebGL2?
Description:
TOC: qna

# Question:

I've been working with WebGL1 for some time but now that I'm learning more about WebGL2, I'm confused what `Vertex Array`s actually do. For example, in the following [example][1], I can remove all references to them (e.g. creation, binding, deletion) and the example continues to work.


  [1]: https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/draw_primitive_restart.html#L90

# Answer

This has been explained elsewhere but you can consider both WebGL1 and WebGL2 to have a vertex array. It's just WebGL1 by default only has one where as WebGL2 you can create multiple vertex arrays (although 99.9% of all WebGL1 implementations support them as an extension)

A Vertex Array is the collection of all attribute state plus the `ELEMENT_ARRAY_BUFFER` binding.

You can think of WebGL state like this

<!-- language: lang-js -->

    function WebGLRenderingContext() {
       // internal WebGL state
       this.lastError: gl.NONE,
       this.arrayBuffer = null;
       this.vertexArray = {
         elementArrayBuffer: null,
         attributes: [
           { enabled: false, type: gl.FLOAT, size: 3, normalized: false, 
             stride: 0, offset: 0, value: [0, 0, 0, 1], buffer: null },
           { enabled: false, type: gl.FLOAT, size: 3, normalized: false, 
             stride: 0, offset: 0, value: [0, 0, 0, 1], buffer: null },
           { enabled: false, type: gl.FLOAT, size: 3, normalized: false, 
             stride: 0, offset: 0, value: [0, 0, 0, 1], buffer: null },
           { enabled: false, type: gl.FLOAT, size: 3, normalized: false, 
             stride: 0, offset: 0, value: [0, 0, 0, 1], buffer: null },
           { enabled: false, type: gl.FLOAT, size: 3, normalized: false, 
             stride: 0, offset: 0, value: [0, 0, 0, 1], buffer: null },
           ...
         ],
       }
       ...

And you can think of `gl.bindBuffer` as implemented like this

<!-- language: lang-js -->

       // Implementation of gl.bindBuffer. 
       // note this function is doing nothing but setting 2 internal variables.
       this.bindBuffer = function(bindPoint, buffer) {
         switch(bindPoint) {
           case gl.ARRAY_BUFFER;
             this.arrayBuffer = buffer;
             break;
           case gl.ELEMENT_ARRAY_BUFFER;
             this.vertexArray.elementArrayBuffer = buffer;
             break;
           default:
             this.lastError = gl.INVALID_ENUM;
             break;
         }
       };

So you can see above, calling `gl.bindBuffer` with `gl.ELEMENT_ARRAY_BUFFER` sets the `elementArray` part of the current `vertexArray`

You can also see `vertexArray` has a number of attributes. They define how to pull data out of the buffers to supply to your vertex shader. Calling `gl.getAttribLocation(someProgram, "nameOfAttribute")` tells you which attribute the vertex shader will look at to get data out of a buffer. 

There's 4 functions that you use to configure how an attribute will get data from a buffer. `gl.enableVertexAttribArray`, `gl.disableVertexAttribArray`, `gl.vertexAttribPointer`, and `gl.vertexAttrib??`.

They're effectively implemented something like this

<!-- language: lang-js -->

    this.enableVertexAttribArray = function(location) {
      const attribute = this.vertexArray.attributes[location];
      attribute.enabled = true;  // true means get data from attribute.buffer 
    };

    this.disableVertexAttribArray = function(location) {
      const attribute = this.vertexArray.attributes[location];
      attribute.enabled = false; // false means get data from attribute.value
    };

    this.vertexAttribPointer = function(location, size, type, normalized, stride, offset) {
      const attribute = this.vertexArray.attributes[location];
      attribute.size       = size;       // num values to pull from buffer per vertex shader iteration
      attribute.type       = type;       // type of values to pull from buffer
      attribute.normalized = normalized; // whether or not to normalize
      attribute.stride     = stride;     // number of bytes to advance for each iteration of the vertex shader. 0 = compute from type, size
      attribute.offset     = offset;     // where to start in buffer.

      // IMPORTANT!!! Associates whatever buffer is currently *bound* to 
      // "arrayBuffer" to this attribute
      attribute.buffer     = this.arrayBuffer;
    };

    this.vertexAttrib4f = function(location, x, y, z, w) {
      const attribute = this.vertexArray.attributes[location];
      attribute.value[0] = x;
      attribute.value[1] = y;
      attribute.value[2] = z;
      attribute.value[3] = w;
    };


Now, when you call `gl.drawArrays` or `gl.drawElements` the system knows how you want to pull data out of the buffers you made to supply your vertex shader. [See here for how that works](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html).

There's then 3 functions that will manage all state connected to `this.vertexArray`. They are `gl.createVertexArray`, `gl.bindVertexArray` and `gl.deleteVertexArray`. In WebGL1 they are available on the  [`OES_vertex_array_object`](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/) extension slightly renamed. On WebGL2 they are just available by default
 which is also a feature of WebGL 2.0.

Calling `gl.createVertexArray` makes new vertex array. Calling `gl.bindVertexArray` sets `this.vertexArray` to point to the one you pass in. You can imagine it implemented like this

<!-- language: lang-js -->

     this.bindVertexArray = function(vao) {
       this.vertexArray = vao ? vao : defaultVertexArray;
     }    

The benefit should be obvious. Before each thing you want to draw you need to set all the attributes. Setting each attribute requires a minimum of one call per used attribute. More commonly 3 calls per attribute. One call to `gl.bindBuffer` to bind a buffer to `ARRAY_BUFFER` and one call to `gl.vertexAttribPointer` to then bind that buffer to a specific attribute and set how to pull data out and one call to `gl.enableVertexAttribArray` to turn on getting data from a buffer for the attribute. 

For a typical model with positions, normals, and texture coordinates that's 9 calls, +1 more if you're using indices and need to bind a buffer to `ELEMENT_ARRAY_BUFFER`. 

With vertex arrays all those calls happen at init time. You make a vertex array for each thing you want to draw then setup the attributes for that thing. At draw time it then only takes one call to `gl.bindVertexArray` to setup all the attributes and the `ELEMENT_ARRAY_BUFFER`.

If you'd like to just always use vertex arrays you can use [this polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill) in WebGL1. It uses the built in one if the extension exists or else emulates it. Of course emulation is slower but any GPU that would need the emulation is probably already too slow.

note if you're looking for samples maybe compare the corresponding examples on https://webglfundamentals.org to https://webgl2fundamentals.org. The WebGL2 site uses vertex arrays everywhere. You'll notice in the WebGL1 examples just before drawing, for each piece of vertex data the buffer for that data is bound and then the attribute for that data is setup. In the WebGL2 examples that happens at init time instead of draw time. At draw time all that happens is calling `gl.bindVertexArray`

One extra thing about vertex arrays to be aware of is that they generally require more organization. If you're going to draw the same object more than once with different shader programs then it's possible one shader program will use different attributes for the same data. In other words, with no extra organization shaderprogram1 might use attribute 3 for position where as shaderprogram2 might attribute 2 for position. In that case the same vertex array would not work with both programs for the same data.

The solution is to manually assign the locations. You can do this in the shaders themselves in WebGL2. You can also do it by calling `gl.bindAttribLocation` before linking the shaders for each shaderprogram in both WebGL1 and WebGL2. I tend to think using `gl.bindAttribLocation` is better than doing it in GLSL because it's more [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
