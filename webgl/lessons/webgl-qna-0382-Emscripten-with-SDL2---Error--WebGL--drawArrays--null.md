Title: Emscripten with SDL2 - Error: WebGL: drawArrays: null
Description:
TOC: qna

# Question:

So I'm trying to compile some SDL2 code with emscripten and I'm running into pitfall after pitfall, most I can solve myself but this baffles me.

Currently I'm trying to draw a quad to screen using OpenGL as such:

    void sprite::init(float x, float y, float width, float height)
    {
        _x = x;
        _y = y;
        _width = width;
        _height = height;
    
        if(_vboID == 0)
        {
            glGenBuffers(1, &_vboID);
        }
    
        float vertexData[12];
        
        vertexData[0] = x + width;
        vertexData[1] = y + height;
    
        vertexData[2] = x;
        vertexData[3] = y + height;
    
        vertexData[4] = x;
        vertexData[5] = y;
    
        //second
    
        vertexData[6] = x;
        vertexData[7] = y;
    
        vertexData[8] = x + width;
        vertexData[9] = y;
    
        vertexData[10] = x + width;
        vertexData[11] = y + height;
    
        glBindBuffer(GL_ARRAY_BUFFER, _vboID);
        glBufferData(GL_ARRAY_BUFFER, sizeof(vertexData), 
                     vertexData, GL_STATIC_DRAW);
        glBindBuffer(GL_ARRAY_BUFFER, 0);
    }
    
    void sprite::draw()
    {
        glBindBuffer(GL_ARRAY_BUFFER, _vboID);
        
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glDisableVertexAttribArray(0);
    
        glBindBuffer(GL_ARRAY_BUFFER, 0);
    }

This should generate a quad, or so one would think.
Of course, it does not, instead it generates some errors

    Error: WebGL: drawArrays: null CURRENT_PROGRAM sdl2.js:1:186510
    Error: WebGL: No further warnings will be reported for this WebGL context. (already reported 32 warnings)

And thus we come to the core of the issue, how would one go about solving this?

# Answer

Like Cubic mentioned the error message says you need a shader.

WebGL is based on OpenGL ES 2.0 (not to be confused with OpenGL).

OpenGL ES 2.0 has no fixed function pipeline. It requires shaders 100% all the time whereas OpenGL (on desktop) is 20+ years old and has an old no shaders needed mode. What that means is often things work kind of by accident on Desktop because of all the backward compatibility stuff lingering around where as in WebGL not only is it based on OpenGL ES 2.0 it's extremely strict on enforcement to hopefully try to make WebGL behave the same everywhere so that web pages using it are more likely to function.

If you'd like to test OpenGL ES 2.0 on your desktop and you happen to be using Windows you can use [ANGLE](http://code.google.com/p/angleproject) which emulates OpenGL ES 2.0. Several projects use it so they can target one API that works almost everywhere. Meaning they can target OpenGL ES 2.0 and their code will likely work on Mac, Android, iOS, Linux and Windows (using ANGLE). Because ANGLE emulates OpenGL ES 2.0 it doesn't have the fixed function stuff that is currently letting you do things you can't do and so using it would help you start with C/C++ and be more likely not to use features that are not available in WebGL

