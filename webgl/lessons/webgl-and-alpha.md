Title: WebGL and Alpha

I've noticed some OpenGL developers having issues with how WebGL treats alpha in the backbuffer (ie, the canvas), so I thought it might be good to go over some of the differences between WebGL and OpenGL related to alpha.
<!--more-->
The biggest difference between OpenGL and WebGL is that OpenGL renders to a backbuffer that is not composited with anything so, or effectively not composited with anything by the OS's window manager, so it doesn't matter what your alpha is.

WebGL is composited by the browser with the web page and the default is to use pre-multiplied alpha the same as .png &lt;img&gt; tags with transparency and 2d canvas tags.

WebGL has several ways to make this more like OpenGL.

<h3>#1) Tell WebGL you want it composited with non-premultiplied alpha</h3>

<pre class="prettyprint showlinemods">
gl = canvas.getContext(
        "experimental-webgl", 
        {  
           premultipliedAlpha: false  // Ask non-premultiplied alpha
        }
     );
</pre>

The default is true.

Of course the result will still be composited over page with whatever background color ends up being under the canvas  (the canvas's background color, the canvas's container background color, the page's background color, the stuff behind the canvas if the canvas has a z-index > 0, etc....) in other words, the color CSS defines for that area of the webpage.

I really good way to find if you have any alpha problems is to set the canvas's background to a bright color like red. You'll immediately see what is happening.

<pre class="prettyprint showlinemods">
&lt;canvas style="background: red;"&gt; &lt;/canvas&gt;
</pre>

You could also set it to black which will hide any alpha issues you have.

<h3>#2) Tell WebGL you don't want alpha in the backbuffer</h3>

<pre class="prettyprint showlinemods">
gl = canvas.getContext("experimental-webgl", { alpha: false }};
</pre>

This will make it act more like OpenGL since the backbuffer will only have RGB. This is probably the best option because a good browser could see that you have no alpha and actually optimize the way WebGL is composited. Of course that also means it actually won't have alpha in the backbuffer so if you are using alpha in the backbuffer for some purpose that might not work for you. Few apps that I know of use alpha in the backbuffer. I think arguably this should have been the default.

<h3>#3) Clear alpha at the end of your rendering</h3>

<pre class="prettyprint showlinemods">
  ..
  renderScene();
  ..
  // Set the backbuffer's alpha to 1.0
  gl.clearColor(1, 1, 1, 1);
  gl.colorMask(false, false, false, true);
  gl.clear(gl.COLOR_BUFFER_BIT);
</pre>

Clearing is generally very fast as there is a special case for it in most hardware. I did this in most of my demos. If I was smart I'd switch to method #2 above. Maybe I'll do that right after I post this. It seems like most WebGL libraries should default to this method. Those few developers that are actually using alpha for compositing effects can ask for it. The rest will just get the best perf and the least surprises.

<h3>#4) Clear the alpha once then don't render to it anymore</h3>

<pre class="prettyprint showlinemods">
  // At init time. Clear the back buffer.
  gl.clearColor(1,1,1,1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Turn off rendering to alpha
  gl.colorMask(true, true, true, false); 
</pre>

Of course if you are rendering to your own framebuffers you may need to turn rendering to alpha back on and then turn it off again when you switch to rendering to the canvas.

<h3>#5) Handling Images</h3>

Also, if you are loading PNG files with alpha into textures, the default is that their alpha is pre-multiplied which is generally NOT the way most games do things. If you want to prevent that behavior you need to tell WebGL with

<pre class="prettyprint showlinemods">
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
</pre>

<h3>#6) Using a blending equation that works with pre-multiplied alpha.</h3>

Almost all OpenGL apps I've writing or worked on use

<pre class="prettyprint showlinemods">
   gl.blendFunc(gl.SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
</pre>

That works for non pre-multiplied alpha textures.

If you actually want to work with pre-multiplied alpha textures then you probably want

<pre class="prettyprint showlinemods">
   gl.blendFunc(gl.ONE, gl_ONE_MINUS_SRC_ALPHA);
</pre>

Those are the methods I'm aware of. If you know of more please post them below.



