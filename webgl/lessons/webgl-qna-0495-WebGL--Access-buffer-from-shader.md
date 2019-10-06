Title: WebGL: Access buffer from shader
Description:
TOC: qna

# Question:

I need to access a buffer from my shader. The buffer is created from an array. (In the real scenario, the array has 10k+ (variable) numbers.)


 var myBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array([1,2,3,4,5,6,7]), gl.STATIC_DRAW);


How do I send it so it's usable by the shader?


 precision mediump float;
 uniform uint[] myBuffer;//???

 void main() {
  gl_FragColor = vec4(myBuffer[0],myBuffer[1],0,1);
 }

Normally, if it were a attribute, it'd be 

`gl.vertexAttribPointer(myBuffer, 2, gl.UNSIGNED_BYTE, false, 4, 0);`

but I need to be able to access the whole array from any shader pixel, so it's not a vertex attribute.

# Answer

Use a texture if you want random access to lots of data in a shader.

If you have 10000 values you might make a texture that's 100x100 pixels. you can then get each value from the texture with something like

    uniform sampler2D u_texture;

    vec2 textureSize = vec2(100.0, 100.0);

    vec4 getValueFromTexture(float index) {
       float column = mod(index, textureSize.x);
       float row    = floor(index / textureSize.x);
       vec2 uv = vec2(
          (column + 0.5) / textureSize.x,
          (row    + 0.5) / textureSize.y);
       return texture2D(u_texture, uv);
    }

Make sure your texture filtering is set to `gl.NEAREST`.

Of course if you make `textureSize` a uniform you could pass in the size of the texture.

As for why the `+ 0.5` part [see this answer](https://stackoverflow.com/a/27439675/128511)

You can use normal `gl.RGBA`, `gl.UNSIGNED_BYTE` textures and add/multiply the channels together to get a large range of values. Or, you could use floating point textures if you don't want to mess with that. [You need to enable floating point textures](https://stackoverflow.com/a/29668562/128511).
