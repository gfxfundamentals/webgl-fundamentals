Title: Better Quality Text in WebGL
Description:
TOC: qna

# Question:

I am searching a method to draw better quality (arbitrary) text inside WebGL. Currently I am using bitmap font rendering on a 2D canvas and blitting them into the WebGL context.

This method is described here http://delphic.me.uk/webgltext.html

This is the only solution for drawing arbitrary unicode text inside WebGL I know of right now. The problem with this method is that these are bitmap fonts and look blocky on smaller font sizes. I mostly use a font size of 18 and the result is quite blocky compared to desktop quality fonts.

I know that threeJS has a font library which generates better looking text, however I do not want to use threeJS as I have my own wrapper which is working fine for what I need and don't want to add the additional overhead of threeJS.

So how to create better quality text in WebGL ? Are there methods to extract text shapes in Javascript to improve quality ?

# Answer

Looking at the source code for three.js suggests a solution.

Here's the code for three.js font creation
https://github.com/mrdoob/three.js/blob/master/src/extras/FontUtils.js

It says right at the top

     * For Text operations in three.js (See TextGeometry)
     *
     * It uses techniques used in:
     *
     *  typeface.js and canvastext
     *   For converting fonts and rendering with javascript
     *  http://typeface.neocracy.org
     *
     * Triangulation ported from AS3
     *  Simple Polygon Triangulation
     *  http://actionsnippet.com/?p=1462
     *
     *  A Method to triangulate shapes with holes
     *  http://www.sakri.net/blog/2009/06/12/an-approach-to-triangulating-polygons-with-holes/


[Typeface.js provides the font data and there's an online form to convert truetype fonts](http://typeface.neocracy.org/fonts.html).

Other solutions:

1.  Render the text to your bitmaps and a higher resolution and draw them that resolution or smaller.

2.  Use a curve renderer. (http://http.developer.nvidia.com/GPUGems3/gpugems3_ch25.html)

