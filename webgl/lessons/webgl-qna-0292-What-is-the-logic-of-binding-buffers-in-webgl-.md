Title: What is the logic of binding buffers in webgl?
Description:
TOC: qna

# Question:

I sometimes find myself struggling between declaring the buffers (with createBuffer/bindBuffer/bufferdata) in different order and rebinding them in other parts of the code, usually in the draw loop.

If I don't rebind the vertex buffer before drawing arrays, the console complains about an attempt to access out of range vertices. My suspect is the the last bound object is passed at the pointer and then to the drawarrays but when I change the order at the beginning of the code, nothing changes. What effectively works is rebinding the buffer in the draw loop. So, I can't really understand the logic behind that. When do you need to rebind? Why do you need to rebind? What is attribute0 referring to?

# Answer

I don't know if this will help. As some people have said, GL/WebGL has a bunch of internal **state**. All the functions you call set up the state. When it's all setup you call `drawArrays` or `drawElements` and all of that state is used to draw things

This has been explained elsewhere on SO but binding a buffer is just setting 1 of 2 global variables inside WebGL. After that you refer to the buffer by its bind point.

You can think of it like this

    gl = function() {
       // internal WebGL state
       let lastError;
       let arrayBuffer = null;
       let vertexArray = {
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

       // Implementation of gl.bindBuffer. 
       // note this function is doing nothing but setting 2 internal variables.
       this.bindBuffer = function(bindPoint, buffer) {
         switch(bindPoint) {
           case gl.ARRAY_BUFFER;
             arrayBuffer = buffer;
             break;
           case gl.ELEMENT_ARRAY_BUFFER;
             vertexArray.elementArrayBuffer = buffer;
             break;
           default:
             lastError = gl.INVALID_ENUM;
             break;
         }
       };
    ...
    }();

After that other WebGL functions reference those. For example `gl.bufferData` might do something like

       // implementation of gl.bufferData
       // Notice you don't pass in a buffer. You pass in a bindPoint. 
       // The function gets the buffer one of its internal variable you set by
       // previously calling gl.bindBuffer

       this.bufferData = function(bindPoint, data, usage) {

         // lookup the buffer from the bindPoint
         var buffer;
         switch (bindPoint) {
           case gl.ARRAY_BUFFER;
             buffer = arrayBuffer;
             break;
           case gl.ELEMENT_ARRAY_BUFFER;
             buffer = vertexArray.elemenArrayBuffer;
             break;
           default:
             lastError = gl.INVALID_ENUM;
             break;
          }

          // copy data into buffer
          buffer.copyData(data);  // just making this up
          buffer.setUsage(usage); // just making this up
       };

Separate from those bindpoints there's number of attributes. The attributes are also global state by default. They define how to pull data out of the buffers to supply to your vertex shader. Calling `gl.getAttribLocation(someProgram, "nameOfAttribute")` tells you which attribute the vertex shader will look at to get data out of a buffer. 

So, there's 4 functions that you use to configure how an attribute will get data from a buffer. `gl.enableVertexAttribArray`, `gl.disableVertexAttribArray`, `gl.vertexAttribPointer`, and `gl.vertexAttrib??`.

They're effectively implemented something like this

    this.enableVertexAttribArray = function(location) {
      const attribute = vertexArray.attributes[location];
      attribute.enabled = true;  // true means get data from attribute.buffer 
    };

    this.disableVertexAttribArray = function(location) {
      const attribute = vertexArray.attributes[location];
      attribute.enabled = false; // false means get data from attribute.value
    };

    this.vertexAttribPointer = function(location, size, type, normalized, stride, offset) {
      const attribute = vertexArray.attributes[location];
      attribute.size       = size;       // num values to pull from buffer per vertex shader iteration
      attribute.type       = type;       // type of values to pull from buffer
      attribute.normalized = normalized; // whether or not to normalize
      attribute.stride     = stride;     // number of bytes to advance for each iteration of the vertex shader. 0 = compute from type, size
      attribute.offset     = offset;     // where to start in buffer.

      // IMPORTANT!!! Associates whatever buffer is currently *bound* to 
      // "arrayBuffer" to this attribute
      attribute.buffer     = arrayBuffer;
    };

    this.vertexAttrib4f = function(location, x, y, z, w) {
      const attribute = vertexArray.attributes[location];
      attribute.value[0] = x;
      attribute.value[1] = y;
      attribute.value[2] = z;
      attribute.value[3] = w;
    };


Now, when you call `gl.drawArrays` or `gl.drawElements` the system knows how you want to pull data out of the buffers you made to supply your vertex shader. [See here for how that works](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html).

Since the attributes are **global state** that means every time you call `drawElements` or `drawArrays` how ever you have the attributes setup is how they'll be used. If you set up attributes #1 and #2 to buffers that each have 3 vertices but you ask to draw 6 vertices with `gl.drawArrays` you'll get an error. Similarly if you make an index buffer which you bind to the `gl.ELEMENT_ARRAY_BUFFER` bindpoint and that buffer has an indice that is > 2 you'll get that `index out of range` error. If your buffers only have 3 vertices then the only valid indices are `0`, `1`, and `2`.

Normally, every time you draw something different you rebind all the attributes needed to draw that thing. Drawing a cube that has positions and normals? Bind the buffer with position data, setup the attribute being used for positions, bind the buffer with normal data, setup the attribute being used for normals, now draw. Next you draw a sphere with positions, vertex colors and texture coordinates. Bind the buffer that contains position data, setup the attribute being used for positions. Bind the buffer that contains vertex color data, setup the attribute being used for vertex colors. Bind the buffer that contains texture coordinates, setup the attribute being used for texture coordinates.

The only time you don't rebind buffers is if you're drawing the same thing more than once. For example drawing 10 cubes. You'd rebind the buffers, then set the uniforms for one cube, draw it, set the uniforms for the next cube, draw it, repeat. 

I should also add that there's an extension [`OES_vertex_array_object`] which is also a feature of WebGL 2.0. A Vertex Array Object is the global state above called `vertexArray` which includes the `elementArrayBuffer` and all the attributes.    

Calling `gl.createVertexArray` makes new one of those. Calling `gl.bindVertexArray` sets the global `attributes` to point to the one in the bound vertexArray.

Calling `gl.bindVertexArray` would then be

     this.bindVertexArray = function(vao) {
       vertexArray = vao ? vao : defaultVertexArray;
     }    

This has the advantage of letting you set up all attributes and buffers at init time and then at draw time just 1 WebGL call will set all buffers and attributes.
