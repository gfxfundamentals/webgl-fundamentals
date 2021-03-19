Title: WebGL Cross Platform Issues
Description: Things to be aware of when trying to make your WebGL app work everywhere.
TOC: Cross Platform Issues

I probably comes as no shock that not all WebGL programs work on all devices or
browser. For one WebGL2, at least as of March 2021, is not supported in
Safari except behind a flag (Safari 14)

Here's a list of most of the issues you might run into off the top of my head

## Performance

A top end GPU probably runs 100x faster than a low-end GPU. The only way around
that that I know of is to either aim low, or else give the user options like
most Desktop PC apps do where they can choose performance or fidelity.

## Memory

Similarly a top end GPU might have 12 to 24 gig of ram where as a low end GPU
probably has less than 1gig. (I'm old so it's amazing to me low end = 1gig since
I started programming on machines with 16k to 64k of memory 😜)

## Device Limits

WebGL has various minimum supported features but your local device might support
\> than that minimum which means it will fail on other devices that support less.

Examples include:

* The max texture size allowed

  2048 or 4096 seems to be reasonable limits. At least as of 2020 it looks like
  [99% of devices support 4096 but only 50% support > 4096](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE).

  Note: the max texture size is the maximum dimension the GPU can process. It
  doesn't mean that GPU has enough memory for that dimension squared (for a 2D
  texture) or cubed (for a 3D texture). For example some GPUs have a max size of
  16384\. But a 3D texture 16384 on each side would require 16 terabytes of
  memory!!!

* The maximum number of vertex attributes in a single program

  In WebGL1 the minimum supported is 8. In WebGL2 it's 16. If you're using more than that
  then your code will fail on a machine with only the minimum

* The maximum number of uniform vectors

  These are specified separately for vertex shaders and fragment shaders.

  In WebGL1 it's 128 for vertex shaders and 16 for fragment shaders
  In WebGL2 it's 256 for vertex shaders and 224 for fragment shaders

  Note that uniforms can be "packed" so the number above is how many `vec4`s
  can be used. Theoretically you could have 4x the number of `float` uniforms.
  but there is an algorithm that fits them in. You can imagine the space as
  an array with 4 columns, one row for each of the maximum uniform vectors above.

     ```
     +-+-+-+-+
     | | | | |   <- one vec4
     | | | | |   |
     | | | | |   |
     | | | | |   V
     | | | | |   max uniform vectors rows
     | | | | |
     | | | | |  
     | | | | |
     ...

     ```
  
  First `vec4`s are allocated with a `mat4` being 4 `vec4`s. Then `vec3`s are
  fit in the space left. Then `vec2`s followed by `float`s. So imagine we had 1
  `mat4`, 2 `vec3`s, 2 `vec2`s and 3 `float`s

     ```
     +-+-+-+-+
     |m|m|m|m|   <- the mat4 takes 4 rows
     |m|m|m|m|
     |m|m|m|m|
     |m|m|m|m|
     |3|3|3| |   <- the 2 vec3s take 2 rows
     |3|3|3| |
     |2|2|2|2|   <- the 2 vec2s can squeeze into 1 row 
     |f|f|f| |   <- the 3 floats fit in one row
     ...

     ```

  Further, an array of uniforms is always vertical so for example if the maximum
  allowed uniform vectors is 16 then you can not have a 17 element `float` array
  and in fact if you had a single `vec4` that would take an entire row so there
  are only 15 rows left meaning the largest array you can have would be 15
  elements.

  My advice though is don't count on perfect packing. Although the spec says the
  algorithm above is required to pass there are too many combinations to test
  that all drivers pass. Just be aware if you're getting close the limit.

  note: varyings and attributes can not be packed.

* The maximum varying vectors.

  WebGL1 the minimum is 8. WebGL2 it's 16.

  If you use more than your code will not work on a machine with only the minimum.

