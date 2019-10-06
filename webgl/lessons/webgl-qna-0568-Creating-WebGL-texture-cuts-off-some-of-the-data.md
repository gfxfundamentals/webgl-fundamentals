Title: Creating WebGL texture cuts off some of the data
Description:
TOC: qna

# Question:

I'm using WebGL and am trying to create a Texture out of multiple images, all represented by float arrays which I then convert to RGBA. 

Here is my code:

    var dataTexture = new Uint8Array(array.length*4);
 for(var i=0; i<array.length; i+=4)
 {
  dataTexture[i] = 255*parseFloat(array[i/4]);
  dataTexture[i+1] = 255*255*parseFloat(array[i/4]);
  dataTexture[i+2] = 255*255*255*parseFloat(array[i/4]);
  dataTexture[i+3] = 255;
 }
 
 gl.bindTexture(gl.TEXTURE_2D, self.mTexture);
 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, dataTexture);      
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

 gl.drawArrays(gl.TRIANGLES, 0, 6);


and this is the image that shows up: 




I can't post the ideal image, but there should be something between all of the black strips.



What I don't understand is when I try to preset the values, it works, like in the following code:


this is the image that shows up.

This is NOT the ideal output but just an example of how setting values worked. 

Why is the middle of my image missing and what can I do to fix it? Thank you!


# Answer

It's not clear what you're trying to do here.

    dataTexture[i] = 255*parseFloat(array[i/4]);
    dataTexture[i+1] = 255*255*parseFloat(array[i/4]);
    dataTexture[i+2] = 255*255*255*parseFloat(array[i/4]);
    dataTexture[i+3] = 255;

The largest value you can put in a `Uint8Array` element is 255. So what's the range of your `array` entries because your multiplying them by `65025` and then by `16581375`.

Also is `array` made of text? Otherwise why are you calling parseFloat? 
