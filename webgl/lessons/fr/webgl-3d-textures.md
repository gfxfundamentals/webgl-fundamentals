Title: WebGL Textures
Description: Comment fonctionne les textures en WebGL
TOC: Textures


Cet article est la suite d'une série d'articles sur WebGL. Le premier [a
commencé avec les fondamentaux](webgl-fundamentals.html) et le précédent
concernait [animation](webgl-animation.html).

Comment appliquons-nous les textures en WebGL ? Vous pourriez probablement
déduire comment si vous avez lu [les articles sur le traitement
d'image](webgl-image-processing.html) mais ce sera probablement plus facile à
comprendre si nous l'examinons plus en détail détail.

La première chose que nous devons faire est d'ajuster nos shaders pour utiliser
des textures. Voici les modifications apportées au vertex shader, il faut lui
passer les coordonnées de la texture. Ensuite, nous les transmettrons directement au
fragment shader.

    attribute vec4 a_position;
    *attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    *varying vec2 v_texcoord;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * a_position;

    *  // Pass the texcoord to the fragment shader.
    *  v_texcoord = a_texcoord;
    }

Dans le fragment shader nous déclarons une variable uniform sampler2D qui nous permet
de référencer une texture. Nous utilisons les coordonnées de texture passées du
vertex shader et nous appelons `texture2D` pour rechercher la couleur à partir
de cette texture.

    precision mediump float;

    // Passed in from the vertex shader.
    *varying vec2 v_texcoord;

    *// The texture.
    *uniform sampler2D u_texture;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord);
    }

Nous devons configurer les coordonnées de texture

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    *var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    ...

    *// Create a buffer for texcoords.
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    *gl.enableVertexAttribArray(texcoordLocation);
    *
    *// We'll supply texcoords as floats.
    *gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    *
    *// Set Texcoords.
    *setTexcoords(gl);

Et vous pouvez voir les coordonnées que nous utilisons et qui cartographient
l'ensemble de la texture à chaque quad sur notre 'F'.

    *// Fill the buffer with texture coordinates for the F.
    *function setTexcoords(gl) {
    *  gl.bufferData(
    *      gl.ARRAY_BUFFER,
    *      new Float32Array([
    *        // left column front
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    *
    *        // top rung front
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    * ...
    *       ]),
    *       gl.STATIC_DRAW);

Nous avons également besoin d'une texture. Nous pourrions en créer une à partir
de zéro, mais ici nous chargeons une image, car c'est probablement le moyen le
plus courant.

Voici l'image que nous allons utiliser

<img class="webgl_center" src="../resources/f-texture.png" />

Quelle image passionnante ! En fait, une image avec un 'F' dessus a
une direction clair afin qu'il soit facile de dire si elle est tournée ou retournée, etc.
lorsque nous l'utilisons comme une texture.

La chose à propos du chargement d'une image est qu'elle se produit de manière
asynchrone. Nous selectionnons l'image à charger mais le navigateur met un certain
temps à la télécharger. Il y a généralement 2 solutions à cela. On pourrait
faire attendre le code jusqu'à ce que la texture soit téléchargée et ensuite
seulement commencer à dessiner. L'autre solution consiste à créer une texture
à utiliser jusqu'à ce que l'image soit téléchargée. De cette façon, nous pouvons
commencer le rendu immédiatement. Ensuite, une fois que l'image a été
téléchargé, nous copions l'image dans la texture. Nous utiliserons cette méthode
ci-dessous.

    *// Create a texture.
    *var texture = gl.createTexture();
    *gl.bindTexture(gl.TEXTURE_2D, texture);
    *
    *// Fill the texture with a 1x1 blue pixel.
    *gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    *              new Uint8Array([0, 0, 255, 255]));
    *
    *// Asynchronously load an image
    *var image = new Image();
    *image.src = "resources/f-texture.png";
    *image.addEventListener('load', function() {
    *  // Now that the image has loaded make copy it to the texture.
    *  gl.bindTexture(gl.TEXTURE_2D, texture);
    *  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    *  gl.generateMipmap(gl.TEXTURE_2D);
    *});

