Title: Firefox "This operation requires zeroing texture data" warning when using Web GL
Description:
TOC: qna

# Question:

When opening my (JS HTML5) project in firefox, I get the warning: "Error: WebGL warning: drawArrays: This operation requires zeroing texture data. This is slow."

I have been told it's due to trying to read pixels out of range or something of the sort.

Here's my code:
```
var gl = Gra.gl
 
 // texture
 var tex = gl.createTexture()
 
 gl.bindTexture( gl.TEXTURE_2D, tex )
 gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, AppImg )
 
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
 
 var bff_pos = BufferFromArr([
  -1, -1, 
   1, -1, 
  -1,  1, 
   1,  1
 ])
 
 var bff_tex = BufferFromArr([
  0, 1, 
  1, 1, 
  0, 0, 
  1, 0
 ])
 
 // buffer
 var wd = 200
 var ht = 200
 
 // texture
 var tex2 = gl.createTexture()
 
 gl.bindTexture( gl.TEXTURE_2D, tex2 )
 gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, wd, ht, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )
 
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
 gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
 
 // framebuffer
 var frame = gl.createFramebuffer()
 gl.bindFramebuffer( gl.FRAMEBUFFER, frame )
 gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex2, 0 )
 gl.viewport( 0, 0, wd, ht )
 
 gl.bindTexture( gl.TEXTURE_2D, tex )
 
 gl.bindBuffer( gl.ARRAY_BUFFER, bff_pos )
 gl.vertexAttribPointer( Gra.shd_a_pos, 2, gl.FLOAT, 0, 0, 0 )
 
 gl.bindBuffer( gl.ARRAY_BUFFER, bff_tex )
 gl.vertexAttribPointer( Gra.shd_a_tex, 2, gl.FLOAT, 0, 0, 0 )
 
 gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 )
 
 gl.bindFramebuffer( gl.FRAMEBUFFER, null )
 gl.viewport( 0, 0, Gra.cv.width, Gra.cv.height )
```

Vertex Shader:
```
attribute vec2 a_pos;
attribute vec2 a_tex;

varying vec2 v_tex;

void main (void)
{
 gl_Position = vec4( a_pos.x, a_pos.y, 1.0, 1.0 );
 
 v_tex = a_tex;
}
```

Fragment Shader:
```
precision mediump float;

uniform sampler2D u_smp;

varying vec2 v_tex;

void main (void)
{
 gl_FragColor = texture2D( u_smp, vec2( v_tex.x, v_tex.y ) );
}
```


Here's the live page: http://ssjstash.net/webgl_error

You can also download the source: http://ssjstash.net/webgl_error.zip

I'm not sure exactly what the issue is, thinking it could be a firefox issue.

If anyone is aware of how to fix the problem (if it's fixable) I'd appreciate



# Answer

It's a nonsense message and Mozilla claims to be fixing or have fixed it

https://bugzilla.mozilla.org/show_bug.cgi?id=1478216

The fix might not have shipped to stable firefox yet


If you'd like to get rid of it don't call `gl.texImage2D` with `null`

Why it's nonsense.

If you do this

    gl.texImage2D(target, level, format, width, height, 0, format, type, null);

Then the browser will allocate a width * height * format * type size piece of memory, clear it to 0 and pass it to the OpenGL driver. The warning is this allocation and clearing of memory is slow.

The reason the message is nonsense is the only fix possible in JavaScript is actually slower.

The fix would be to allocate a buffer yourself in JavaScript so for example

```
const zero = new Uint8Array(
    width * height * bytesPerPixelForFormatType(format, type));
gl.texImage2D(target, level, format, width, height, 0, format, type, zero);
```

So what happens in this case? Well, you allocated a buffer the same size the browser would have allocated anyway. That buffer gets zeroed out just as the browser would have anyway, but on top of that you now have a `Uint8Array` ArrayBufferView the browser had to create. It also had to create the underlying `ArrayBuffer`, both javascript objects with full prototype chains etc. Those objects have reference counters too which have to be checked by the garbage collector over time to see if and when they are safe to free.

In other words, there much much more work going on when doing this from JavaScript so the warning is nonsense.
