Title: Get color of the texture at UV coordinate
Description:
TOC: qna

# Question:

I am using three v.73 
I have UV coordinate from intersection of raycaster. 
Also I have texture of this object. How can I get color (RGB or RGBA) of used texture at the UV coordinate?

I have tried to use get pixel of Image from texture, but it was using a lot of memory

# Answer

If you want it to be fast keep your texture's images around. At init time for each image you're making a texture from also make a copy of its data with something like

    // make the canvas same size as the image
    some2dCanvasCtx.canvas.width  = img.width;
    some2dCanvasCtx.canvas.height = img.height;
    // draw the image into the canvas
    some2dCanvasCtx.drawImage(img, 0, 0);
    // copy the contents of the canvas
    var texData = some2dCanvasCtx.getImageData(0, 0, img.width, img.height);

Now if you have a UV coord you can just look it up

    var tx = Math.min(emod(u, 1) * texData.width  | 0, texData.width - 1);
    var ty = Math.min(emod(v, 1) * texData.height | 0, texData.height - 1);
    var offset = (ty * texData.width + tx) * 4;
    var r = texData.data[offset + 0];
    var g = texData.data[offset + 1];
    var b = texData.data[offset + 2];
    var a = texData.data[offset + 3];

    // this is only needed if your UV coords are < 0 or > 1
    // if you're using CLAMP_TO_EDGE then you'd instead want to
    // clamp the UVs to 0 to 1.
    function emod(n, m) {
      return ((n % m) + m) % m;
    }

Otherwise you can ask WebGL for the color of the texture. Use `tx` and `ty` from above. [See this answer](https://stackoverflow.com/a/13640310/128511).