* The maximum texture units

  There are 3 values here.

  1. How many texture units there are
  2. How many texture units a vertex shader can reference
  3. How many texture units a fragment shader can reference

  <table class="tabular-data">
    <thead>
      <tr><th></th><th>WebGL1</th><th>WebGL2</th></tr>
    </thead>
    <tbody>
      <tr><td>min texture units that exist</td><td>8</td><td>32</td></tr>
      <tr><td>min texture units a vertex shader can reference</td><th style="color: red;">0!</td><td>16</td></tr>
      <tr><td>min texture units a fragment shader can reference</td><td>8</td><td>16</td></tr>
    </tbody>
  </table>

  It's important to note the **0** for a vertex shader in WebGL1. Note that that's probably not the end of the world.
  Apparently [~97% of all devices support at least 4](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS).
  Still, you might want to check so you can either tell the user that your app is not going to work for them or
  you can fallback to some other shaders.

There are other limits as well. To look them up you call `gl.getParameter` with
the following values. 

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_TEXTURE_SIZE                </td><td>max size of a texture</td></tr>
    <tr><td>MAX_VERTEX_ATTRIBS              </td><td>num attribs you can have</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_VECTORS      </td><td>num vec4 uniforms a vertex shader can have</td></tr>
    <tr><td>MAX_VARYING_VECTORS             </td><td>num varyings you have</td></tr>
    <tr><td>MAX_COMBINED_TEXTURE_IMAGE_UNITS</td><td>num texture units that exist</td></tr>
    <tr><td>MAX_VERTEX_TEXTURE_IMAGE_UNITS  </td><td>num texture units a vertex shader can reference</td></tr>
    <tr><td>MAX_TEXTURE_IMAGE_UNITS         </td><td>num texture units a fragment shader can reference</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_VECTORS    </td><td>num vec4 uniforms a fragment shader can have</td></tr>
    <tr><td>MAX_CUBE_MAP_TEXTURE_SIZE       </td><td>max size of a cubemap</td></tr>
    <tr><td>MAX_RENDERBUFFER_SIZE           </td><td>max size of a renderbuffer</td></tr>
    <tr><td>MAX_VIEWPORT_DIMS               </td><td>max size of the viewport</td></tr>
  </tbody>
</table>
</div>

