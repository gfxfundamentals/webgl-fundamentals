Title: Disable images caching in browser
Description:
TOC: qna

# Question:

I have Earth weather web application that once per six hours receives new weather maps (as images). I want to browser to not cache these images to allow user experience fresh weather not cached from previous days.
My setup is:

- Angular 2 application build with --prod param and uploaded to hosting via ftp
- Python "backend" that once per six hours download grib data, convert it to images and upload to ftp.


I've tried to add to header of index.html meta data:

```html
  <meta http-equiv='cache-control' content='no-cache'>
  <meta http-equiv='expires' content='0'>
  <meta http-equiv='pragma' content='no-cache'>
```
These textures are loaded this way:
```typescript
   this.ParticlesVelocitiesImage = new Image();
   this.ParticlesVelocitiesImage.src = require('./Textures/dirswindsigma995.jpg');
   this.ParticlesVelocitiesImage.onload = () => {
       this.ParticlesVelocities = this.gl.createTexture();
       this.gl.bindTexture(this.gl.TEXTURE_2D, this.ParticlesVelocities);
       this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.ParticlesVelocitiesImage.width,
       this.ParticlesVelocitiesImage.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.ParticlesVelocitiesImage)
       this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
       this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    }
```

However textures are still cached. I need to clear cache manually to experience freshly updated weather maps.

**UPDATE**
After Reactgular and gman responses I started to look after another way of loading images. So instead of ```require()``` I added ```<img hidden="true" [src] = "urlwith?timestamp">``` tags in my component's HTML template and provide url with timestamp after question mark. Then the rest is the same, ```onload``` function of image is triggered and my texture is loaded. However because my webgl2 application is quite performance needy I'd rather avoid another images being rendered in HTML. 

# Answer

This is not a texture issue it's an `<img>` issue. The supposed solution is you need to send the correct headers from your server to tell the browser not to cache the texture. If you can't set the correct headers a workaround is to add query parameters to your image URL.

```
const imageUrl = `./Textures/dirswindsigma995.jpg?${Date.now()}`;
```

Now every time you request the image the browser will see a different URL

Note that it's unlikely you can use `require` for this.


