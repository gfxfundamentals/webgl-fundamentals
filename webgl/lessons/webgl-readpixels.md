Title: WebGL readPixels
Description: Details on readPixels
TOC: readPixels

In WebGL you pass a format/type pair to `readPixels`. For a given
texture internal format (attached to a framebuffer), only 2 combinations
of format/type are valid.

From the spec:

> For normalized fixed-point rendering surfaces, the combination format `RGBA` and type
`UNSIGNED_BYTE` is accepted. For signed integer rendering surfaces, the combination
format `RGBA_INTEGER` and type `INT` is accepted. For unsigned integer
rendering surfaces, the combination format `RGBA_INTEGER` and type `UNSIGNED_INT`
is accepted.

The second combination is implementation defined
<span style="color:red;">which probably means you shouldn't use it in WebGL if you want your code to be portable</span>.
You can ask what the format/type combination is by querying

```js
// assuming a framebuffer is bound with the texture to read attached
const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
```

Also note what texture formats that are renderable, meaning you can attach them to a framebuffer and render to them,
are also somewhat implementation defined. WebGL1 requires only one combination to be renderable, `RGBA`/`UNSIGNED_BYTE`.
All others are optional (`LUMINANCE` for example) and some
are can be made renderable by extension, `RGBA`/`FLOAT` for example.

**The table below is live**. You may notice that it gives different results depending on the machine, OS, GPU, or even
browser. I know on my machine Chrome and Firefox give different results for some of the implementation defined values.

<div class="webgl_center" data-diagram="formats"></div>

<script src="../resources/twgl-full.min.js"></script>
<script src="resources/webgl-readpixels.js"></script>