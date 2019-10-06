Title: Opengl and Webgl: sampling from a texture attached to current framebuffer
Description:
TOC: qna

# Question:

I have a framebuffer with two textures `t0` and `t1` attached.

On the first pass I render to both of them with multiple fragment shader output.

Before the second pass I do thew following:

 - Turn on a shader with one output only
 - Bind `t1` to a texture unit
 - call glDrawBuffers to disable writing to `t1`'s attachment

Note that `t1` is used for sampling, but it's still bound to current framebuffer. As I understand, there are no loopbacks in such configuration.

Is it legal in both OpenGL and WebGL?

I made an [example][1] which works perfectly in Chrome and Firefox under Linux, but renders a black screen in both browsers for Windows. Is the reason in D3D-backed Webgl implementation, and it's aggressive texture unbinding as pointed [here][2]?


  [1]: https://sergeyext.github.io/sergeyext/webgl_mrt.html
  [2]: https://stackoverflow.com/a/4077575/1690777

# Answer

This is illegal in both WebGL1 and WebGL2. WebGL is required to generate an `INVALID_OPERATION` error if there is a feedback loop.

[From the spec section 6.25](https://www.khronos.org/registry/webgl/specs/1.0/#6.25)

> # 6.25 Feedback Loops Between Textures and the Framebuffer
> In the OpenGL ES 2.0 API, it's possible to make calls that both write to and read from the same texture, creating a feedback loop. It specifies that where these feedback loops exist, undefined behavior results.

> In the WebGL API, such operations that would cause such feedback loops (by the definitions in the OpenGL ES 2.0 spec) will instead generate an INVALID_OPERATION error.

As you pointed out there it sounds like there is probably no actual feedback loop in your case but as Nicol points out according to the spec there still is. [This appears to be a bug both Chrome and Firefox](https://github.com/KhronosGroup/WebGL/issues/2670).

