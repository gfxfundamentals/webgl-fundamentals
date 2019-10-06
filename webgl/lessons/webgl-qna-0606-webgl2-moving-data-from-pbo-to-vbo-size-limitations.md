Title: webgl2 moving data from pbo to vbo size limitations
Description:
TOC: qna

# Question:

I'm trying to copy some data from a texture to a VBO. I'm not really sure if im doing it right nor if i understand what a PBO is, but i have something like this:

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

 gl.bindBuffer( gl.PIXEL_PACK_BUFFER , this.vbo );
 gl.readPixels( 0,0, this._numVerts * 2 , 1 , gl.RGBA , gl.FLOAT , 0 );


Which as far as i can tell works. 

I'm confused though by the size of the rectangle in gl.readPixels. Is it possible to read an arbitrary number of pixels? 

Say i want to read `GL_MAX_TEXTURE_SIZE + 1`? I can read an entire row, but what can i do about the remainder, is there some way to provide an offset and do this with multiple reads? 

Ie.

    gl.readPixels( 0,0, textureWidth , someNumberOfRows , gl.RGBA , gl.FLOAT , 0 );

    //? something like bufferSubData
    
    gl.readPixels( 0, someNumberOfRows, remainder , 1 , gl.RGBA , gl.FLOAT , 0 );

# Answer

The short answer is *no*. AFAICT You can only read rectangles of data and you have to read by whole pixels. 

Maybe consider rounding up to entire rows or change your output to fit in the smallest rectangle.
