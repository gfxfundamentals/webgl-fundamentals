Title: Three.js Points, BufferGeometry : rendering point as circle
Description:
TOC: qna

# Question:

I'm new to three.js and shaders at all.
I need to create a sphere of particles, which move on surface like waves, but that's not a problem. Right now I got something like this.
[![current result][1]][1]

And here is result I need.
[![target result][2]][2]

So, how to render each point as circle or maybe, render texture? Right now my fragment shader is

    uniform sampler2D texture;
    uniform vec2 repeat;
    uniform float uTime;
    
    varying vec2 vOffset;
    
    precision mediump float;
    
    varying vec3 vColor;
    varying vec2 vUv;
    void main()
    {
            vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );
    
            vec4 tex = texture2D( texture, uv * 0.5);
            
            gl_FragColor = vec4(vec3(0.5, 0.8, 0.85), 0.8);
    }


Ofc i tried to render gl_FragColor = tex, but it doesn't seem to work though. My texture is just a particle.

[![particle][3]][3]


  [1]: https://i.stack.imgur.com/CqyOe.png
  [2]: https://i.stack.imgur.com/0mNFP.jpg
  [3]: https://i.stack.imgur.com/nO3u1.png

# Answer

What do you mean `gl_FragColor = tex` didn't work?

If you want to use a texture the code should be

    uniform sampler2D texture;

    void main() {
      gl_FragColor = texture2D(texture, gl_PointCoord);
    }

and you should probably turn on blending and set it up for premultiplied alpha and make sure your texture is using premultiplied alpha and the depth test is off.
