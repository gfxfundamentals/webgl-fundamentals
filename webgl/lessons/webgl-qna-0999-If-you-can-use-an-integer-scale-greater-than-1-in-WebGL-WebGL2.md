Title: If you can use an integer scale greater than 1 in WebGL/WebGL2
Description:
TOC: qna

# Question:

Wondering if you can use `Uint32Array` in `bufferData`, so instead of this:

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);

It would be this:

    gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(bufferData), gl.STATIC_DRAW);

Also along these lines I see all the examples of vertices but they are within 0 to 1 range, like `0.5` and such. I'm wondering if you can instead use larger values like 500 or 100000 and have the scale be set like that. So in this case either using large floats or integers.

# Answer

You can put any data you want in a buffer. WebGL doesn't care. It can be floats, bytes, ints, unsigned bytes, unsigned ints, shorts, unsigned shorts. It can also be mixed.

How you use that data and what you use it for is up to you. That data does not have to be position data. It could be normals, it could be colors, it could be velocities for particles, it could be ids of countries, it could be absolutely anything.

After you put the data in a buffer you you use `gl.vertexAttribPointer` to tell WebGL how to get data out.


```
const location = specifies the attribute to set (looked up with gl.getAttribLocation)
const size = number of elements to pull out per vertex shader iteration (1 to 4)
const type = the type of data. gl.FLOAT, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, etc..
const normalize = true/false. True means the value represents 0 to 1 
                  of unsigned types or -1 to 1 for signed types
const stride = number of bytes to skip per vertex shader iteration to get the next
               data piece of data. 0 = use size * sizeof(type)
const offset = number of bytes to start into the buffer
gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
```

Note that all attributes in WebGL1 are float types. Either `float`, `vec2`, `vec3`, `vec4`, `mat3` or `mat4` which means the data will get converted from you tell the attribute to extract into a float. For example if you stay extract type = `gl.BYTE` , normalize = false, then values in the attribute will be -127.0 to 128.0  If you say extract type `gl.UNSIGNED_BYTE`, normalize = true then values will be 0.0 to 1.0

WebGL2 adds integer attributes `int`, `ivec2`, `ivec3`, `ivec4`, `uint`, `uvec2`, `uvec3`, `uvec4`.

To setup integer attributes you call `gl.vertexAttribIPointer`

[I'd suggest some tutorials on WebGL](https://webglfundamentals.org)
