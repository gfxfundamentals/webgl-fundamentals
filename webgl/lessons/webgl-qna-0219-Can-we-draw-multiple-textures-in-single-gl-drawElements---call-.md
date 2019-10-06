Title: Can we draw multiple textures in single gl.drawElements() call?
Description:
TOC: qna

# Question:

In WebGL, can we draw multiple textures in single gl.drawElements() call? If yes how?

What is the use of `gl.TEXTURE0` to `gl.TEXTURE31`, I mean, What is the scenario when more than one texture units are used?

I'm trying to draw a cube with 6 different textures for each side in single drawElements() call. Is it possible? Is yes, How?

# Answer

To use multiple textures you bind different textures to different texture units and reference them with multiple samplers in your shaders

Here's a shader that uses 2 textures

     uniform sampler2D u_texture1;
     uniform sampler2D u_texture2;
     varying vec2 vtexcoords1;
     varying vec2 vtexcoords2;

     void main() {
       vec4 color1 = texture2D(u_texture1, v_texcoords1);
       vec4 color2 = texture2D(u_texture2, v_texcoords2);
       gl_FragColor = color1 * color2;  // multiply the colors.
     }

You then need to bind 2 textures to 2 texture units

     // bind a texture to texture unit0
     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, someTexture);

     // bind a texture to texture unit1
     gl.activeTexture(gl.TEXTURE1);
     gl.bindTexture(gl.TEXTURE_2D, someOtherTexture);

And you need to tell the shader which texture units to use

     // -- at init time
     var texture1location = gl.getUniformLocation(program, "u_texture1");
     var texture2location = gl.getUniformLocation(program, "u_texture2");

     // -- at draw time

     // tell the shader to use texture units 0 and 1
     gl.uniform1i(texture1location, 0);
     gl.uniform1i(texture2location, 1);
 
But, that's generally NOT how to texture a cube with 6 images. Most games would texture a cube with 6 images by putting all 6 images in a single texture [(see end of this article)](http://greggman.github.io/webgl-fundamentals/webgl/lessons/webgl-3d-textures.html). Most 3D modeling programs would put 6 images on a cube by not making a cube but instead making 6 planes that each align to make the faces of a cube. In other words 6 individual plane models instead of one cube model. That way it stays simple. You just use a shader that draws 1 texture and use a different texture when drawing each plane of the cube. 

In the game style case, 1 cube + 1 texture with 6 images. It's fast because there's just 1 draw call. In the 3d modeling package it 6 planes with 1 texture each (6 total) so 6 draw calls but it's flexible as each plane can use a different image without having to build a new texture with all 6 images in it.

Which way you choose is up to you.



  
