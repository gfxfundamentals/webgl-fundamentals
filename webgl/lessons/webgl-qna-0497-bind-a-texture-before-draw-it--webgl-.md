Title: bind a texture before draw it (webgl)
Description:
TOC: qna

# Question:

My code works but i am wondering why !

I have 2 textures :

        uniform sampler2D uSampler0;
        uniform sampler2D uSampler1;


        void main() {
            vec4 color0 = texture2D(uSampler0, vTexCoord);
            vec4 color1 = texture2D(uSampler1, vTexCoord);
            gl_FragColor = color0 * color1;
        }

and my js code


        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,my_texture_ZERO); 
        gl.uniform1i(program.uSampler0,0); 
    
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D,my_texture_ONE); 
        gl.uniform1i(program.uSampler1); 
    
        // uncomment one of the 3, it works.
        // gl.bindTexture(gl.TEXTURE_2D, my_texture_ZERO);
        // gl.bindTexture(gl.TEXTURE_2D, my_texture_ONE);
        // gl.bindTexture(gl.TEXTURE_2D, texture_FOR_PURPOSE_ONLY);
    
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    

before gl.draw, i have tested the 3 bindings,
each one works !

So, i do not understand the real pipeline underlying .

Thanks for some explanations 

# Answer

This line is invalid

    gl.uniform1i(program.uSampler1); 

You're not passing a value to the sampler

The way WebGL texture units work is they are global state inside WebGL

`gl.activeTexture` sets the texture unit all other texture commands effect. For each texture unit there are 2 bind points, `TEXTURE_2D` and `TEXTURE_CUBE_MAP`.

You can think of it like this

    gl = {
      activeTextureUnit: 0,
      textureUnits: [
         { TEXTURE_2D: null: TEXTURE_CUBE_MAP: null, },
         { TEXTURE_2D: null: TEXTURE_CUBE_MAP: null, },
         { TEXTURE_2D: null: TEXTURE_CUBE_MAP: null, },
         ...
      ],
    };

`gl.activeTexture` just does this

    gl.activeTexture = function(unit) {
     gl.activeTextureUnit = unit - gl.TEXTURE0;
    };

`gl.bindTexture` does this

    gl.bindTexture = function(bindPoint, texture) {
      gl.textureUnits[gl.activeTextureUnit][bindPoint] = texture;
    };

`gl.texImage2D` and `gl.texParamteri` look up which texture to work with like this

    gl.texImage2D = function(bindPoint, .....) {
      var texture = gl.textureUnits[gl.activeTextureUnit][bindPoint];
      // now do something with texture
 
In other words, inside WebGL there is a global array of texture units. `gl.activeTexture` and `gl.bindTexture` manipulate that array.

`gl.texXXX` manipulate the textures themselves but they reference the textures indirectly through that array.

`gl.uniform1i(someSamplerLocation, unitNumber)` sets the shader's uniform to look at a particular index in that array of texture units.


