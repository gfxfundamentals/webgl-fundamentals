Title: WebGL texture on top of texture
Description:
TOC: qna

# Question:

I'm working on a project where I incorporate a webcam stream onto a spherical geometry. As I'm new to shaders and want to learn how this works, I want to project the webcam into the sphere using a relatively normal size, on top of a static background image.

So the webcam video has to cover only a small portion of the sphere, but the background image has to cover the entire sphere.

Currently my webcam image looks like this:
[current situation][1]

But I want it to look like this:
[desired situation][2]

I have the following vertex shader:

       uniform mat4 projectionMat;
   uniform mat4 modelViewMat;
   attribute vec3 position;
   attribute vec2 texCoord;
   attribute vec2 texVideoCoord;
   varying vec2 vTexCoord;
   varying vec2 vTexVideoCoord;

   void main() {
     vTexCoord = texCoord;
     vTexVideoCoord = texVideoCoord;
     gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );
   }

And the following fragment shader, which currently draws "video" which is the webcam stream.

   precision mediump float;

   // Textures
   uniform sampler2D u_background;
   uniform sampler2D u_video;

   varying vec2 vTexCoord;
   varying vec2 vTexVideoCoord;

   void main() {
     vec4 background = texture2D(u_background, vTexCoord);
     vec4 video = texture2D(u_video, vTexVideoCoord);
     gl_FragColor = video;
   }

And my render function is set up as followed:

        this.program.use();

        //setup attributes
        //setup uniforms
        context.gl.uniformMatrix4fv(this.program.uniform.projectionMat, false, projectionMat);
        context.gl.uniformMatrix4fv(this.program.uniform.modelViewMat, false, modelViewMat);

        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.vertBuffer);
        context.gl.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        context.gl.enableVertexAttribArray(this.program.attrib.position);
        context.gl.enableVertexAttribArray(this.program.attrib.texCoord);
        context.gl.enableVertexAttribArray(this.program.attrib.texVideoCoord);

        context.gl.vertexAttribPointer(this.program.attrib.position, 3, context.gl.FLOAT, false, 20, 0);
        context.gl.vertexAttribPointer(this.program.attrib.texCoord, 2, context.gl.FLOAT, false, 20, 12);
        context.gl.vertexAttribPointer(this.program.attrib.texVideoCoord, 2, context.gl.FLOAT, false, 20, 12);

        var u_backgroundLocation = context.gl.getUniformLocation(this.program.program, "u_background");
        var u_videoLocation = context.gl.getUniformLocation(this.program.program, "u_video");
        context.gl.uniform1i(u_backgroundLocation, 0);
        context.gl.uniform1i(u_videoLocation, 1);

        //activetexture/bind
        context.gl.activeTexture(context.gl.TEXTURE0);
        context.gl.bindTexture(context.gl.TEXTURE_2D, self.textureBackground);
        context.gl.texImage2D(context.gl.TEXTURE_2D, 0, context.gl.RGBA, context.gl.RGBA, context.gl.UNSIGNED_BYTE, self.canvasElement);
        context.gl.activeTexture(context.gl.TEXTURE1);
        context.gl.bindTexture(context.gl.TEXTURE_2D, self.textureVideo);
        context.gl.texImage2D(context.gl.TEXTURE_2D, 0, context.gl.RGBA, context.gl.RGBA, context.gl.UNSIGNED_BYTE, self.videoElement);

        //drawarrays/drawelements
        context.gl.drawElements(context.gl.TRIANGLES, this.indexCount, context.gl.UNSIGNED_SHORT, 0);

I have no clue as how to continue to make the webcam appear scaled and part of the sphere as opposed to stretched over it. The webcam is a 100 degree camera, and should be positioned as such inside the sphere.

  [1]: http://i.stack.imgur.com/huvRX.png
  [2]: http://i.stack.imgur.com/G91w3.jpg

# Answer

Another way to do it would be to set your video UV coordinates so the 0<->1 range represents the area you want to see the video

In other words the background's UVs go

    0,0       0.3    0.7    1.0
        +------+------+------+
        |      |      |      |
        |      |      |      |
        |      |      |      |
    0.3 +------+------+------+
        |      |      |      |
        |      |      |      |
        |      |      |      |
    0.7 +------+------+------+
        |      |      |      |
        |      |      |      |
        |      |      |      |
    1.0 +------+------+------+

but the video UVs go


    -1,-1      0      1      2
        +------+------+------+
        |      |      |      |
        |      |      |      |
        |      |      |      |
      0 +------+------+------+
        |      |......|      |
        |      |......|      |
        |      |......|      |
      1 +------+------+------+
        |      |      |      |
        |      |      |      |
        |      |      |      |
      2 +------+------+------+


Which makes the `......` part the part between 0 and 1

Then you shader would be


       precision mediump float;

        // Textures
        uniform sampler2D u_background;
        uniform sampler2D u_video;

        varying vec2 vTexCoord;
        varying vec2 vTexVideoCoord;

        void main() {
          vec4 background = texture2D(u_background, vTexCoord);
          vec4 video = texture2D(u_video, vTexVideoCoord);
          vec2 m = step(vec2(0), vTexVideoCoord) * step(vTexVideoCoord, vec2(1));
          gl_FragColor = mix(background, video, m.x * m.y);
        }


