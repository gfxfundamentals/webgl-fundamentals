Title: Les bases
Description: Première leçon pour WebGL en démarrant par les bases
TOC: WebGL - Les bases


WebGL rend possible l'affichage d'incroyables rendus graphiques 3D en temps réel dans le navigateur,
mais ce que beaucoup de gens ignorent c'est que
[WebGL est en fait une API de pixélisation, pas une API 3D](webgl-2d-vs-3d-library.html).

Laissez-moi m'expliquer.

WebGL ne s'intéresse qu'à deux choses : les coordonnées dans l'espace de projection (clipspace en anglais) et les couleurs.
Votre travail de développeur WebGL est de fournir ces deux jeux de données.
Pour cela vous définissez deux "shaders". Un shader de vertex, qui va fournir les coordonnées de l'espace
de projection, et un shader de pixel (on dit aussi shader de fragment), qui va fournir les couleurs.

Dans l'espace de projection, les coordonnées vont toujours de -1 à +1 quelle que soit la taille du canvas.
Voici un simple exemple pour illustrer un code WebGL dans sa forme la plus simple.

    // Création du contexte WebGL
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    // Création d'un programme
    var programme = creerProgrammeDepuisScripts(gl, ["shader-de-vertex-2d", "shader-de-fragment-2d"]);
    gl.useProgram(programme);

    // Création d'un pointeur pour les données de vertex
    var emplacementPosition = gl.getAttribLocation(programme, "a_position");

    // Crée un tampon et ajoute un rectangle avec des données en espace de projection déjà préparées
    // (un rectangle = 2 triangles)
    var tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0]),
        gl.STATIC_DRAW);
    gl.enableVertexAttribArray(emplacementPosition);
    gl.vertexAttribPointer(emplacementPosition, 2, gl.FLOAT, false, 0, 0);

    // appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 6);

Voici les deux shaders

    <script id="shader-de-vertex-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    </script>

    <script id="2dshader-de-fragment-2d" type="x-shader/x-fragment">
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);  // green
    }
    </script>

Ce code va rendre un rectangle vert de la taille du canvas. Le voici

{{{example url="../webgl-fundamentals.html" }}}

Pas très excitant :-p

À nouveau, l'espace de rendu va toujours de -1 à +1 quelle que soit la taille du canvas.
Dans le cas précédent on ne fait rien d'autre qu'envoyer nos données de position directement.
Puisque les coordonnées correspondent déjà à l'espace de projection il n'y a rien d'autre à faire.
*Si on veut de la 3D c'est à nous d'écrire des shaders qui convertissent la 3D en espace de projection,
parce que WebGL n'est qu'une interface de pixelisation*.

Pour de la 2D on travaillera plutôt en pixels qu'en espace de projection, donc changeons le shader pour
pouvoir fournir des rectangles en pixels et les faire convertir en espace de projection à notre place.
Voici le nouveau shader de vertex

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
       // réduit les coordonnées pixels de 0.0 à 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convertit de 0->1 à 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convertit de 0->2 à -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace, 0, 1);
    }
    </script>

Maintenant on peut changer nos données en pixels

    // indique la résolution au programme
    var emplacementResolution = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(emplacementResolution, canvas.width, canvas.height);

    // crée un rectangle qui va de 10,20 à 80,30 en pixels
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30]), gl.STATIC_DRAW);

Et le voilà

{{{example url="../webgl-2d-rectangle.html" }}}

À noter que le rectangle est proche du bas du canvas. WebGL considère que le coin
en bas à gauche est l'origine des coordonnées (0, 0). Si on veut se mettre dans le système
de coordonnées traditionnel des APIs graphiques 2D, avec l'origine en haut à gauche, il
suffit d'inverser la coordonnée y.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

Et maintenant notre rectangle est là où on l'attend.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Transformons maintenant le code qui fabrique le rectangle en fonction, afin de pouvoir
l'appeler pour des rectangles de tailles différentes. Tant qu'on y est incluons les couleurs
pour pouvoir les définir aussi en appelant la fonction.

