Title: Does the order of indices matter?
Description:
TOC: qna

# Question:

    this._vertices = new Float32Array([
                -0.5, 0, 0, // left
                0, 0.5, 0, // top
                0.5, 0, 0 // right
            ]);
    
    this._indicies = new Uint16Array([0, 1, 2]);

As you can see I have 3 points for a triangle. The problem with this is that my triangle doesn't end up getting rendered unless I change the indices to

    this._indicies = new Uint16Array([0, 2, 1]);

do you know why that is? Why does the order of the indices matter? And how do I know the correct order to put the indices in?

Ps. It works when setting the draw type to LINE_LOOP but it doesn't work on triangles.

# Answer

If culling is on `gl.enable(gl.CULL_FACE)` then triangles are culled if their vertex are counter clockwise in clip space (ie, after the vertex shader). You can choose which triangles, clockwise or counter-clockwise get culled with `gl.cullFace(...)`

         0             0
        / \           / \
       /   \         /   \
      2-----1       1-----2
       
    clockwise   counter-clockwise
