Title: equivalent of gl.readBuffer(gl.COLOR_ATTACHMENTx) in webgl 1.0
Description:
TOC: qna

# Question:

i need to render to 2 textures (in on pass of course) 
     
    var extbuffers = gl.getExtension('WEBGL_draw_buffers');

    var tex1 = gl.createTexture();  
    //gl.activeTexture(gl.TEXTURE1);  
    gl.bindTexture(gl.TEXTURE_2D, tex1);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PVS, PVS, 0, gl.RGBA,gl.FLOAT,null);


    var tex2 = gl.createTexture();
    //gl.activeTexture(gl.TEXTURE2);  
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PVS, PVS, 0, gl.RGBA, gl.FLOAT, null);  



    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex1, 0);  
  
    gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, tex2, 0);

    extbuffers.drawBuffersWEBGL(
    // Here, we give it the list of slots we want to draw to.
    [
        extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
        extbuffers.COLOR_ATTACHMENT1_WEBGL  // gl_FragData[1]
    ]
    );

and the fragment shader :  

    #extension GL_EXT_draw_buffers : require

    void main() {
 
                    gl_FragData[0] = vec4(pos,vit);
                    gl_FragData[1] = vec4(col,1.0);
    }


but now is my problem : how can i read the textures ? I have readen some similar questions but about FramebufferRenderbuffer

i would like a :  

    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(...);

    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(...);

Thanks.

EDIT : i use Webgl 1, but with *ad hoc* extension WEBGL_draw_buffers 

# Answer

Create more framebuffers, attach the textures individually to those framebuffers, bind those framebuffers when you want to read from the textures.

Effectively

    create texture1
    create texture2

    create drawFramebuffer
       attach texture1 as color attachment0
       attach texture2 as color attachment1

    create readFramebuffer1
       attach texture1 as color attachment0

    create readFramebuffer2
       attach texture2 as color attachment0

Now you bind `drawFramebuffer` when you want to draw, bind `readFrambuffer1` when you want to read from texture1 and bind `readFrameubffer2` when you want to read from texture2
