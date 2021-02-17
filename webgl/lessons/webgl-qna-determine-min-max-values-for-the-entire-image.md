Title: Determine min/max values for the entire image
Description: Determine min/max values for the entire image
TOC: Determine min/max values for the entire image

## Question:

I'd like to normalize **monochrome** image pixels in that way the minimum value is black, the maximum is white and values in between are spread proportionally.
Currently I do it in canvas in two steps, but I believe it should be faster in WebGL.

I can imagine manipulating colors via fragment shader, but I couldn't find any efficient way for (1) determining the actual range of the image, nor (2) approach for passing this info to another fragment shader, which could then perform that grey level normalization.



## Answer:

Seems like you could generate progressively smaller textures in your fragment shader and in each texture write out min and max. So for example if you have a 16x16 texture then for every 2x2 pixels write out 1 pixels that represent the max. 

     vec4 c00 = texture2D(sampler, uv);
     vec4 c10 = texture2D(sampler, uv + vec2(onePixelRight, 0));
     vec4 c01 = texture2D(sampler, uv + vec2(0, onePixelUp));
     vec4 c11 = texture2D(sampler, uv + vec2(onePixelRight, onePixelUp);
     gl_FragColor = max(max(c00, c10), max(c01, c11));

Repeat until you get to 1x1 pixel. Do the same for min. When you're done you'll have 2 1x1 pixel textures. Either read them with readPixels or pass them to another shader as your range.

It might be faster to use larger chunks, instead of 2x2 do 8x8 or 16x16 areas but keep reducing until you get to 1x1 pixels

In pseudo code.

    // setup
    textures = [];
    framebuffers = [];
    cellSize = 16
    maxDimension = max(width, height)
    w = width 
    h = height
    while w > 1 || h > 1
       w = max(1, w / cellSize)
       h = max(1, h / cellSize)
       textures.push(create Texture of size w, h)
       framebuffers.push(create framebuffer and attach texture)
    }
      
    // computation
    bind original image as input texture
    foreach(framebuffer)
       bind framebuffer
       render to framebuffer with max GLSL shader above
       bind texture of current framebuffer as input to next iteration
    }

    
Now the last framebuffer as a 1x1 pixel texture with the max value in it. 

{{{example url="../webgl-qna-determine-min-max-values-for-the-entire-image-example-1.html"}}}


Also if you have `WEBGL_draw_buffers` support you do both min and max at the same time writing to 2 different framebuffer attachments



{{{example url="../webgl-qna-determine-min-max-values-for-the-entire-image-example-2.html"}}}

Now that you have the answer you can pass it to another shader to "contrastify" your texture

If you read out the values then

    uniform vec4 u_minColor;
    uniform vec4 u_maxColor;
    uniform sampler2D u_texture;

    ...
    
      vec4 color = texture2D(u_texture, uv);     
      vec4 range = u_maxColor - u_minColor;
      gl_FragColor = (color - u_minColor) * range;

If you just want to pass in the textures without reading them out then

    uniform sampler2D u_minColor;
    uniform sampler2D u_maxColor;
    uniform sampler2D u_texture;

    ...
      vec4 minColor = texture2D(u_minColor, vec2(0));
      vec4 maxColor = texture2D(u_maxColor, vec2(0));
      vec4 color = texture2D(u_texture, uv);     
      vec4 range = maxColor - minColor;
      gl_FragColor = vec4(((color - minColor) / range).rgb, 1);

I don't know if one is better than the other. I'd assume reading from a texture is slower than reading from a uniform but for a shader this small the performance difference might be minimal

{{{example url="../webgl-qna-determine-min-max-values-for-the-entire-image-example-3.html"}}}

As for monochrome just change the src textures to `gl.LUMINANCE` 

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/2523836">Jan Tosovsky</a>
    from
    <a data-href="https://stackoverflow.com/questions/37504034">here</a>
  </div>
</div>
