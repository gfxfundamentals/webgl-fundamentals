Title: How to avoid these edges around my transparent PNGs with WebGL?
Description:
TOC: qna

# Question:

I recently added opacity to my webgl fragment shader, replacing  

 gl_FragColor = texture2D(u_image, vec2(v_texCoord.s, v_texCoord.t));

with

 vec4 color = texture2D(u_image, vec2(v_texCoord.s, v_texCoord.t));
 gl_FragColor = vec4(color.rgb,  * color.a);

but since I did, a little edge appears around my transparent pngs.

Here you can see a little white edge around the worm body parts, where they layer on the background, and thin black edge where they layer on other worm parts.  
![enter image description here][1]  

With the old code, before I added the opacity, or when using Canvas 2D context instead of WebGL, there is no edge :  
![enter image description here][2]  

Here is one of the pngs I use for the worm body parts. As you can see there is no white edge around it, and no black edge on the bottom where it layers on another body part.  
![one of the pngs I use for the worm body parts][4]

Update : I updated SuperPNG export pluggin to last version, which does not anymore give white color to fully transparent pixels. It seems to me that the edge is actually still there but it is now the same color as the shape border so you barely can see it. The thin black edge at the back of the worm parts is still here though.  
![enter image description here][3]

I once had a similar sprite edge problem before and I added "premultipliedAlpha:false" in my getContext() call to fix it. The new code seems to ignore it. Whever I remove or let it in the getContext() call, the little edge stays around my sprites.

Here is my code :

 <script id="2d-fragment-shader" type="x-shader/x-fragment">
  precision mediump float;

  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  uniform float alpha;

  void main()
  {
   vec4 color = texture2D(u_image, vec2(v_texCoord.s, v_texCoord.t));
   gl_FragColor = vec4(color.rgb, alpha * color.a);
  }
 </script>

 ...

 webglalpha = gl.getUniformLocation(gl.program, "alpha");

 ...

 gl.uniform1f(webglalpha, d_opacity);


Does anybody know what is the problem and how to solve it ?


  [1]: http://i.stack.imgur.com/kKLOM.jpg
  [2]: http://i.stack.imgur.com/6Awvo.jpg
  [3]: http://i.stack.imgur.com/CWbj7.jpg
  [4]: http://i.stack.imgur.com/sQVHz.png

# Answer

Consider using premultiplied alpha. Change your blending mode to

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

If your images are not already premultiplied then do this in your shader

    float newAlpha = textureColor.a * alpha;
    gl_FragColor = vec4(textureColor.rgb * newAlpha, newAlpha);



