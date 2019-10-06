Title: update texture_2d_array in webgl via twgl.js
Description:
TOC: qna

# Question:

I'm using twgl for render some images in webgl. I need to dynamically add an Image to this array of 2d Textures.
I was using `twgl.createTexture` function to do this until know but there is a problem.
after I push some new image to my array of images and call `twgl.createTexture` to pass it to webgl and after that render my objects the images will not be shown correctly and instead of image a blue square will appear .
and when I manually render it again it makes correct and it will not break until use `twgl.createTexture` again.

I think that is becouse this function will make a new webglTexture instead update the previous one

I wants to know is there a way to update last texture with the last special array which has pushed some new image into it?

** when I say image I mean a base64 string or a loaded and cached url **

# Answer

as of v4.4.0 there is no way. twgl is just helper though, it doesn't do everything so you can always just do it manually.

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      };
    });

    function updateSlice(gl, texture, slice, img, options);
      const format = options.format || gl.RGBA; 
      const type = options.type || gl.UNSIGNED.BYTE;
      const level = options.level || 0;

      gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, level, 0, 0, slice, img.width, img.height, 1,
                       format, type, img);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }

    function updateSliceFromImage(gl, texture, slice, url, options) {
      loadImage(url)
      .then((e) => {
        updateSlice(gl, texture, slice, e.target, options);
      });
    }