That is not the entire list. For example the max point size and max line thickness
but you should basically assume the max line thickness is 1.0 and that POINTS
are only useful for simple demos where you don't care about
[the clipping issues](#points-lines-viewport-scissor-behavior).

WebGL2 adds several more. A few common ones are

<div class="webgl_center">
<table class="tabular-data">
  <tbody>
    <tr><td>MAX_3D_TEXTURE_SIZE                </td><td>max size of a 3D texture</td></tr>
    <tr><td>MAX_DRAW_BUFFERS              </td><td>num color attachments you can have</td></tr>
    <tr><td>MAX_ARRAY_TEXTURE_LAYERS      </td><td>max layers in a 2D texture array</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS             </td><td>num varyings you can output to separate buffers when using transform feedback</td></tr>
    <tr><td>MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS</td><td>num varyings you can output when sending them all to a single buffer</td></tr>
    <tr><td>MAX_COMBINED_UNIFORM_BLOCKS  </td><td>num uniform blocks you can use overall</td></tr>
    <tr><td>MAX_VERTEX_UNIFORM_BLOCKS         </td><td>num uniform blocks a vertex shader can use</td></tr>
    <tr><td>MAX_FRAGMENT_UNIFORM_BLOCKS    </td><td>num uniform blocks a fragment shader can use</td></tr>
  </tbody>
</table>
</div>

## Depth Buffer resolution

A few really old mobile devices use 16bit depth buffers. Otherwise, AFAICT 99%
of devices use a 24bit depth buffer so you probably don't have to worry about
this.

## readPixels format/type combos

Only certain format/type combos are guaranteed to work. Other combos are
optional. This is covered in [this article](webgl-readpixels.html).

## framebuffer attachment combos

Framebuffers can have 1 or more attachments of textures and renderbuffers.

In WebGL1 only 3 combinations of attachments are guaranteed to work.

1. a single format = `RGBA`, type = `UNSIGNED_BYTE` texture as `COLOR_ATTACHMENT0`
2. a format = `RGBA`, type = `UNSIGNED_BYTE` texture as `COLOR_ATTACHMENT0` and a
   format = `DEPTH_COMPONENT` renderbuffer attached as `DEPTH_ATTACHMENT`
3. a format = `RGBA`, type = `UNSIGNED_BYTE` texture as `COLOR_ATTACHMENT0` and a
   format = `DEPTH_STENCIL` renderbuffer attached as `DEPTH_STENCIL_ATTACHMENT`

All other combinations are up to the implementation which you check by calling
`gl.checkFramebufferStatus` and seeing if it returned `FRAMEBUFFER_COMPLETE`.

WebGL2 guarantees to be able to write to many more formats but still has the
limit in that **any combination can fail!** Your best bet might be if all the
color attachments are the same format if you attach more than 1.

## Extensions

Many features of WebGL1 and WebGL2 are optional. The entire point of having an
API called `getExtension` is that it can fail if the extension does not exist
and so you should be checking for that failure and not blindly assuming it will
succeed.

Probably the most common missing extension on WebGL1 and WebGL2 is
`OES_texture_float_linear` which is the ability to filter a floating point
texture, meaning the ability to support setting `TEXTURE_MIN_FILTER` and
`TEXTURE_MAX_FILTER` to anything except `NEAREST`. Many mobile devices do not
support this.

In WebGL1 another often missing extension is `WEBGL_draw_buffers` which is the
ability to attach more than 1 color attachment to a framebuffer is still at
around 70% for desktop and almost none for smartphones (that seems wrong).
Basically any device that can run WebGL2 should also support
`WEBGL_draw_buffers` in WebGL1 but still, it's apparently still an issue. If you
are needing to render to multiple textures at once it's likely your page needs a
high end GPU period. Still, you should check if the user device supports it and
if not provide a friendly explanation.

For WebGL1 the following 3 extensions seem almost universally supported so while
you might want to warn the user your page is not going to work if they are
missing it's likely that user has an extremely old device that wasn't going to
run your page well anyway.

They are, `ANGLE_instance_arrays` (the ability to use [instanced drawing](webgl-instanced-drawing.html)),
`OES_vertex_array_object` (the ability to store all the attribute state in an object so you can swap all
that state with a single function call. See [this](webgl-attributes.html)), and `OES_element_index_uint`
(the ability to use `UNSIGNED_INT` 32 bit indices with [`drawElements`](webgl-indexed-vertices.html)).

## attribute locations

A semi common bug is not looking up attribute locations. For example you have a vertex shader like

```glsl
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 matrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = matrix * position;
   v_texcoord = texcoord;
}
```

Your code assumes that `position` will be attribute 0 and `texcoord` will be
attribute 1 but that is not guaranteed. So it runs for you but fails for someone
else. Often this can be a bug in that you didn't do this intentionally but
through an error in the code things work when the locations are one way but not
another.

There are 3 solutions.

1. Always look up the locations.
2. Assign locations by calling `gl.bindAttribLocation` before calling `gl.linkProgram`
3. WebGL2 only, set the locations in the shader as in

   ```glsl
   #version 300 es
   layout(location = 0) vec4 position;
   latout(location = 1) vec2 texcoord;
   ...
   ```

   Solution 2 seems the most [D.R.Y.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) where as solution 3
   seems the most [W.E.T.](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#DRY_vs_WET_solutions) unless
   you're generating your textures at runtime.

## GLSL undefined behavior

Several GLSL functions have undefined behavior. For example `pow(x, y)` is
undefined if `x < 0`. There is a longer list at [the bottom of the article on
spot lighting](webgl-3d-lighting-spot.html).

## Shader precision issues

In 2020 the biggest issue here is if you use `mediump` or `lowp` in your shaders
then on desktop the GPU will really use `highp` but on mobile they'll actually be
`mediump` and or `lowp` and so you won't notice any issues when developing on desktop.

See [this article for more details](webgl-precision-issues.html).

## Points, Lines, Viewport, Scissor behavior

`POINTS` and `LINES` in WebGL can have a max size of 1 and in fact for `LINES`
that is now the most common limit. Further whether points are clipped when their
center is outside the viewport is implementation defined. See the bottom of
[this article](webgl-drawing-without-data.html#pointissues).

Similarly, whether or not the viewport clips vertices only or also pixels is
undefined. The scissor always clips pixels so turn on the scissor test and set
the scissor size if you set the viewport smaller than the thing you're drawing
to and you're drawing LINES or POINTS.

