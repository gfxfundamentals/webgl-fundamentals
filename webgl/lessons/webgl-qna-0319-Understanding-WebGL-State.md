Title: Understanding WebGL State
Description:
TOC: qna

# Question:

Is there any documentation I can find somewhere which documents the preconditions required for WebGL calls?

I have gotten a fairly strong grasp of the WebGL basics, but now I am creating my own 'framework' and I'm after a deeper understanding.

For example, the enableVertexAttribArray call. Does this call required the current shader to be in 'use'? Where does it store this 'enabled' flag? If I switch shader programs, do I have to re-enable it afterwards when I use it again?

I'd love some kind of diagram explaining where all the 'stateful' information is being stored, and when it will go out of context.

Another example is using gl.bindBuffer, are the buffers for ARRAY_BUFFER and ELEMENT_ARRAY_BUFFER stored in separate locations?

With all this in mind, is it recommended to have a parallel state in JavaScript to avoid running WebGL calls? i.e. storing a 'currentBuffer' object to avoid binding the same buffer over and over if its already bound. I can imagine in the general case, this becomes quite a bit of state duplication, but could be quite good for performance.

Bit of a fundamental question but hard to find info on.

# Answer

Screenius answer is pretty complete. The terse version is

In WebGL 1.0, uniforms are per program, texture filtering and wrapping is per texture. Everything else is global. That includes all attributes and all texture units. 

Pasted from some previous answers that cover this

You can think of attributes and texture units like this

    gl = { 
       arrayBuffer: someBuffer, 
       vertexArray: {
         elementArrayBuffer: someOtherBuffer,
         attributes: [], 
       },
    };

When you call `gl.bindBuffer` you're just setting one of 2 global variables in the gl state.

    gl.bindBuffer = function(bindPoint, buffer) {
       switch (bindPoint) {
          case: this.ARRAY_BUFFER:
             this.arrayBuffer = buffer;
             break;
          case: this.ELEMENT_ARRAY_BUFFER:
             this.vertexArray.elementArrayBuffer = buffer;
             break;
       }
    };

When you call `gl.vertexAttribPointer` it copies current value of `arrayBuffer` to the specified attribute. 

    gl.vertexAttribPointer = function(index, size, type, normalized, stride, offset) {
        var attribute = this.vertexArray.attributes[index];
        attribute.size = size;
        attribute.type = type;
        attribute.normalized = normalized;
        attribute.stride = stride;
        attribute.offset = offset;
        attribute.buffer = this.arrayBuffer;  // copies the current buffer reference.
    };

Textures work similarly  

    gl = { 
        activeTextureUnit: 0,
        textureUnits: [], 
    };

`gl.activeTexture` sets which texture unit you're working on. 

    gl.activeTexture = function(unit) {
       this.activeTextureUnit = unit - this.TEXTURE_0;  // make it zero based.
    };

Every texture unit has both a `TEXTURE_2D` and a `TEXTURE_CUBEMAP` so `gl.bindTexture(b, t)` is effectively 

    gl.bindTexture = function(bindPoint, texture) {
       var textureUnit = this.textureUnits[this.activeTextureUnit];
       switch (bindPoint) {
           case this.TEXTURE_2D:
               textureUnit.texture2D = texture;
               break;
           case this.TEXTURE_CUBEMAP:
               textureUnit.textureCubeMap = texture;
               break;
       }
    };
 
The rest is global state like the clear color, viewport, the blend settings, the stencil settings, the enable/disable stuff like `DEPTH_TEST`, `SCISSOR_TEST`

---

Just a side note: If you enable [the extension OES_vertex_array_object](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/) the  `vertexArray` in the example above becomes its own object that you can bind with `bindVertexArrayOES`.
