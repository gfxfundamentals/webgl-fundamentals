Title: preserveDrawingBuffer false - is it worth the effort?
Description:
TOC: qna

# Question:

When using preserveDrawingBuffer for our context we need to take care of clearing the drawing buffer by our self. I use this technique in my app.

I read some article that says - setting this flag to false can get better performances.

In my app when setting to false, in some cases i need to take care of clearing the front buffer by myself because when no drawing is happening we can still see what was drawn before.

My question, is it worth now to turn my app upside down and covering all the cases in order to get better performances? Is it really so much improving ?

Is there any demo that shows the different in performances when this flag is true (and performing `gl.clear(..)`) compares to false ?




# Answer

I know this has been answered elsewhere but I can't find it so ....

    preserveDrawingBuffer: false

means WebGL can swap buffers instead of copy buffers.

WebGL canvases have 2 buffers. The one you're drawing to and the one being displayed. When it comes time to draw the webpage WebGL has 2 options

1.  Copy the drawing buffer to the display buffer.  

    This operation is slower obviously as copying thousands or millions pixels is not
    a free operation

2.  Swap the two buffers.

    This operation is effectively instant as nothing really needs to happen except to swap
    the contents of 2 variables.

Whether WebGL swaps or copies is up to the browser and various other settings but if `preserveDrawingBuffer` is `false` WebGL can swap, if it's `true` it can't.

If you'd like to see a perf difference I'd suggested trying your app on mobile phone. Make sure antialiasing is off too since antialiasing requires a *resolve* step which is effectively copy operation.


