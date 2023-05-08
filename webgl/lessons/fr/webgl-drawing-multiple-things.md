Title: WebGL - Dessiner plusieurs choses
Description: Comment dessiner different sorte de choses en webgl
TOC: Dessiner plusieurs choses


Cet article est la suite de [WebGL Les bases](webgl-fundamentals.html).
Si vous ne les avez pas lu, je vous suggère de commencer par ceux là.

L'une des questions les plus courantes après avoir affiché quelque chose
avec WebGL, c'est comment en afficher plusieurs.

L'une des premières choses à réaliser est qu'à part quelques exceptions,
WebGL comme avoir une fonction écrite par une personne qui au lieu de passer tous
les paramètres à celle-ci, vous aviez une simple fonction qui affiche des choses et
plus de 70 autres qui initialisent l'état de la première. Par exemple, imaginez que
vous ayez une fonction qui dessine un cercle. Vous pourriez avoir le code suivant

    function drawCircle(centerX, centerY, radius, color) { ... }

Ou vous pourriez le coder comme ça

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL fonction de la seconde manière. Les fonctions comme `gl.createBuffer`,
`gl.bufferData`, `gl.createTexture`, et `gl.texImage2D` vous permettent de charger
les données des buffers (vertex), des textures (couleurs, etc...).
`gl.createProgram`, `gl.createShader`, `gl.compileShader` et
`gl.linkProgram` vous permettent de charger les shaders GLSL. Presque tout le reste
des fonctions WebGL configurent les variables globales ou les états qui sont utilisés
quand les fonctions `gl.drawArrays` ou `gl.drawElements` sont appelées.

Sachant cela, un programme WebGL typique aura la structure suivante.

Au moment de l'initialisation

*   Créé tous les shaders et les programmes et récupère leur emplacement
*   Créé les buffers et chargent les données des sommets
*   Créé les textures et chargent les données des textures

Au moment du rendu

*   Effacer et mettre à jour le viewport ainsi que les autres états
    globaux (activer le depth testing, activer le culling, etc...)
