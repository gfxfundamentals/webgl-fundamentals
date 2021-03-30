Title: Shaders et GLSL
Description: Présentation des shaders et de GLSL
TOC: WebGL - Shaders et GLSL


Cet article est la suite de [WebGL Les bases](webgl-fundamentals.html).
Si vous ne connaissez pas le fonctionnement de WebGL vous voulez peut-être [lire ça d'abord](webgl-how-it-works.html).

On a parlé des shaders et de GLSL mais sans vraiment donner de détails précis.
Je pense que les exemples parlent d'eux-mêmes, mais essayons de clarifier un peu plus.

Comme mentionné dans [Comment ça marche](webgl-how-it-works.html) WebGL exige 2 shaders pour chaque rendu. 
Un *shader de vertex* et un *shader de fragment*. Chaque shader est une *fonction*. 
Shader de vertex et shader de fragment sont liés ensemble par un programme de shader (ou juste programme). 
Une application WebGL classique a plusieurs programmes de shader.

##Le shader de vertex

Le rôle d'un shader de vertex est de générer des coordonnées dans l'espace de projection (clipspace). 
Il prend toujours la forme

    void main() {
       gl_Position = quelquesOperationsPourTransformerLesCoordonnées
    }

Ce shader est appelé une fois par vertex. Chaque fois qu'il est exécuté la variable globale `gl_Position` 
doit être renseignée avec des coordonnées.

Les shaders de vertex ont besoin de données. Ils peuvent la recevoir à partir de trois espèces d'entrées : 


1.  Les [attributs](#les-attributs) (données fournies par les tampons)
2.  Les [uniforms](#les-uniforms-dans-les-shaders-de-vertex) (valeurs qui restent identiques pour tous les vertices d'un appel de rendu)
3.  Les [textures](#les-textures-dans-les-shaders-de-vertex) (données de pixels/texels)

### Les attributs

La principale façon est celle des *attributs* associés aux tampons. Les tampons et attributs ont été évoqués dans 
[WebGL - Comment ça marche](webgl-how-it-works.html). On créé les tampons,

    var tampon = gl.createBuffer();

on y met des données

    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, mesDonnees, gl.STATIC_DRAW);

Ensuite, étant donné un programme de shader créé plus tôt, on créé l'emplacement de ces attributs

    var emplacementPosition = gl.getAttribLocation(programme, "a_position");

et on dit à WebGL comment envoyer ces données des tampons vers ces attributs

    // activer l'extraction de données depuis un tampon pour cet attribut 
    gl.enableVertexAttribArray(emplacementPosition);

    var composantes = 3;  // (x, y, z)
    var type = gl.FLOAT;
    var normalisation = false;  // laisse les valeurs inchangées
    var decalage = 0;           // démarre au début du tampon
    var tailleDeLaFenetre = 0;  // taille du déplacement de la lecture entre chaque vertex
                                // 0 = utilise la taille déduite du type et des composantes

    gl.vertexAttribPointer(emplacementPosition, composantes, type, normalisation, tailleDeLaFenetre, decalage);

Dans [WebGL -Les Bases](webgl-fundamentals.html) on a vu qu'on pouvait se passer d'opération dans 
le shader de vertex et juste lui envoyer des données.

    attribute vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

Si on met des vertices en espace de projection dans nos tampons alors c'est suffisant.

Les attributs peuvent être de type `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3`, and `mat4`.

### Les uniforms dans les shaders de vertex

Pour un vertex shader les uniforms sont des valeurs qui restent identiques pour tous les vertices d'un appel de rendu. 
Un exemple très simple est d'ajouter un décalage dans le shader de vertex précédent :

    attribute vec4 a_position;
    +uniform vec4 u_decalage;

    void main() {
       gl_Position = a_position + u_decalage;
    }

Et maintenant on pourrait décaler chaque vertex d'une certaine distance. D'abord 
on définit un emplacement pour la uniform :

    var emplacementDecalage = gl.getUniformLocation(programme, "u_decalage");

Ensuite, on renseigne la valeur avant l'appel de rendu.

    gl.uniform4fv(emplacementDecalage, [1, 0, 0, 0]);  // décale vers la droite de la moitié de l'écran

Les uniforms peuvent avoir de nombreux types. Pour chaque type il faut appeler une fonction spéciale pour la renseigner. 

    gl.uniform1f (emplacementFloat, v);                 // pour les float
    gl.uniform1fv(emplacementFloat, [v]);               // pour les float ou tableaux de float
    gl.uniform2f (emplacementVec2,  v0, v1);            // pour les vec2
    gl.uniform2fv(emplacementVec2,  [v0, v1]);          // pour les vec2 ou tableaux de vec2
    gl.uniform3f (emplacementVec3,  v0, v1, v2);        // pour les vec3
    gl.uniform3fv(emplacementVec3,  [v0, v1, v2]);      // pour les vec3 ou tableaux de vec3
    gl.uniform4f (emplacementVec4,  v0, v1, v2, v4);    // pour les vec4
    gl.uniform4fv(emplacementVec4,  [v0, v1, v2, v4]);  // pour les vec4 ou tableaux de vec4

    gl.uniformMatrix2fv(EmplacementMat2, false, [ tableau à  4 éléments ])  // pour les mat2 ou tableaux de mat2
    gl.uniformMatrix3fv(EmplacementMat3, false, [ tableau à  9 éléments ])  // pour les mat3 ou tableaux de mat3
    gl.uniformMatrix4fv(EmplacementMat4, false, [ tableau à 16 éléments ])  // pour les mat4 ou tableaux de mat4

    gl.uniform1i (emplacementInt,   v);                 // pour les int
    gl.uniform1iv(emplacementInt, [v]);                 // pour les int ou tableaux de int
    gl.uniform2i (emplacementIvec2, v0, v1);            // pour les ivec2
    gl.uniform2iv(emplacementIvec2, [v0, v1]);          // pour les ivec2 ou tableaux de ivec2
    gl.uniform3i (emplacementIvec3, v0, v1, v2);        // pour les ivec3
    gl.uniform3iv(emplacementIvec3, [v0, v1, v2]);      // pour les ivec3 ou tableaux de ivec3
    gl.uniform4i (emplacementIvec4, v0, v1, v2, v4);    // pour les ivec4
    gl.uniform4iv(emplacementIvec4, [v0, v1, v2, v4]);  // pour les ivec4 ou tableaux de ivec4

    gl.uniform1i (emplacementSampler2D,   v);           // pour les sampler2D (textures)
    gl.uniform1iv(emplacementSampler2D, [v]);           // pour les sampler2D ou tableaux de sampler2D

    gl.uniform1i (emplacementSamplerCube,   v);         // pour les samplerCube (textures)
    gl.uniform1iv(emplacementSamplerCube, [v]);         // pour les samplerCube ou tableaux de samplerCube

Il y a aussi les types `bool`, `bvec2`, `bvec3` et `bvec4`. Ils utilisent les fonctions `gl.uniform?f?` ou `gl.uniform?i?`.

Notons que pour un tableau vous pouvez indiquez toutes les uniforms d'un coup. Par exemple :

    // dans le shader
    uniform vec2 u_monVec2[3];

    // en JavaScript à l'initialisation
    var emplacementDeMonVec2 = gl.getUniformLocation(programme, "u_monVec2");

    // avant le rendu
    gl.uniform2fv(emplacementDeMonVec2, [1, 2, 3, 4, 5, 6]);  // renseigne tout le tableau de u_monVec3

Mais si on veut renseigner des éléments individuels dans un tableau il faut chercher l'emplacement de chaque élément.

    // en JavaScript à l'initialisation
    var emplacementDeLElement0DeMonVec2 = gl.getUniformLocation(programme, "u_monVec2[0]");
    var emplacementDeLElement1DeMonVec2 = gl.getUniformLocation(programme, "u_monVec2[1]");
    var emplacementDeLElement2DeMonVec2 = gl.getUniformLocation(programme, "u_monVec2[2]");

    // avant le rendu
    gl.uniform2fv(emplacementDeLElement0DeMonVec2, [1, 2]);  // renseigne l'élément 0
    gl.uniform2fv(emplacementDeLElement1DeMonVec2, [3, 4]);  // renseigne l'élément 1
    gl.uniform2fv(emplacementDeLElement2DeMonVec2, [5, 6]);  // renseigne l'élément 2

De même si vous créez un struct

    struct monStruct {
      bool actif;
      vec2 monVec2;
    };
    uniform monStruct u_quelqueChose;

Il faut renseigner chaque champ individuellement

    var someThingActiveLoc = gl.getUniformLocation(programme, "u_quelqueChose.actif");
    var someThingSomeVec2Loc = gl.getUniformLocation(programme, "u_quelqueChose.monVec2");

### Les textures dans les shaders de vertex

Voire [Les textures dans les shaders de fragment](#les-textures-dans-les-shaders-de-fragment).

## Les shaders de fragment

Le rôle d'un shader de fragment est de colorier le pixel en cours. 
Il prend toujours la forme

    precision mediump float;

    void main() {
       gl_FragColor = quelquesOperationPourCalculerLaCouleur;
    }

Le shader de fragment est appelé une fois par pixel. Chaque fois qu'il est exécuté la variable globale `gl_FragColor` doit être renseignée avec une couleur.

Les shader de fragment ont besoin de données. Ils peuvent en recevoir par 3 moyens :

1.  [Les uniforms](#les-uniforms-dans-les-shaders-de-fragment) (Valeurs qui restent les mêmes pour chaque pixel pendant un rendu)
2.  [Les textures](#les-textures-dans-les-shaders-de-fragment) (données de pixels/texels)
3.  [Les varyings](#les-varyings) (données transférées du shader de vertex puis interpolées)

### Les uniforms dans les shaders de fragment

Voire [Les uniforms dans les shaders de vertex](#les-uniforms-dans-les-shaders-de-vertex).

### Les textures dans les shaders de fragment

Pour obtenir une valeur depuis une texture dans un shader, on créé une uniform de type `sampler2D`et 
on utilise la fonction `texture2D`.

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
       vec2 coordonneesDeTexture = vec2(0.5, 0.5)  // valeur au milieu de la texture
       gl_FragColor = texture2D(u_texture, coordonneesDeTexture);
    }

Les données retournées par la fonction [dépendent de plusieurs paramètres](webgl-3d-textures.html).
Au minimum on a besoin de créer et envoyer des données dans la texture, par exemple :

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var niveau = 0;
    var largeur = 2;
    var hauteur = 1;
    var donnees = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, niveau, gl.RGBA, largeur, hauteur, 0, gl.RGBA, gl.UNSIGNED_BYTE, donnees);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Ensuite on regarde l'emplacement de la uniform dans le programme

    var emplacementDeMonSampler = gl.getUniformLocation(programme, "u_texture");

WebGL demande de la relier à une unité de texture

    var unite = 5;  // Choix de l'unité de texture
    gl.activeTexture(gl.TEXTURE0 + unite);
    gl.bindTexture(gl.TEXTURE_2D, tex);

Et de dire au shader à quelle unité on a lié notre texture

    gl.uniform1i(emplacementDeMonSampler, unite);

### Les varyings

Une varying est un moyen de passer une valeur d'un shader de vertex à un shader de fragment 
comment nous l'avons vu [WebGL - Comment ça marche](webgl-how-it-works.html).

Pour utiliser une varying on doit effectuer la même déclaration dans les deux shaders. 
On la renseigne dans le shader de vertex. Quand WebGL colore les pixels les valeurs interpolées 
sont envoyées au shader de fragment.

Shader de vertex

    attribute vec4 a_position;

    uniform vec4 u_decalage;

    +varying vec4 v_positionDecalee;

    void main() {
      gl_Position = a_position + u_decalage;
    +  v_positionDecalee = a_position + u_decalage;
    }

Shader de fragment

    precision mediump float;

    +varying vec4 v_positionDecalee;

    void main() {
    +  // convertit de l'espace de projectione (-1 <-> +1) à l'espace de couleur (0 -> 1).
    +  vec4 color = v_positionDecalee * 0.5 + 0.5
    +  gl_FragColor = color;
    }

L'exemple ci-dessus n'a pas vraiment d'intérêt. Copier les valeurs en espace de projection d'un shader à l'autre 
pour les utiliser comme couleurs n'a pas de sens. Mais ça fonctionne et les couleurs sont renseignées.

## GLSL

GLSL signifie Graphics Library Shader Language. C'est le langage dans lequel les shaders 
sont écrits. Il a des façons de faire qui n'ont rien à voir avec le javascript. Il est 
conçu pour les opérations propres aux calculs graphiques. Par exemple il a des types 
natifs comme `vec2`, `vec3`, et `vec4` qui représentent respectivement 2 valeurs, 3 valeurs et 4 valeurs. 
De même il a `mat2`, `mat3` et `mat4` qui représentent des matrices carrées 2x2, 3x3, et 4x4. 
On peut faire nativement des opérations comme multiplier un `vec` par un scalaire.

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // b vaut vec4(2, 4, 6, 8);

GLSL peut faire des multiplications de matrices avec d'autres matrices ou encore avec des vecteurs

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

Il a aussi plusieurs sélecteurs pour choisir facilement les valeurs d'un vec. Pour un vec4 :

    vec4 v;

*   `v.x` est identique à `v.s`, à `v.r` et à `v[0]`.
*   `v.y` est identique à `v.t`, à `v.g` et à `v[1]`.
*   `v.z` est identique à `v.p`, à `v.b` et à `v[2]`.
*   `v.w` est identique à `v.q`, à `v.a` et à `v[3]`.

Ce qui permet de *mixer* les composantes d'un vec, donc de les exclure ou de les répéter

    v.yyyy

est identique à

    vec4(v.y, v.y, v.y, v.y)

De même

    v.bgra

est identique à

    vec4(v.b, v.g, v.r, v.a)

en construisant un `vec` ou une `mat` on peut fournir plusieurs composantes d'un coup. Par exemple

    vec4(v.rgb, 1)

est identique à

    vec4(v.r, v.g, v.b, 1)

Une chose à laquelle vous vous ferez sûrement avoir quelque fois, c'est à quel point le GLSL est strict sur les types :

    float f = 1;  // Crash du programme et message console : ERROR 1 is an int. You can't assign an int to a float

La bonne façon de faire pour ça :

    float f = 1.0;      // indiquer une décimale bien sûr
    float f = float(1)  // ou transformer l'entier en décimale

L'exemple précédent de `vec4(v.rgb, 1)` reste valide car `vec4` convertit naturellement ses composantes en décimales, 
comme `float(1)`.

GLSL a aussi un tas de fonctions natives. Nombre d'entre elles agissent sur plusieurs composantes 
d'un coup. Par exemple :

    T sin(T angle)

T signifie que la valeur peut être un `float`, un `vec2`, un `vec3` ou un `vec4`. Si on lui donne un `vec4` on reçoit un `vec4` en retour, 
avec le sinus de chacun de ses composants. En d'autres termes si `v` est un `vec4` alors

    vec4 s = sin(v);

est identique à

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

Parfois un argument est un float est le reste `T`. Ca signifie que le float sera appliqué à tous les composants. 
Par exemple si `v1` et `v2` sont des `vec4` et `f` est un float

    vec4 m = mix(v1, v2, f);

est identique à

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

Il y a une liste de toutes les fonctions GLSL sur la dernière page  de [la référence WebGL](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf). Si vous aimez les bon gros contenus bruts vous pouvez tenter [la spéc GLSL](https://www.khronos.org/files/opengles_shading_language.pdf).

## Conclusion

C'est le bout de cette série d'articles. WebGL c'est surtout écrire des shaders, 
fournir les données à ces shaders et enfin exécuter `gl.drawArrays` ou `gl.drawElements` 
pour que WebGL en déduise les vertices en appelant le shader de vertex pour chacun d'entre eux, et 
colorie les pixels avec le fragment shader.

En fait les shaders demandent plusieurs lignes de code. Ces lignes sont les mêmes dans la plupart des programmes 
et une fois écrites on peut les oublier [comme les méthodes décrites ici, pour compiler des shaders et les lier à un programme](webgl-boilerplate.html).

Arrivé ici vous avez deux choix : si vous êtes intéressé par le traitement 
d'image je vais vous montrer [comment faire du traitement d'images 2D](webgl-image-processing.html).
Si vous voulez apprendre les translations, rotations et changements d'échelle alors 
[c'est par ici](webgl-2d-translation.html).