Et voilà

{{{example url="../webgl-3d-textures.html" }}}

Et si nous voulions simplement utiliser une partie de la texture sur le devant
du « F » ? Les textures sont référencées avec des "coordonnées de texture" et les
coordonnées de texture vont de 0.0 à 1.0 de gauche à la largeur de la texture, et de
0,0 à 1,0 du premier pixel de la première ligne au dernier pixel de la dernière
ligne. Remarquez que je n'ai pas dit en haut ou en bas. Le haut et le bas
n'ont aucun sens dans l'espace de texture parce que jusqu'à ce que vous
dessiniez quelque chose et que vous l'orientiez, il n'y a ni haut ni bas. Ce qui
compte, c'est de fournir des données de texture à WebGL. Le début de ces données
commence à la coordonnée de texture 0,0 et la fin de ces données est à 1,1

<img class="webgl_center noinvertdark" width="405" src="resources/texture-coordinates-diagram.svg" />

J'ai chargé la texture dans Photoshop et j'ai recherché les différentes
coordonnées en pixels.

<img class="webgl_center" width="256" height="256" src="../resources/f-texture-pixel-coords.png" />

Pour convertir des coordonnées en pixel en coordonnées de texture, nous pouvons
simplement utiliser

    texcoordX = pixelCoordX / (width  - 1)
    texcoordY = pixelCoordY / (height - 1)

Voici les coordonnées de texture pour le devant.

    // left column front
     38 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255, 223 / 255,
    113 / 255,  44 / 255,

    // top rung front
    113 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 85 / 255,
    218 / 255, 44 / 255,

    // middle rung front
    113 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 151 / 255,
    203 / 255, 112 / 255,

J'ai également utilisé des coordonnées de texture similaires pour le dos. Et les
voici.

{{{example url="../webgl-3d-textures-texture-coords-mapped.html" }}}

Pas un affichage très excitant, mais j'espère qu'il montre comment utiliser
coordonnées de texture. Si vous faites de la géométrie dans le code (cubes,
sphères, etc) il est généralement assez facile de calculer les coordonnées de texture que vous
voulez. D'autre part, si vous obtenez des modèles 3D à partir de
logiciel de modélisation 3D comme Blender, Maya, 3D Studio Max, vos
artistes (ou vous) ajusterez les coordonnées de texture dans ces packages.

Que se passe-t-il si nous utilisons des coordonnées de texture en dehors de la gamme 0,0
à 1,0. Par défaut, WebGL répète la texture. 0.0 à 1.0 est une "copie" de
la texture. 1.0 à 2.0 est une autre copie. Même -4,0 à -3,0 est encore un autre
exemplaire. Affichons un plan en utilisant ces coordonnées de texture.

     -3, -1,
      2, -1,
     -3,  4,
     -3,  4,
      2, -1,
      2,  4,

Et voilà

{{{example url="../webgl-3d-textures-repeat-clamp.html" }}}

Vous pouvez indiquer à WebGL de ne pas répéter la texture dans une certaine
direction en utilisant `CLAMP_TO_EDGE`. Par exemple

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

Cliquez sur les boutons dans l'exemple ci-dessus pour voir la différence.

Vous avez peut-être remarqué un appel à `gl.generateMipmap` lorsque nous avons
chargé la texture. C'est pour quoi ?

Imaginez que nous ayons une texture de 16x16 pixels.

<img class="webgl_center" src="resources/mip-low-res-enlarged.png" style="border: 2px solid black;" />