D'abord dans le shader de fragment on ajoute une entrée de type uniform pour la couleur.

    <script id="shader-de-fragment-2d" type="x-shader/x-fragment">
    precision mediump float;

    +uniform vec4 u_color;

    void main() {
    *   gl_FragColor = u_color;
    }
    </script>

Et voici le nouveau code qui rend 50 rectangles disposés au hasard et avec des couleurs aléatoires.

      var emplacementCouleur = gl.getUniformLocation(programme, "u_color");
      ...
      // Crée un tampon
      var tampon = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Rend 50 rectangles au hasard avec couleurs aléatoires.
      for (var ii = 0; ii < 50; ++ii) {
        // Crée un rectangle au hasard
        creerRectangle(
            gl, entierAleatoir(300), entierAleatoir(300), entierAleatoir(300), entierAleatoir(300));

        // Définition d'une couleur aléatoire
        gl.uniform4f(emplacementCouleur, Math.random(), Math.random(), Math.random(), 1);

        // Rendu du rectangle
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Retourne un entier aléatoire entre 0 et -1
    function entierAleatoir(max) {
      return Math.floor(Math.random() * max);
    }

    // Remplit le tampon avec les valeurs qui définissent le rectangle
    function creerRectangle(gl, x, y, largeur, hauteur) {
      var x1 = x;
      var x2 = x + largeur;
      var y1 = y;
      var y2 = y + hauteur;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

Et voilà les rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

J'espère que vous voyez que WebGL est en fait une API plutôt facile.
Bien que ça puisse devenir plus compliqué avec la 3D cette complication
est apportée par le développeur, qui va exiger des shaders plus complexes.
WebGL en lui-même est en 2D, et plutôt simple.

Si vous êtes 100% nouveau sur WebGL et n'avez pas d'idée de ce que sont GLSL,
les shaders ou le fonctionnement d'une carte graphique, lisez [Comment ça marche](webgl-how-it-works.html).

Autrement à ce stade vous avez deux choix. Si le traitement d'image vous intéresse
je peux vous montrer [comment faire du traitement d'image en 2D](webgl-image-processing.html).
Si vous êtes intéressés par les translations,
rotations, changement d'échelle, alors [c'est par ici](webgl-2d-translation.html).

<div class="webgl_bottombar">
<h3>Qu'est-ce que type="x-shader/x-vertex" et type="x-shader/x-fragment" signifient ?</h3>
<p>
Les balises <code>&lt;script&gt;</code> sont par défaut supposées écrites en javascript.
Vous pouvez n'ajouter aucun type ou bien ajouter <code>type="javascript"</code> ou
<code>type="text/javascript"</code> et le navigateur interpéte le contenu en javascript.
Si vous ajoutez n'importe quoi d'autre, le navigateur ignore le contenu de la balise.
En d'autres termes <code>x-shader/x-vertex</code>
et <code>x-shader/x-fragment</code> n'ont pas de sens pour le navigateur.</p>
<p>
On peut exploiter ce comportement pour externaliser les shaders dans des balises scripts.
C'est pratique parce qu'autrement on est obligé d'écrire de longues chaînes de caractères
comme</p>
<pre class="prettyprint">
  var codeDuShader =
    "void main() {\n" +
    "  gl_FragColor = vec4(1,0,0,1);\n" +
    "}";
</pre>
<p>ou encore de charger les shaders avec des requêtes AJAX asynchrones.</p>
<p>Les mettre dans des balises javascript les rend plus facilement accessibles et éditables.</p>
<p>
Dans ce cas une fonction <code>creerProgrammeDepuisScripts</code> peut chercher les balises avec les identifiants spécifiés
et en sortir le contenu. Elle compile le contenu de la balise qui a le premier identifiant comme shader
de vertex, et celle qui a le second comme shader de fragment.
</p>
<p>
<code>creerProgrammeDepuisScripts</code> fait partie du <a href="webgl-boilerplate.html">code de base</a>
nécessaire à presque tout programme WebGL.
</p>
</div>
