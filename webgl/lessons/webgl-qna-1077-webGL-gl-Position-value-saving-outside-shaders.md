Title: webGL gl_Position value saving outside shaders
Description:
TOC: qna

# Question:

I have vertex shaders for calculation something like this
```
 gl_Position =
      vec4(a.x * (0.5 - b.x) * v -
               a.y * b.y * u - offset * offsetMul * u,
           0, 0) +
      transform * vec4(position, 0, 1);
```
I need to save a particular value of gl_Position for later use outside the shaders. Is there any way to save the coordinates to be used outside the shaders?

# Answer

Saving `gl_Position` itself is not possible AFAICT. 

Saving "a particular" value doesn't sound possible either. 

Saving all values is possible. You either can either render the positions

```
attribute vec4 position;    // your data
attribute float a_count;    // count 0, 1, 2, 3
uniform vec2 u_resolution;  // resolution of output texture

// vertex shader
varying vec4 v_position;

void main() {
  v_position =
      vec4(a.x * (0.5 - b.x) * v -
               a.y * b.y * u - offset * offsetMul * u,
           0, 0) +
      transform * vec4(position, 0, 1);
  vec2 pixelCoord = vec2(
      mod(a_count, resolution.x);
      floor(a_count / resolution.x));
  vec2 clipSpaceCoord = (pixelCoord + 0.5) / resolution * 2.0 - 1.0;

  gl_Position = vec4(clipSpaceCoord, 0, 1);
}

// fragment shdaer
precision highp float
varying vec4 v_position;
void main() {
  gl_FragColor = v_position;
}
```

In the case above we'd make a buffer filled with a count 0, 1, 2, 3 etc to supply data to `a_count` above. You'd make a floating point texture (after enabling `OES_texture_float` and `EXT_color_buffer_float`, attach to a framebuffer, then render to that framebuffer. The results would be in the texture

Note that it would probably be a lot faster to put the position data itself in a texture and do more normal GPGPU stuff. One example at the bottom [here](https://stackoverflow.com/questions/56780278/how-to-keep-coordination-between-particles-and-which-texture-pixel-contains-each)

In WebGL2 you can also use transform feedback. Transform feedback writes the output of the vertex shader to one or more buffers. In WebGL2, using shader version 300 es, you declare varyings in a vertex shader as `out` instead of `varying`. Those `out` values (so like above, not `gl_Position` itself but your own declared outputs can be written to a buffer.