Imaginez maintenant que nous ayons essayé de dessiner cette texture sur un
polygone de 2x2 pixels de large sur l'écran. De quelles couleurs seront
ces 4 pixels ? Il y a 256 pixels au choix. Dans Photoshop, si vous avez mis à
l'échelle une image de 16x16 pixels en 2x2 pixels, il fera la moyenne des 8x8
pixels de chaque côté de l'image pour calculer les 4 pixels de l'image 2x2.
Malheureusement, lire 64 pixels et en faire la moyenne serait
beaucoup trop lent pour un GPU. En fait, imaginez si vous aviez une texture de
2048x2048 pixels et que vous essayez de la dessiner 2x2 pixels. Pour faire comme
Photoshop le fait pour chacun des 4 pixels du résultat 2x2, il faudrait faire la moyenne
de 1024x1024 pixels (soit 1 million de pixels) 4 fois. C'est beaucoup trop de calcul à
faire pour continuer à avoir un affichage rapide.

Donc, ce que fait le GPU, c'est qu'il utilise un mipmap. Un mipmap est une
collection d'images progressivement plus petites, chacune 1/4 de la taille de
la précédente. Le mipmap pour la texture 16x16 ci-dessus ressemblerait à ceci.

<img class="webgl_center noinvertdark nobg" src="resources/mipmap-low-res-enlarged.png" />

En général, chaque niveau inférieur n'est qu'une interpolation bilinéaire du
niveau précédent et c'est ce que fait `gl.generateMipmap`. Il regarde le plus
grand niveau et génère tous les niveaux plus petits pour vous. Bien sûr, vous
pouvez fournir vous-même les plus petits niveaux si vous le souhaitez.

Maintenant, si vous essayez de dessiner cette texture de 16x16 pixels en
2x2 pixels, WebGL peut sélectionner le mip 2x2 qui a déjà été calculé.

Vous pouvez choisir ce que fait WebGL en définissant le filtrage de texture pour
chaque texture. Il y a 6 modes

*   `NEAREST` = choisissez 1 pixel du plus grand mip
*   `LINEAR` = choisissez 4 pixels du plus grand mip et mélangez-les
*   `NEAREST_MIPMAP_NEAREST` = choisissez le meilleur mip, puis choisissez un pixel de ce mip
*   `LINEAR_MIPMAP_NEAREST` = choisissez le meilleur mip, puis mélangez 4 pixels de ce mip
*   `NEAREST_MIPMAP_LINEAR` = choisissez les 2 meilleurs mips, choisissez 1 pixel de chacun, mélangez-les
*   `LINEAR_MIPMAP_LINEAR` = choisissez les 2 meilleurs mips. choisissez 4 pixels de chacun, mélangez-les

Vous pouvez voir l'importance des mips dans ces 2 exemples. Le premier montre
que si vous utilisez `NEAREST` ou `LINEAR` et ne choisissez que la plus grande
image, vous obtiendrez beaucoup de scintillements car au fur et à mesure que les
choses bougent, pour chaque pixel qu'il dessine, il doit choisir un seul pixel
de la plus grande image. Ça change en fonction de la taille et de la position et
donc parfois il choisira un pixel, d'autres fois un autre et donc il scintille.

{{{example url="../webgl-3d-textures-mips.html" }}}

Remarquez à quel point ceux de gauche et du milieu scintillent tandis que ceux
de droite scintillent moins. Ceux de droite ont également des couleurs mélangées
puisqu'ils utilisent les mips. Plus vous dessinez des textures éloignés, plus WebGL
va choisir des pixels. C'est pourquoi, par exemple, celui en bas au
milieu, même s'il utilise `LINEAR` et le mélange 4 pixels, il scintille car ces
4 pixels proviennent de différents coins de l'image 16x16 selon lequel 4 sont
choisis, vous obtiendrez une couleur différente. Celui en bas à droite reste
cependant d'une couleur cohérente parce qu'il utilise le 2ème au plus petit mip.

Le deuxième exemple montre des polygones qui pénètrent profondément dans
l'écran.

{{{example url="../webgl-3d-textures-mips-tri-linear.html" }}}

