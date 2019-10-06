Title: Streaming data to a WebGL shader
Description:
TOC: qna

# Question:

I am working within a browser context, with camera images being streamed over a binary SocketIO channel.

The camera I am dealing with only supports outputting its data in [bayer][1] format (as a very large byte array), as shown below:

![bayer format][2]

I wish to display the camera image stream in real time on a canvas in the browser.

My idea so far is to use WebGL as the renderer (for speed), and perform the [conversion][3] from bayer to RGBA within the fragment shader.

I am fairly new to WebGL so I am unsure of the conventions and best practices to send the unconverted camera image to the GPU and access it so I can perform the conversion and shade the fragment.

It seems a common technique is sending it as a texture and access it via a texture sampler such as texture2d? But this appears to assume RGBA format, where as bayer format is a completely different structure and it would be more useful to just be able to access the raw byte array.

Pointing in the right direction would be sufficient. I guess the real question is '**How do I send arbitrary data to the GPU and access it in a WebGL context?**'

Edit: I'd rather know the raw WebGL techniques than something using a library such as ThreeJS, although I will likely implement it in ThreeJS if it is particularly easier.


  [1]: http://en.wikipedia.org/wiki/Bayer_filter
  [2]: http://i.stack.imgur.com/bcjhZ.png
  [3]: http://pixinsight.com/doc/tools/Debayer/Debayer.html

# Answer

It sounds like you're ask someone to teach you WebGL. It's a big topic and too large for a StackOverflow question. I'd wouldn't be surprised if your question is closed for being too broad.

Read http://webglfundamentals.org or http://learningwebgl.org or one of the many other sites.

After you've learned WebGL then the way to get camera data to the WebGL is by calling `gl.texImage2D` or `gl.texSubImage2D`. There's many examples around the web of passing in camera data to WebGL, although almost all of those get the camera data from the browser, not from a socket. But at a basic level it's no different. Get your data into a TypedArray like a `Uint8Array` and call `gl.texImage2D` to copy that data to a texture.

