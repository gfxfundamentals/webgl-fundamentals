Title: Using clientWidth/clientHeight Javascript with webgl returns problems
Description:
TOC: qna

# Question:

I am using `document.getElementById('myid').clientWidth`  (`.clientHeight` for height) to get the width and the height of a div element to set the width and height of a container variable where I want my Webgl graphics to be done. 

Adding the value to a label for testing I was able to get correct values for the width and height of the element and then adding those values to the width and height, I was able to get everything working fine.

The problem comes when I directly add the statement `document.getElementById('myid').clientWidth` to the width variable. When I do that I get the wrong result. Any help?

Here is some of the code:

    var clientWidth = document.getElementById('webgl').clientWidth;
    var clientHeight = document.getElementById('webgl').clientHeight;

    var container = document.getElementById('webgl');
    var width = clientWidth, height =clientHeight;
    
    var renderer = new THREE.WebGLRenderer({alpha: (option.bgcolor === undefined)});
     renderer.setSize(width, height);
     renderer.setClearColor(option.bgcolor || 0, (option.bgcolor === undefined) ? 0 : 1);

     // camera and controls
 var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
 camera.position.set(0, 0, 50);


# Answer

This is because three.js is, sadly, not respecting your `width` and `height` settings but instead doing *magic* behind the scenes :(

To work around, use version r70+, that removes *some* of the magic.

Also, change your call to 

    renderer.setSize(width, height);

to 

    renderer.setSize(width, height, false);

Which tells three.js not to muck with the CSS of your canvas.

This is an ongoing issue with three.js. Three.js was trying to magically handle `devicePixelRatio` issues for you but it turns out that's nearly impossible. Here's some of the issues.

[5627](https://github.com/mrdoob/three.js/pull/5627),
[5908](https://github.com/mrdoob/three.js/pull/5908),
[6027](https://github.com/mrdoob/three.js/issues/6027).

