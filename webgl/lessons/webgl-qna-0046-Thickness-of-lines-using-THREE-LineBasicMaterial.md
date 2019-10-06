Title: Thickness of lines using THREE.LineBasicMaterial
Description:
TOC: qna

# Question:

I am using the code below to create hundreds of lines in my three.js scene

    edgeGeometry[i] = new THREE.Geometry();
    edgeGeometry[i].vertices[0] = v(x1,y1,z1);
    edgeGeometry[i].vertices[1] = v(x2,y2,z2);
    edgesMat[i] = new THREE.LineBasicMaterial({
        color: 0x6699FF, linewidth: 1, fog:true});
    edge[i] = new THREE.Line(edgeGeometry[i], edgesMat[i]);
    edge[i].type = THREE.Lines;
    scene2.add(edge[i]);

It works just fine, but when i change the value of "linewidth" to a bigger OR smaller value, i see NO difference in the scene.  
How should i change the thickness of the lines? Any ideas?  
Thanks, Dimitris

# Answer

This is no longer an issue just in ANGLE it's an issue on all platforms. Browsers needed to switching to the OpenGL 4+ core profile to support WebGL2 and the OpenGL 4+ core profile does not support line widths greater than 1. From the OpenGL 4.0+ spec, section E.2.1

> ## E.2.1 Deprecated But Still Supported Features

> The following features are deprecated, but still present in the core profile. They may be removed from a future version of OpenGL, and are removed in a forward compatible context implementing the core profile.

> * Wide lines - LineWidth values greater than 1.0 will generate an INVALID_VALUE error.

To draw thicker lines you need generate geometry. For three.js there is this library (pointed out by Wilt as well)

https://github.com/spite/THREE.MeshLine
