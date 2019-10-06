Title: WebGL - which API to use?
Description:
TOC: qna

# Question:

I want to draw multiple polygon shapes (where each shape has it's own set of vertices).
I want to be able to position these shapes independently of each other.

Which API can i use to set the a_Position for the vertex shader?

 - A) gl.vertexAttrib3f
 - B) gl.vertexAttribPointer + gl.enableVertexAttribArray

thanks.


# Answer

Your question makes it sound like you're really new to WebGL? Maybe you should [read some tutorials](http://games.greggman.com/game/webgl-fundamentals/)? But in answer to your question:

`gl.vertexAttrib3f` only lets you supply a single constant value to a GLSL attribute so you'll need to use `gl.vertexAttribPointer` and `gl.enableVertexAttribArray`. You'll also need to set up buffers with your vertex data.

`gl.vertexAttrib3f` only point is arguably to let you pass in a constant in the case that you have a shader that uses multiple attributes but you don't have data for all of them. For example lets say you have a shader that uses both textures and so needs texture coordinates and it also has vertex colors. Something like this

vertex shader

    attribute vec4 a_position;
    attribute vec2 a_texcoord;
    attribute vec4 a_color;

    varying vec2 v_texcoord;
    varying vec4 v_color;

    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * a_position;

      // pass texcoord and vertex colors to fragment shader
      v_texcoord = a_texcoord;
      v_color = v_color;
    }

fragment shader

    precision mediump float;

    varying vec2 v_texcoord;
    varying vec4 v_color;

    uniform sampler2D u_texture;

    void main() {
       vec4 textureColor = texture2D(u_texture, v_texcoord);

       // multiply the texture color by the vertex color
       gl_FragColor = textureColor * v_color;
    }

This shader requires vertex colors. If your geometry doesn't have vertex colors then you have 2 options (1) use a different shader (2) turn off the attribute for vertex colors and set it to a constant color, probably white.

    gl.disableVertexAttribArray(aColorLocation);
    gl.vertexAttrib4f(aColorLocation, 1, 1, 1, 1);

Now you can use the same shader even though you have no vertex color data. 

Similarly if you have no texture coordinates you could pass in a white 1 pixel shader and set the texture coordinates to some constant.

    gl.displayVertexAttribArray(aTexcoordLocation);
    gl.vertexAttrib2f(aTexcoordLocation, 0, 0); 

    gl.bindTexture(gl.TEXTURE_2D, some1x1PixelWhiteTexture);

In that case you could also decide what color to draw with by setting the vertex color attribute.

    gl.vertexAttrib4f(aColorLocation, 1, 0, 1, 1);  // draw in magenta



