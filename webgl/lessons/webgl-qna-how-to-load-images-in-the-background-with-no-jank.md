Title: How to load images in the background with no jank
Description: How to load images in the background with no jank
TOC: How to load images in the background with no jank

## Question:

In our WebGL application I'm trying to load and decode texture images in a web worker in order to avoid rendering hick-ups in the main thread. Using createImageBitmap in the worker and transferring the image bitmap back to the main thread works well, but in Chrome this will use **three** or more (maybe depending on number of cores?) separate workers (ThreadPoolForegroundWorker) which together with the main thread and my own worker will result in five threads.

I'm guessing this causes my remaining rendering disturbances on my quad core since I can see some inexplicable long times in the Performance feature of Chrome's DevTools.

So, can I limit the number of workers used by createImageBitmap somehow? Even if I transfer the images as blobs or array buffers to the main thread and activate createImageBitmap from there, its workers will compete with my own worker and the main thread.

I have tried creating regular Images in the worker instead to explicitly decode them there, but Image is not defined in the worker context, neither is document if I'd like to create them as elements. And regular Images are not transferable either, so creating them on the main thread and transferring them to the worker doesn't seem feasible either.

Looking forward to any suggestions...

## Answer:

There's no reason to use createImageBitmap in a worker (well, see bottom). The browser already decodes the image in a separate thread. Doing it in a worker doesn't get you anything. The bigger issue is there's no way for ImageBitmap to know how you are going to use the image when you finally pass it to WebGL. If you ask for a format that's different than what ImageBitmap decoded then WebGL has to convert and/or decode it again and you can't give ImageBitmap enough info to tell it the format you want it to decode in. 

On top of that WebGL in Chrome has to transfer the data of the image from the render process to the GPU process which for a large image is a relatively big copy (1024x1024 by RGBA is 4meg)

A better API IMO would have allowed you to tell ImageBitmap what format you want and where you want it (CPU, GPU). That way the browser could prep the image asynchonously and have it require no heavy work when done.

In any case, here's a test. If you uncheck "update texture" then it's still downloading and decoding textures but it's just not calling `gl.texImage2D` to upload the texture. In that case I see no jank (not proof that's the issue but that's where I think it is)

{{{example url="../webgl-qna-how-to-load-images-in-the-background-with-no-jank-example-1.html"}}}

I'm pretty sure the only way you could maybe guarentee no jank is to decode the images yourself in a worker, transfer to the main thread as an arraybuffer, and upload to WebGL a few rows a frame with `gl.bufferSubData`. 

{{{example url="../webgl-qna-how-to-load-images-in-the-background-with-no-jank-example-2.html"}}}

Note: I don't know that this will work either. Several places that are scary and browser implementation defined

1. What's the performance issues of resizing a canvas. The code is resizing the OffscreenCanvas in the worker. That could be a heavy operation with GPU reprocussions.

2. What's the performance of drawing an bitmap into a canvas? Again, big GPU perf issues as the browser has to transfer the image to the GPU in order to draw it into a GPU 2D canvas.

3. What's the performance get getImageData? Yet again the browser has to potentially freeze the GPU to read GPU memory to get the image data out.

4. There's a possible perf hit reszing the texture.

5. Only Chrome currently supports OffscreenCanvas 

1, 2, 3, and 5 could all be solved by decoding [jpg](https://github.com/notmasteryet/jpgjs), [png](https://github.com/arian/pngjs) the image yourself though it really sucks the browser has the code to decode the image it's just you can't access the decoding code in any useful way.

For 4, If it's an issue it could be solved, by allocating the largest image size texture and then copying smaller textures into a rectangular area. Assuming that's an issue

{{{example url="../webgl-qna-how-to-load-images-in-the-background-with-no-jank-example-3.html"}}}

note the jpeg decoder is slow. If you find or make a faster one please post a comment

---

# Update

I just want to say that `ImageBitmap` **should** be fast enough and that some of my comments above about it not having enough info might not be exactly right. 

My current understanding is the entire point if `ImageBitmap` was to make uploads fast. It's supposed to work by you give it a blob and asynchronously it loads that image into the GPU. When you call `texImage2D` with it, the browser can "blit" (render with the GPU) that image into your texture. I have no idea why there is jank in the first example given that but I see jank every 6 or so images.

On the other hand, while uploading the image to the GPU was the point of `ImageBitmap`, browsers are not required to upload to the GPU. `ImageBitmap` is still supposed to work even if the user doesn't have a GPU. The point being it's up to the browser to decide how to implement the feature and whether it's fast or slow or jank free is entirely up to the browser.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/4105722">Andreas Ekstrand</a>
    from
    <a data-href="https://stackoverflow.com/questions/58856403">here</a>
  </div>
</div>
