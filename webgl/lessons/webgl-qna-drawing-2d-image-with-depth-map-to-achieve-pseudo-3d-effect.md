Title: Drawing 2D image with depth map to achieve pseudo-3D effect
Description: Drawing 2D image with depth map to achieve pseudo-3D effect
TOC: Drawing 2D image with depth map to achieve pseudo-3D effect

## Question:

I'm learning WebGL, done that with the help of WebGLFundamentals page, which helped me pretty much to understand how buffers, shaders and all that stuff works.
But now I want to achieve a certain effect which I saw here: https://tympanus.net/Tutorials/HeatDistortionEffect/index3.html
  I know how to make the heat distortion effect, the effect I want to achieve is the DEPTH on the image. This demo has a tutorial but it doesnt really explain how to do it, it says I must have a grayscale map, in which the white parts are the closest ones and the black parts the farest. But I really cant understand how it works, here is my shader's code:

    var vertexShaderText = [
         "attribute vec2 a_position;",
         "attribute vec2 a_texCoord;",
         "uniform vec2 u_resolution;",
         "varying vec2 v_texCoord;",
         "void main() {",
         "  vec2 zeroToOne = a_position / u_resolution;",
         "  vec2 zeroToTwo = zeroToOne * 2.0;",
         "  vec2 clipSpace = zeroToTwo - 1.0;",
         "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
         "  v_texCoord = a_texCoord;",
         "}"
      ].join("\n")

      var fragShaderText = [
         "precision mediump float;",
         "uniform sampler2D u_image;",
         "uniform sampler2D u_depthMap;",
         "uniform vec2 mouse;",
         "varying vec2 v_texCoord;",
         "void main() {",
         "  float frequency=100.0;",
         "  float amplitude=0.010;",
         "  float distortion=sin(v_texCoord.y*frequency)*amplitude;",
         "  float map=texture2D(u_depthMap,v_texCoord).r;",
         "  vec4 color=texture2D(u_image,vec2(v_texCoord.x+distortion*map, v_texCoord.y));",
         "  gl_FragColor = color;",
         "}"
      ].join("\n")

What I want is when I move the mouse, the image would respond to the shader to distort like in the link I showed above. But I really have no idea on how to do it on the javascript part.
Thanks

## Answer:

Following the [image processing tutorials](https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html) from that same site shows how to load multiple images. The sample you linked to and [the tutorial](https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/) make it pretty clear how it works

First you need the original image

<div class="webgl_center"><img src="https://i.imgur.com/xKYRSwu.jpg" style="width: 600px;"></div>

and you then apply a sine wave distortion.

{{{example url="../webgl-qna-drawing-2d-image-with-depth-map-to-achieve-pseudo-3d-effect-example-1.html"}}}

Then they also load a texture of multiple maps. This texture was created by hand in photoshop (or other image editing program). The green channel is how much to multiply the distortion by. The greener the more distortion.

<div class="webgl_center"><img src="http://i.imgur.com/W9QazjL.jpg" style="width: 600px;"></div>

{{{example url="../webgl-qna-drawing-2d-image-with-depth-map-to-achieve-pseudo-3d-effect-example-2.html"}}}

Next there's an offset for the mouse multplied by another hand drawn map. This map is the red channel of the image above where the more red it is the more the mouse offset is applied. The map kind of represents depth. Since we need stuff in the front to move opposite of stuff in the back we need to convert that channel from 0 to 1 to -.5 to +.5 in the shader 

{{{example url="../webgl-qna-drawing-2d-image-with-depth-map-to-achieve-pseudo-3d-effect-example-3.html"}}}

Finally, (not in the tutorial but in the sample) it loads a blurred version of the original image (blurred in some image editing program like photoshop)

<div class="webgl_center"><img src="http://i.imgur.com/Zw7mMLX.jpg" style="width: 600px;"></div>

It might be hard to see it's blurred since the blurring is subtle.

The sample then uses the blurred image the more distorted things are

{{{example url="../webgl-qna-drawing-2d-image-with-depth-map-to-achieve-pseudo-3d-effect-example-4.html"}}}

The finally big difference is rather than use a simple sine wave for distortion the shader on that sample is computing something slight more complicated.

# cover

The code above uses a 2 unit quad that goes from -1 to +1 in X and Y. If you passed in an identiy matrix (or a 1,1 scale matrix which is the same thing) it would cover the canvas. Instead we want the image to not be distorted. To do that we had this code

    const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const imageAspect = originalImage.width / originalImage.height;
    const mat = m3.scaling(imageAspect / canvasAspect, -1);

This just effectively says make it fill the canvas vertically and scale it in whatever it neesd to be to match the original image's aspect. The -1 is to flip the quad since otherwise the image is upside down.

To implement `cover` we just need to check if scale is < 1. If so it's not going to fill the canvas so we set the horizontal scale to 1 and adjust the vertical scale

    // this assumes we want to fill vertically
    let horizontalDrawAspect = imageAspect / canvasAspect;
    let verticalDrawAspect = -1;
    // does it fill horizontally?
    if (horizontalDrawAspect < 1) {
      // no it does not so scale so we fill horizontally and
      // adjust vertical to match
      verticalDrawAspect /= horizontalDrawAspect;
      horizontalDrawAspect = 1;
    }
    const mat = m3.scaling(horizontalDrawAspect, verticalDrawAspect);

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/3470844">NickyP</a>
    from
    <a data-href="https://stackoverflow.com/questions/44372487">here</a>
  </div>
</div>