*   Pour chacune des choses que vous souhaitez dessiner :
    *   Appeler `gl.useProgram` pour selectionner le programme de dessin.
    *   Initialiser les _attributes_ pour les choses que vous souhaitez dessiner
        *   Pour chaque _attribute_, appelez `gl.bindBuffer`,
            `gl.vertexAttribPointer` et `gl.enableVertexAttribArray
    *   Initialiser les _uniforms_ pour les choses que vous souhaitez dessiner
        *   Appelez `gl.uniformXXX` pour chaque _uniform_
        *   Appelez `gl.activeTexture` et `gl.bindTexture` pour assigner les textures
            aux _textures unit_
    *   Appelez `gl.drawArrays` ou `gl.drawElements`

C'est aussi simple que ça. C'est à vous d'organiser votre code pour
accomplir cette tâche.

Plusieurs choses comme le chargement des données de texture (et peut-être même
les données des sommets) peuvent être initialisées de manière asynchrone, parce que
vous avez besoin d'attendre que ce soit téléchargé sur le net.

Essayons de faire une simple application qui dessine 3 choses : un cube, une sphère
et un cône.

Je ne vais pas rentrer dans les détails de comment faire un cube, une sphère
ou un cône. Considérons que nous avons des fonctions pour les créer et
retourner [les buffers comme décrits dans le chapitre précédent](webgl-less-code-more-fun.html).

Voici donc le code. Notre shader est le même shader simple de notre
[exemple de perspective] (webgl-3d-perspective.html) sauf que nous avons ajouté un
`u_colorMult` pour multiplier les sommets par des couleurs.

    // Passed in from the vertex shader.
    varying vec4 v_color;

    uniform vec4 u_colorMult;

    void main() {
       gl_FragColor = v_color * u_colorMult;
    }


Au moment de l'initialisation

    // Our uniforms for each thing we want to draw
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // The translation for each object.
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

Au moment du dessin

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Draw the sphere --------

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, cubeUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);

    // ------ Draw the cone --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, coneBufferInfo);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, coneUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, coneBufferInfo.numElements);

Et voilà !

{{{example url="../webgl-multiple-objects-manual.html" }}}

Une chose à noter est que puisque nous n'avons qu'un seul programme de shader,
nous n'avons pas besoin d'appeler `gl.useProgram` plusieurs fois. Si nous avons
différents programmes de shader, vous aurez besoin d'appeler `gl.useProgram`
avant euh ... l'utilisation de chaque programme.

C'est un endroit où c'est une bonne idée de simplifier. Il y a effectivement 3
choses principales à combiner :

1.  Le programme de Shader (les infos/mise à jour des uniform et attributes)
2.  Le buffer et les attributes pour les choses que vous souhaitez dessiner
3.  Les uniforms nécessaires pour dessiner les choses liées au shader

Donc, une simple simplification serait de faire un tableau de choses à dessiner
et dans ce tableau mettre les 3 choses ensemble

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        uniforms: coneUniforms,
      },
    ];

Au moment de dessiner nous avons encore besoin de mettre à jour les matrices

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Compute the matrices for each object.
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

Mais maintenant le code permettant de faire le dessin est juste une boucle

    // ------ Draw the objects --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      gl.useProgram(programInfo.program);

      // Setup all the needed attributes.
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });


Et c'est sans doute la principale boucle de rendu dans la plupart de moteurs 3d
qui existent. Parfois, un ou plusieurs codes decident de ce qui rentre dans la liste
de `objectsToDraw`, mais c'est basiquement ça.

{{{example url="../webgl-multiple-objects-list.html" }}}

Il existe quelques optimisations de base. Si le programme que nous sommes
sur le point de dessiner est le même que le programme précédent alors il
n'y a pas besoin d'appeler `gl.useProgram`. De même, si nous dessinons les
mêmes shape/geometry/vertices que précédent, nous n'avons pas besoin de les 
initialiser une nouvelle fois.

Ainsi, une optimisation très simple pourrait ressembler à ceci

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions then when
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

C'est le moment de dessiner plus d'objet. Au lieu d'en dessiner 3 comme nous l'avons
fait jusque-là, nous allons faire une liste qui en contient plus.

    // put the shapes in an array so it's easy to pick them at random
    var shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ];

    // make 2 lists of objects, one of stuff to draw, one to manipulate.
    var objectsToDraw = [];
    var objects = [];

    // Uniforms for each object.
    var numObjects = 200;
    for (var ii = 0; ii < numObjects; ++ii) {
      // pick a shape
      var bufferInfo = shapes[rand(0, shapes.length) | 0];

      // make an object.
      var object = {
        uniforms: {
          u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
          u_matrix: m4.identity(),
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      };
      objects.push(object);

      // Add it to the list of things to draw.
      objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: object.uniforms,
      });
    }

Au moment du rendu

    // Compute the matrices for each object.
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

Le rendu des objets utilisant la boucle ci-dessus

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

Vous pouvez aussi trier la liste par `programInfo` et/ou `bufferInfo`
de sorte que l'optimisation démarre plus souvent. La plupart des moteurs
de jeux le font. Malheureusement ce n'est pas si simple. Si tout ce que
vous dessinez est opaque, alors vous pouvez garder le tri tel qu'il est.
Mais à un moment, vous aurez besoin de dessiner des objets semi-transparents,
et il faudra les dessiner dans un ordre specifique. La plupart des moteurs
3d resolvent ça en ayant 2 listes ou plus d'objet à dessiner : Une liste pour
les objets opaques et une autre contenant des objets transparents. La liste des
objets opaques est triée par programme et par géométrie. La liste des objets
transparents est triée par profondeur. Il pourrait également y avoir des listes
distinctes pour d'autres choses comme superpositions ou effets de post-traitement.

<a href="../webgl-multiple-objects-list-optimized-sorted.html"
target="_blank">Un exemple de tri</a>.  Sur ma machine, j'ai 31 fps quand
ce n'est pas trié, et 37 fps après le tri. C'est une hausse de performance
d'environ 20%. Mais dans le pire cas ou le meilleur cas, la plupart des programmes
en feraient beaucoup plus, donc ce n'est sans doute pas la peine d'y penser pour tous
sauf les cas les plus particuliers.

Il est important de noter que vous ne pouvez pas dessiner n'importe quelle
géométrie avec n'importe quel programme de shader. Par exemple un programme
de shader qui requit des normales, ne fonctionnera pas avec une géométrie
sans shader. Pareillement, un programme de shader qui requit des textures,
ne fonctionnera pas avec une géométrie sans texture.

C'est l'une des raisons pour laquelle il est plus simple de choisir une
librairie 3D comme [Three.js](https://threejs.org), car il gère ces
subtilités pour vous. Quand vous créez une géométrie, vous informez three.js
de comment votre forme doit être rendue, et il génère le programme de shader
au runtime. À peu près tous les moteurs 3D le font, de Unity3D à Unreal, ou
encore Source, ou Crytek. Certains les ont déjà pré-génèré, mais le plus
important à savoir, c'est que les programmes de shader sont *générés*.

Bien entendu, la raison que vous avez de lire ces articles est de vouloir
savoir ce qui se passe à un plus bas niveau. C'est bien et passionnant de
tout écrire soit-même. Mais il faut être conscient que [WebGL est très bas
niveau](webgl-2d-vs-3d-library.html). Il faudra donc tout faire soit-même,
ce qui inclut d'écrire le générateur de shader si les ressources nécessitent
différentes fonctionnalités.

Vous avez peut-être noté que nous n'avons pas mis `computeMatrix` dans la
boucle. C'est parce que le processus de rendu doit être séparé de celui des
matrices. Il est commun de calculer les matrices à partir d'un [graphe de scène
que nous étudierons dans un prochain article](webgl-scene-graph.html).

Maintenant que nous avons un framework pour dessiner plusieurs objets, [essayons de
dessiner du texte](webgl-text-html.html).


