Title: Right order to specifying framebuffer and binding uniform textures?
Description:
TOC: qna

# Question:

Is there a sequence to setting the output of a program and binding textures to uniforms in the fragment shader?

I have the following code. If I place the lines containing "`attachFrameBuffer`" after the last "`g.uniform1i()`" call, I get the error:

    There is no texture bound to the unit 1.

But if I leave them where they are then everything is fine. This worries me that there is more initialization that I probably have missed.

    gl.useProgram(program);
    
    // Create and bind a framebuffer
    var outputTexture = this.makeTexture(gl.FLOAT, null);
    this.attachFrameBuffer(outputTexture);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, aTexture);
    gl.uniform1i(AHandle, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bTexture);
    gl.uniform1i(BHandle, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

and the code for makeTexture:

       texture = gl.createTexture();
       // Bind the texture so the following methods effect this texture.
       gl.bindTexture(gl.TEXTURE_2D, texture);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       // Pixel format and data for the texture
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, data);
       // Unbind the texture.
       gl.bindTexture(gl.TEXTURE_2D, null);


code for attachFrameBuffer():

       frameBuffer = gl.createFramebuffer();
       gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
       gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); 



# Answer

Textures are bound to "texture units". Texture units are global state. You can imagine them like this

    glState = {
      activeTextureUnit: 0,
      textureUnits: [
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        ...
        ... up to gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) ....
      ]
    };

When you call `gl.activeTexture(textureUnit)` what happens inside WebGL is effectively

    gl.activeTexture = function(textureUnit) {
      // convert texture unit to 0 to N index
      glState.activeTextureUnit = textureUnit - gl.TEXTURE0;
    };

What happens when you call `gl.bindTexture` is effectively this

    gl.bindTexture = function(target, texture) {
      glState.textureUnits[glState.activeTextureUnit][target] = texture;
    };

Uniform samplers indirectly reference texture units. You give them the index of the texture unit you want them to get their texture from.

So, in your case this code

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, aTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bTexture);

Effectively makes the glState

    glState = {
      activeTextureUnit: 1,    // because the last call to activeTexture was gl.TEXTURE1
      textureUnits: [
        { TEXTURE_2D: aTexture, TEXTURE_CUBE_MAP: null, },  // <=- aTexture bound
        { TEXTURE_2D: bTexture, TEXTURE_CUBE_MAP: null, },  // <=- bTexture bound
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
        ...
        ... up to gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) ....
      ]
    };

If you call

    // Create and bind a framebuffer
    var outputTexture = this.makeTexture(gl.FLOAT, null);
    this.attachFrameBuffer(outputTexture);

After that, well, `makeTexture` binds a different texture to unit 1 (since the last call to `activeTexture` set `activeTextureUnit` to 1. Then at the end it binds `null` so there is no texture bound to unit 1 anymore. You then draw and get the error you saw

    There is no texture bound to the unit 1.

There is no "right order". There is just the global webgl state and it's your responsibility to make sure that state is setup correctly before calling `gl.draw???`. You could do that any way you want. For example you could have makeTexture use a different texture unit when it's making a texture. You could also have makeTexture look up the current bound texture, make its new texture, then rebind the old texture. Or, like you found you could call it before binding the textures for drawing.

That said, your code does look a little fishy in that most WebGL apps draw many times so they usually separate resource creation code (initializtion) from rendering code (drawing). Creation code creates the shaders, programs, buffers, textures, and maybe vertex array objects and the render code uses them.

The render code will then set all the state needed to draw

    for each thing to draw
      useProgram 
      bind buffers and set attributes (or use vertex array object)
      bind textures to texture units
      set uniforms for program
      draw

But the code you posted has `useProgram` followed my `makeTexture` which is a creation time thing (you wouldn't likely be creating a texture before every draw call). So as your program gets bigger you'd likely call `makeTexture` somewhere else at init/creation rather than draw/render time

