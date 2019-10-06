Title: OBJ to JS causes WebGL error
Description:
TOC: qna

# Question:

I downloaded a 3D mesh from [Archive3D][3], I then convert it to `.obj` in 3DS MAX using [these settings][1] and finally I convert the `.obj` to `.js` using [Three.js editor][4].

Then I create the scene and add the model, as shown [here][2].

These are the errors that I get in the console:

    [.WebGLRenderingContext]GL ERROR :GL_INVALID_OPERATION : glDrawElements: attempt to access out of range vertices in attribute 2 fly.html:1
    WebGL: too many errors, no more errors will be reported to the console for this context. 

What is the problem, is maybe the problem in the `.js` and how can I fix it?

 [1]: http://docs.autodesk.com/3DSMAX/16/ENU/3ds-Max-Help/index.html?url=files/GUID-437051A1-983B-4B6A-80C4-D2FA43B7393D.htm,topicNumber=d30e125388
 [2]: http://learningwebgl.com/blog/?p=1658
 [3]: http://archive3d.net/
 [4]: http://mrdoob.github.io/three.js/editor/

# Answer

It most likely means there's an error in the data. Many converters don't validate the data is actually correct. 

The error means the one or more of the indices in your data is out of range for the data given. In other words lets say you had a 3 vertices. That means you can only have indices in the range of 0 to 2. If you had an index greater than 2 you'd get that error. 

Whether the error is in the original data, in the converter to `.obj`, in the converter from `.obj` to `.js` we can't know without debugging through each of those steps. 

You could write code to walk through the data when you load it and check that none of the indices are out of range. What to do if they are is up to you. You could try to remove them. You'd need to remove them in groups of 3 assuming you're drawing triangles. In other words, figure out what the smallest buffer in the data is (positions, normals, texcoords) then walk the indices 3 at a time. If any of the 3 indices is out of range, delete those 3 indices.

Did the file display when you loaded it into the Three.js editor? If that's the case when either there is a bug in the Three.js editor when exporting, or else the data some how got corrupted some other way.

You also mentioned [code from this page](http://learningwebgl.com/blog/?p=1658) That page has nothing whatsoever to do with three.js. The format for data on that page with that code is unrelated to three.js AFAIK. Data exported with the Three.js editor is only for using in Three.js
