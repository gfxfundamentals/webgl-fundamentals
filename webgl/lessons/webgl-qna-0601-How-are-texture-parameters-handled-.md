Title: How are texture parameters handled?
Description:
TOC: qna

# Question:

In HTML5 I am working on a page where textures are loaded to a WebGL context. However, this question is probably generalisable to any OpenGL (ES) version.

After a texture is uploaded to the GPU (through `glBindTexture` and `glTexImage2D`), the `glTexParameteri` and `glTexParameterf` functions can be called. These function are supposed to set parameters for the texture.

However, it is unclear to me for what object these parameters are actually set. Are they set for the actual texture, which is enabled in the currently active texture slot? Are they set for the currently active texture slot itself? Or are they set globally for all textures?

Another point of doubt that follows from this is:
Can I have the same texture (being only loaded once on the GPU) enabled in more than one texture slot, with different parameters?

# Answer

Repeating from about 5 other answers on SO but ...

Textures manipulation works like this. There's a *global* set of texture units

    internalGLState = { 
        activeTextureUnit: 0,
        textureUnits: [
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          { TEXTURE_2D: ?, TEXTURE_CUBEMAP: ?, }, 
          ...
        ], 
    };

Textures are referenced by the current *active texture unit* and the *bind point* for that unit.

So, `gl.activeTexture` effectively does this

    gl.activeTexture = function(unitId) {
      internalGlState.activeTextureUnit = unitId - gl.TEXTURE0;  // conver to index
    }

All other texture functions basically work like this

    function getTexture(bindPoint) {
      return internalGLState[internalGlState.activeTextureUnit][bindPoint];
    }

So for example `gl.texParameteri`

    gl.texParameteri = function(bindPoint, settingId, value) {
      var texture = getTexture(bindPoint);
      texture.internalApplySetting(settingId, value);
    }

The settings are on the textures. The "texture units" are just effectively an array of references to textures (except there's one reference for each bind point per unit)

Shaders refer to textures by the index of the texture unit

    gl.uniform1i(someSamplerUniformLocation, textureUnitIndex);

As Nicol pointed out, in WebGL 1.0, no, you can not have the same texture with different parameters. You can in WebGL 2.0 using sampler objects (shipping soon hopefully).

My question would be, why do you want different parameters for the same texture? As someone who's work on a bunch of commercial video games I've never once had a artist ask me to do that so I've never found that as a limiting feature.

In any case, if you do want to do it in WebGL you'll need to make multiple textures or change the parameters between uses if you don't need the different parameters at the same time.
