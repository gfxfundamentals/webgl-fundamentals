Title: How to tell if an image has an alpha channel
Description: How to tell if an image has an alpha channel
TOC: How to tell if an image has an alpha channel

## Question:

When you load a WebGL texture directly from a DOM image, how do you tell if the image has an alpha channel or not?  Is there anyway except to guess based on the filename (e.g. "contains .PNG may be RGBA otherwise RGB").  There is a width and height in the DOM image, but nothing I can see that says what format it is. i.e.:

        const img = await loadDOMImage(url);
        const format = gl.RGBA; //Does this always need to be RGBA? I'm wasting space in most cases where its only RGB
        const internalFormat = gl.RGBA;
        const type = gl.UNSIGNED_BYTE; //This is guaranteed to be correct, right?  No HDR formats supported by the DOM?
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, img); 

My load function looks like this FWIW:

      async loadDOMImage(url) {
             return new Promise(
               (resolve, reject)=>{
                 const img = new Image(); 
                 img.crossOrigin = 'anonymous';
                 img.addEventListener('load', function() {
                   resolve(img);
                 }, false);
                 img.addEventListener('error', function(err) {
                   reject(err);
                 }, false);
                      
                 img.src = uri;
        
               }
             );
           }





## Answer:

> how do you tell if the image has an alpha channel or not? 

You can't. You can only guess. 

1. you could see the URL ends in .png and assume it has alpha. You might be wrong

2. you could draw image into a 2D canvas then call getImageData, read all the alpha pixels and see if any of them are not 255

>  ```
>  const format = gl.RGBA; 
>  ```
> Does this always need to be RGBA? I'm wasting space in most cases where its only RGB

It's unlikely to waste space. Most GPUs work best with RGBA values so even if you choose RGB it's unlikely to save space.

> ```
> const type = gl.UNSIGNED_BYTE; 
> ```
> This is guaranteed to be correct, right? 

`texImage2D` takes the image you pass in and converts it to `type` and `format`. It then passes that converted data to the GPU. 

>  No HDR formats supported by the DOM?

That is undefined and browser specific. I know of no HDR image formats supported by any browsers. What image formats a browser supports is up to the browser. For example Firefox and Chrome support animated webp but Safari does not.

---

A common question some developers have is they want to know if they should turn on blending / transparency for a particular texture. Some mistakenly believe if the texture has alpha they should, otherwise they should not. This is false. Whether blending / transparency should be used is entirely separate from the format of the image and needs to be stored separately.

The same is true with other things related to images. What format to upload the image into the GPU is application and usage specific and has no relation to the format of the image file itself.



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/1106528">griffin2000</a>
    from
    <a data-href="https://stackoverflow.com/questions/58702384">here</a>
  </div>
</div>
