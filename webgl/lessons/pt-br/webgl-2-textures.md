Title: WebGL - Utilizando 2 ou mais texturas
Description: Como utilizar 2 ou mais texturas no WebGL
TOC: WebGL - Usando duas ou mais texturas


Este artigo é uma continuação de [WebGL -
Processamento de imagens](webgl-image-processing.html). Se você ainda não leu, eu
sugiro [que você começe lá](webgl-image-processing.html).

Agora, pode ser um bom momento para responder a pergunta: "Como uso 2 ou mais
texturas?""

É bem simples. Vamos [voltar algumas aulas para o nosso primeiro sombreador que
desenha uma única imagem](webgl-image-processing.html) e atualize-a para 2
imagens.

A primeira coisa que precisamos fazer é mudar nosso código para que possamos carregar 2 imagens.
Esta não é realmente uma coisa de WebGL, é uma coisa de JavaScript HTML5, mas nós
também podemos abordar isso. As imagens são carregadas de forma assíncrona, o que pode levar
um pouco de tempo para você ir se acostumando.

Existem basicamente 2 maneiras de lidar com isso. Poderíamos tentar estruturar
nosso código para que ele seja executado sem texturas e como as texturas são carregadas
as atualizações do programa. Salvaremos esse método para um artigo posterior.

Neste caso, aguardamos que todas as imagens sejam carregadas antes de desenhar
qualquer coisa.

Primeiro vamos alterar o código que carrega uma imagem em uma função. Está
bem direto. Ele cria um novo objeto `Image`, e define o URL para
carregar e definir um retorno de chamada para ser chamado quando a imagem terminar de carregar.

```
function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

Agora vamos fazer uma função que carrega uma série de URLs e gera uma
matriz de imagens. Primeiro, criamos `imagesToLoad` para o número de imagens
vamos carregar. Então, fazemos o retorno de chamada que passamos para `loadImage`
decrement `imagesToLoad`. Quando `imagesToLoad` passa a 0 todas as imagens
foram carregados e passamos a matriz de imagens para um retorno de chamada.

```
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // Called each time an image finished loading.
  var onImageLoad = function() {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad == 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```

Agora chamamos loadImages assim

```
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

Em seguida, mudamos o sombreador para usar 2 texturas. Neste caso, vamos multiplicar
1 textura pelo outro.

```
<script id="fragment-shader-2d" type="x-shader/x-fragment">
precision mediump float;

// our textures
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}
</script>
```

Precisamos criar 2 objetos de textura WebGL.

```
  // create 2 textures
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // add the texture to the array of textures.
    textures.push(texture);
  }
```

O WebGL tem algo chamado "unidades de textura". Você pode pensar nisso como uma série de referências
para texturas. Você diz ao sombreador qual unidade de textura para usar para cada amostra.

```
  // lookup the sampler locations.
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // set which texture units to render with.
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

Então, temos que vincular uma textura a cada uma dessas unidades de textura.

```
  // Set each texture unit to use a particular texture.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

As 2 imagens que estamos carregando parecem com isso

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

E aqui está o resultado se os multiplicarmos juntos usando o WebGL.

{{{example url="../webgl-2-textures.html" }}}

Algumas coisas que devo passar.

A maneira simples de pensar em unidades de textura é algo assim: todos
as funções de textura funcionam na "unidade de textura ativa". A "active texture unit"
é apenas uma variável global que é o índice da textura
com a qual você quer trabalhar. Cada unidade de textura tem 2 alvos. o
Alvo TEXTURE_2D e o alvo TEXTURE_CUBE_MAP. Toda função de textura
funciona com o alvo especificado na unidade de textura ativa atual. E se
você deveria implementar o WebGL em JavaScript, seria algo parecido com
esta

```
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    ...
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // convert the unit enum to an index.
    var index = unit - gl.TEXTURE0;
    // Set the active texture unit
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // Set the texture for the target of the active texture unit.
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ... args ...) {
    // Call texImage2D on the current texture on the active texture unit
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args...);
  };

  // return the WebGL API
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
  }
};
```

Os sombreadores tomam índices nas unidades de textura. Esperemos que isso torne essas 2 linhas mais claras.

```
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

Uma coisa a ser mostrada, é que ao configurar os uniformes você usa índices para as unidades de textura,
mas ao chamar o Gl.activeTexture você precisa passar nas constantes especiais gl.TEXTURE0, gl.TEXTURE1 etc.
Felizmente, as constantes são consecutivas, então, ao invés disso

```
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

Nós poderíamos fazer isso

```
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

Ou isso

```
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

Espero que este pequeno passo ajuda a explicar como usar múltiplas texturas em uma única chamada de desenho no WebGL