Les 6 faisceaux entrant dans l'écran utilisent les 6 modes de filtrage
répertoriés au-dessus de. Le faisceau en haut à gauche utilise `NEAREST` et vous
pouvez voir qu'il est clairement très en bloc. Le milieu supérieur utilise
`LINEAR` et ce n'est pas beaucoup mieux. Le coin supérieur droit utilise
`NEAREST_MIPMAP_NEAREST`. Cliquez sur l'image pour passez à une texture où
chaque mip est d'une couleur différente et vous pourrez facilement voir où il
choisit d'utiliser un mip spécifique. Le bas à gauche utilise
`LINEAR_MIPMAP_NEAREST` signifie qu'il sélectionne le meilleur mip puis mélange
4 pixels dans ce mip. Vous pouvez toujours voir une zone claire où il bascule
d'un mip au mip suivant. Le milieu inférieur utilise `NEAREST_MIPMAP_LINEAR`
signifie qu'il choisit les 2 meilleurs mips, puis il choisit un pixel de chacun et en les
mélangeant. Si vous regardez de près, vous pouvez voir comment c'est encore
polyédrique, surtout dans le sens horizontal. Le coin inférieur droit utilise
`LINEAR_MIPMAP_LINEAR` qui sélectionne les 2 meilleurs mips, en sélectionnant 4
pixels de chacun et mélange les 8 pixels.

<img class="webgl_center noinvertdark nobg" src="resources/different-colored-mips.png" />
<div class="webgl_center">different colored mips</div>

Vous vous demandez peut-être pourquoi choisiriez-vous autre chose que
`LINEAR_MIPMAP_LINEAR` qui est sans doute le meilleur. Il y a beaucoup de
raisons. La première est que `LINEAR_MIPMAP_LINEAR` est le plus lent. Lire 8
pixels est plus lent que lire 1 pixel. Sur le matériel GPU moderne,
c'est probablement pas un problème si vous n'utilisez qu'une seule texture à la
fois, mais les jeux modernes peuvent utiliser 2 à 4 textures à la fois. 4 textures
\* 8 pixels par texture = besoin de lire 32 pixels pour chaque pixel dessiné. ça
va être lent. Une autre raison est que si vous essayez d'atteindre un certain
effet. Par exemple, si vous voulez que quelque chose ait un effet *rétro* pixélisé
peut-être que vous utiliserez `NEAREST`. Les mips prennent
également de la mémoire. En fait ils prennent 33% de mémoire en plus. Cela peut
être beaucoup de mémoire, surtout pour un très grande texture comme vous
pourriez l'utiliser sur un écran de titre d'un jeu. Si vous n'allez jamais
dessiner quelque chose de plus petit que le plus grand mip pourquoi gaspiller
de la mémoire pour ces mips. Au lieu de cela, utilisez simplement `NEAREST` ou
`LINEAR` car ils n'utilisent que le premier mip.

Pour définir le filtrage, vous appelez `gl.texParameter` comme ceci

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

`TEXTURE_MIN_FILTER` est le paramètre utilisé lorsque la taille que vous dessinez est inférieure au plus grand mip.
`TEXTURE_MAG_FILTER` est le paramètre utilisé lorsque la taille que vous dessinez est supérieure au
plus grand mip. Pour `TEXTURE_MAG_FILTER`, seuls `NEAREST` et `LINEAR` sont des paramètres valides.

Disons que nous voulions appliquer cette texture.

<img class="webgl_center" src="../resources/keyboard.jpg" />

C'est ici.

{{{example url="../webgl-3d-textures-bad-npot.html" }}}

Pourquoi la texture du clavier n'apparaît-elle pas ? C'est parce que WebGL a une
sorte de restriction sévère sur les textures qui ne sont pas une puissance de 2
dans les deux dimensions. Les puissances de 2 sont 1, 2, 4, 8, 16, 32, 64, 128,
256, 512, 1024, 2048, etc. La texture 'F' était de 256x256. 256 est une
puissance de 2. La texture du clavier est de 320x240. Ni l'un ni l'autre ne sont
un pouvoir de 2 donc essayer d'afficher la texture échoue. Dans le shader
lorsque `texture2D` est appelé et lorsque la texture référencé n'est pas
configuré correctement WebGL utilisera la couleur (0, 0, 0, 1) qui est le noir.
Si vous ouvrez la console JavaScript ou Web Console, selon le navigateur, vous
pouvez voir des erreurs indiquant le problème comme celui-ci


    WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2
       or not all the same size
    WebGL: drawArrays: texture bound to texture unit 0 is not renderable.
       It maybe non-power-of-2 and have incompatible texture filtering or
       is not 'texture complete'.

