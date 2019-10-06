Title: GLSL - fragment shaders for image manipulation/blending
Description:
TOC: qna

# Question:

I'm trying to build a shader that allows you to combine two images by applying a gradient opacity mask to the one on top, like you do in photoshop. I've gotten to the point where I can overlay the masked image over the other but as a newbie am confused about a few things.

It seems that the images inside the shader are sometimes skewed to fit the canvas size, and they always start at position 0,0. I have played around with a few snippets I have found to try and scale the textures, but always end up with unsatisfactory results. 

I am curious if there is a standard way to *size, skew, and translate* textures within a view, or if images in GLSL are necessarily limited in some way that will stop me from accomplishing my goal.

I'm also unsure of how I am applying the gradient/mask and if it is the right way to do it, because I do not have a lot of control over the shape of the gradient at the moment.

Here's what I have so far:

      precision highp float;
      varying vec2 uv;
      uniform sampler2D originalImage;
      uniform sampler2D image;
      uniform vec2 resolution;

      void main(){

        float mask;
        vec4 result;

        vec2 position = gl_FragCoord.xy / ((resolution.x + resolution.y) * 2.0 );

        mask = vec4(1.0,1.0,1.0,1.0 - position.x).a;

        vec4 B = texture2D(image,uv);
        vec4 A = texture2D(originalImage,uv) * (mask);

        result = mix(B, A, A.a);

        gl_FragColor = result;
      }

Which produces an image like this:

![](https://i.imgur.com/ULhkHhl.jpg)

What I would like to be able to do is change the positions of the images independently and also make sure that they conform to their proper dimensions. 

I have tried naively shifting positions like this:

    vec2 pos = uv;
    pos.y = pos.y + 0.25;
    texture2D(image, pos)

Which does shift the texture, but leads to a bunch of strange lines dragging:

![](https://i.imgur.com/sZ0x707.jpg)

I tried to get rid of them like this:

    gl_FragColor = uv.y < 0.25 ? vec4(0.0,0.0,0.0,0.0) : result;

but it does nothing
    


# Answer

You really need to decide what you want to happen when images are not the same size. What you probably want is for it to appear there's no image so check your UV coordinates and use 0,0,0,0 when outside of the image

    //vec4 B = texture2D(image,uv);

    vec4 getImage(sampler2D img, vec2 uv) {
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        return vec4(0);
      }
      return texture2D(img, uv);
    }

    vec4 B = getImage(image, uv);

As for a standard way to size/skew/translate images use a matrix

    uniform mat4 u_imageMatrix;

    ...

    vec2 newUv = u_imageMatrix * vec4(uv, 0, 1).xy;

[An example of implementing canvas 2d's `drawImage` using a texture matrix](http://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html).

In general though I don't think most image manipulations programs/library would try to do everything in the shader. Rather they'd build up the image with very very simple primitives. My best guess would be they use a shader that's just `A * MASK` then draw `B` followed by `A * MASK` with blending on.

To put it another way, if you have 30 layers in photoshop they wouldn't generate a single shader that computes the final image in one giant shader taking in all 30 layers at once. Instead each layer would be applied on its own with simpler shaders.

I also would expect them to create an texture for the mask instead of using math in the shader. That way the mask can be arbitrarily complex, not just a 2 stop ramp.

Note I'm **not** saying you're doing it wrong. You're free to do whatever you want. I'm only saying I suspect that if you want to build a generic image manipulation library you'll have more success with smaller building blocks you combine rather than trying to do more complex things in shaders.

ps: I think `getImage` can be simplified to

    vec4 getImage(sampler2D img, vec2 uv) {
      return texture2D(img, uv) * step(0.0, uv) * step(-1.0, -uv);
    }

