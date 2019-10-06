Title: Why isn't my texture repeating correctly?
Description:
TOC: qna

# Question:

I'm trying to apply a brick texture to my wall using THREE.RepeatWrapping, but for some reason it is not repeating correctly. I'm using a big cube as a wall, and I've made the texture only appear on the inside of the cube with the help of THREE.BackSide.

    var wallGeometry = new THREE.BoxGeometry(200, 100, 200);
    texture = THREE.ImageUtils.loadTexture("textures/bricks.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = 170 / 100;
    texture.repeat.y = 170 / 100;

    var material = new THREE.MeshPhongMaterial();
    material.map = texture;
    var wall = new THREE.Mesh(wallGeometry, material);

    wall.material.side = THREE.BackSide;

    scene.add(wall);

The result can be seen below.

[![the result][1]][1]


  [1]: http://i.stack.imgur.com/fCy7c.jpg

Thanks in advance!

# Answer

Is your texture a power of 2 in each dimension? WebGL can not repeat non-power of 2 textures. So for example a 640x480 texture will not repeat because both 640 and 480 are not powers of 2. A 1024x768 will not repeat either because while 1024 is a power of 2, 768 is not. A 512x256 texture will repeat because both dimensions are powers of 2.
