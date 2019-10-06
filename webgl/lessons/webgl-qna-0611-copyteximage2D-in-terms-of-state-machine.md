Title: copyteximage2D in terms of state machine
Description:
TOC: qna

# Question:

i dont know how copyteximage2D works, 
i would like a explanation in term of the webgl state machine :

thanks to gman i have this :

    gl = { 
        activeTextureUnit: 0,
        textureUnits: [],
    };

    gl.activeTexture = function(unit) {
        this.activeTextureUnit = unit - this.TEXTURE_0;  
    };

    gl.bindTexture = function(bindPoint, texture) {
        var textureUnit = this.textureUnits[this.activeTextureUnit];
        switch (bindPoint) {
           case this.TEXTURE_2D:
             textureUnit.texture2D = texture;
             break;
           case ....
        }
    };
    gl.copyTexImage2D = function( target, level, iformat, x, y, w,h,b) {
    .....
    ..... gman please your code here thanks very much!!!
    .....
    }

# Answer

`copyTexImage2D` copies from the current framebuffer or canvas into the given target of the current texture unit

    gl = {
      activeTextureUnit: 0,
      textureUnits: [
        { gl.TEXTURE_2D: null, gl.TEXTURE_CUBE_MAP: null, ... },
        { gl.TEXTURE_2D: null, gl.TEXTURE_CUBE_MAP: null, ... },
        { gl.TEXTURE_2D: null, gl.TEXTURE_CUBE_MAP: null, ... },
        { gl.TEXTURE_2D: null, gl.TEXTURE_CUBE_MAP: null, ... },
        ...
      ],
      framebufferBindPoints: {
        gl.FRAMEBUFFER: gl.canvas.internalFramebuffer,
      },
    };

    gl.bindFramebuffer = function(bindPoint, framebuffer) {
      this.framebufferBindPoints[bindPoint] = 
         framebuffer ? framebuffer : gl.canvas.internalFramebuffer;
    }; 

    gl.copyTexImage2D = function( target, level, iformat, x, y, w,h,b) {
      var textureUnit = this.textureUnits[this.activeTextureUnit];
      var texture = textureUnit[target];
      var framebuffer = this.framebufferBindPoints[gl.FRAMEBUFFER];
      // copy from framebuffer into texture
    }
  