Pour résoudre ce problème, nous devons définir le mode d'habillage sur
`CLAMP_TO_EDGE` et désactiver le mapping mip en définissant le filtrage à
`LINEAR` ou `NEAREST`.

Mettons à jour notre code de chargement d'image pour gérer cela. Nous avons
d'abord besoin d'une fonction qui nous dira si une valeur est une puissance de
2.

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

Je ne vais pas entrer dans les calculs binaires pour savoir pourquoi cela
fonctionne. Comme cela fonctionne, nous pouvons l'utiliser comme suit.

    // Asynchronously load an image
    var image = new Image();
    image.src = "resources/keyboard.jpg";
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    *  // Check if the image is a power of 2 in both dimensions.
    *  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    *     // Yes, it's a power of 2. Generate mips.
         gl.generateMipmap(gl.TEXTURE_2D);
    *  } else {
    *     // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    *  }
    }

Et voilà

{{{example url="../webgl-3d-textures-good-npot.html" }}}

Ce ne sont pas seulement les textures en puissance de 2 qui ne seront pas rendue. WebGL
exige que les textures soient "texture complète". "texture complète" signifie
que soit

1. Vous avez défini le filtrage de sorte qu'il n'utilise que le premier niveau
   mip, ce qui signifie en définissant `TEXTURE_MIN_FILTER` sur `LINEAR` ou
   `NEAREST`.

2. Si vous utilisez des mips, ils doivent être de la bonne taille et vous devez
   TOUS les fournir. jusqu'à la taille 1x1.

   La façon la plus simple de le faire est d'appeler `gl.generateMipmap`. Sinon, si
   vous fournissez vos propres mips, vous devez les fournir tous.

3. Si les textures ne sont pas une puissance de 2 dans les deux dimensions,
   alors comme mentionné ci-dessus vous devez définir `TEXTURE_MIN_FILTER` sur
   `LINEAR` ou `NEAREST` **et** vous devez définissez `TEXTURE_WRAP_S` et
   `TEXTURE_WRAP_T` sur `CLAMP_TO_EDGE`.

Si l'un des points ci-dessous n'est pas remplis, lorsque vous récupérerez dans la valeur de la
texture dans votre shader 0,0,0,1.

Une question courante est "Comment appliquer une image différente à chaque face
d'un cube ?". Par exemple disons que nous avait ces 6 images.

<div class="webgl_table_div_center">
<table class="webgl_table_center">
<tr><td><img src="resources/noodles-01.jpg" /></td><td><img src="resources/noodles-02.jpg" /></td></tr>
<tr><td><img src="resources/noodles-03.jpg" /></td><td><img src="resources/noodles-04.jpg" /></td></tr>
<tr><td><img src="resources/noodles-05.jpg" /></td><td><img src="resources/noodles-06.jpg" /></td></tr>
</table>
</div>

3 réponses me viennent à l'esprit

1) créer un shader compliqué qui référence 6 textures et transmettre des
informations supplémentaires par sommet dans le vertex shader qui est passé au
fragment shader pour décider quelle texture utiliser. NE FAITES PAS CELA ! Une
petite réflexion montrerait clairement que vous finiriez par devoir écrire des
tonnes de shaders différents si vous vouliez faire la même chose pour
différentes formes avec plus de côtés, etc.

2) dessiner 6 plans au lieu d'un cube. C'est une solution commune. Ce n'est pas
mal mais ça marche aussi vraiment pour les petites formes comme un cube. Si vous
aviez une sphère avec 1000 quads et que vous vouliez mettre une texture
différente sur chaque quad il faudrait dessiner 1000 plans et ce serait lent.

