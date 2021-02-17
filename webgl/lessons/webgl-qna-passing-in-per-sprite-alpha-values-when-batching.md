Title: Passing in per sprite alpha values when batching
Description: Passing in per sprite alpha values when batching
TOC: Passing in per sprite alpha values when batching

## Question:

I'm creating a 2D rendering engine with WebGL in which I'm using Texture Atlases and batching hundreds of entities at once. I need to set a unique alpha value for each entity, and I'm at a loss of how to do this.

My current fragment shader is this:

        precision mediump float;

        uniform float u_alpha;
        uniform sampler2D u_image;

        varying vec2 v_texCoord;

        void main () {
            vec4 texture = texture2D(u_image, v_texCoord);
            gl_FragColor = vec4(texture.rgb, texture.a * u_alpha);
        }

I'd like to change that global uniform into a uniform buffer or an array of unique values that will be applied to the v_texCoord, but I don't know how to do this.

## Answer:

You need to pass those values in as an attribute just like `v_texCoord`.

in vertex shader

    attribute float a_alpha;
    varying float v_alpha;
    ...
    void main() {
       ...
       v_alpha = a_alpha;  // pass the alpha values to the fragment shader.
       ...
    }

in fragment shader

    varying float v_alpha;
    ...
    gl_FragColor = vec4(texture.rgb, texture.a * v_alpha);

Instead of using a separate attribute you could also just make your texture coordinates have 3 values. u, v, and alpha. In other words, change `v_texCoord` to a `vec3`. Update the attribute in the vertex shader to take a `vec3`. Update your UV data so each UV also has an alpha. Change your fragment shader to.

    varying vec3 v_texCoord;

    void main () {
        vec4 texture = texture2D(u_image, v_texCoord.xy);
        gl_FragColor = vec4(texture.rgb, texture.a * v_texCoord.z);
    }

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/1352484">Abraham Walters</a>
    from
    <a data-href="https://stackoverflow.com/questions/15770366">here</a>
  </div>
</div>