3) La, oserais-je dire, *la meilleure solution* est de mettre toutes les images
dans 1 texture et d'utiliser les coordonnées de texture pour mapper une partie
différente de la texture sur chaque face du cube. C'est à peu près la technique
que toutes les applications hautes performances (comprendre *jeux*) utilisent. Ainsi, par
exemple, nous mettrions toutes les images dans une texture éventuellement comme
ça

<img class="webgl_center" src="../resources/noodles.jpg" />

Et puis utilisez un ensemble différent de coordonnées de texture pour chaque
face du cube.

        // select the top left image
        0   , 0  ,
        0   , 0.5,
        0.25, 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // select the top middle image
        0.25, 0  ,
        0.5 , 0  ,
        0.25, 0.5,
        0.25, 0.5,
        0.5 , 0  ,
        0.5 , 0.5,
        // select to top right image
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // select the bottom left image
        0   , 0.5,
        0.25, 0.5,
        0   , 1  ,
        0   , 1  ,
        0.25, 0.5,
        0.25, 1  ,
        // select the bottom middle image
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // select the bottom right image
        0.5 , 0.5,
        0.75, 0.5,
        0.5 , 1  ,
        0.5 , 1  ,
        0.75, 0.5,
        0.75, 1  ,

Et nous obtenons

{{{example url="../webgl-3d-textures-texture-atlas.html" }}}

Ce style d'application utilisant plusieurs images à l'aide d'une seule texture est
souvent appelé un *atlas de textures*. C'est mieux parce qu'il n'y a qu'une
seule texture à charger, la shader reste simple car il n'y a qu'à référencer 1
texture, et il ne nécessite qu'1 rafraichissement pour dessiner la forme au lieu d'
1 rafraichissement par texture comme cela pourrait être le cas si nous le
divisions en plans.

A few other very important things you might want to know about textures.
One is [how texture unit state works](webgl-texture-units.html).
One is [how to use 2 or more textures at once](webgl-2-textures.html). Another
is [how to use images from other domains](webgl-cors-permission.html). And
one more is [perspective correct texture mapping](webgl-3d-perspective-correct-texturemapping.html) which in some ways
is trivia but it's good to know.
Quelques autres choses très importantes que vous voudriez peut-être savoir sur
les textures. L'une est [comment fonctionne l'état de l'unité de texture]
(webgl-texture-units.html). Une autre est [comment utiliser 2 textures ou plus à la
fois] (webgl-2-textures.html). Encore une autre est [comment utiliser des images
d'autres domaines] (webgl-cors-permission.html). Et une dernière serait la [perspective
correct des mapping de texture] (webgl-3d-perspective-correct-texturemapping.html) qui,
à certains égards est banal mais c'est bon à savoir.

Next up [supplying data to a texture from JavaScript](webgl-data-textures.html).
Or, you could also check out [simplifying WebGL with less code more fun](webgl-less-code-more-fun.html).
La suite [fournir des données à une texture à partir de JavaScript]
(webgl-data-textures.html). Ou, vous pouvez également consulter [simplifier
WebGL avec moins de code et de manière plus amusante](webgl-less-code-more-fun.html).

<div class="webgl_bottombar">
<h3>UVs vs. Coordonées de Texture</h3>
<p>Les coordonnées de texture sont souvent raccourcies en texture coords,
texcoords ou UV (prononcé Yu-Vi). Je n'ai aucune idée d'où vient le terme UV,
sauf que les positions des sommets utilisent souvent <code>x, y, z, w</code>
donc pour les coordonnées de texture, ils ont décidé d'utiliser <code>s, t, u,
v</code> pour essayer de préciser à quel type des 2 types vous faites référence.
Étant donné que les deux premiers paramètres s'appellent ST, si
vous regardez aux paramètres de wrapping de texture, ils sont appelés
<code>TEXTURE_WRAP_S</code> et <code>TEXTURE_WRAP_T</code> mais pour une raison
quelconque depuis que je travaille dans les graphismes, les gens les ont appelés
UV.
</p>
<p>Alors maintenant, vous savez si quelqu'un parle d'UV, il parle de coordonnées de
texture.</p>
</div>



