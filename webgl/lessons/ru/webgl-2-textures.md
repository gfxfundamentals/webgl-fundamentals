Title: Использование 2 и более текстур в WebGL
Description: Как использовать 2 и более текстуры в WebGL
TOC: WebGL - Использование 2 и более текстур


Эта статья продолжает [статью об обработке изображений](webgl-image-processing.html).
Если вы её не читали, рекомендую [ознакомиться сначала с ней](webgl-image-processing.html).

Пришло время ответить на вопрос "А как мне использовать 2 или более
текстуры?".

Достаточно легко. Вернёмся назад на несколько уроков к [нашему первому
шейдеру, который отрисовывал одно изображение](webgl-image-processing.html)
и изменим его код, чтобы он работал с 2 изображениями.

Итак, изменим код соответствующим образом. Делается это не в WebGL, а в
HTML5 JavaScript, но и с этим мы справимся. И не будем забывать, что
изображения грузятся асинхронно.

По сути есть 2 способа реализации. Мы могли бы организовать код, чтобы он
изначально работал без текстур, а затем обновлял программу, когда текстуры
полностью загрузятся. Мы оставим этот метод для дальнейших статей.

Сейчас же мы будем дожидаться полной загрузки всех изображений,
прежде чем что-либо отрисовать.

Для начала вынесем код загрузки изображения в функцию. Здесь всё понятно.
Создаётся новый объект `Image`, задаётся URL для загрузки и по завершению
загрузки изображения выполняется функция обратного вызова.

```
function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```

Теперь сделаем функцию, которая принимает массив URL-адресов, а возвращает
массив изображений. Заведём переменную `imagesToLoad`, где будет содержаться
количество загружаемых изображений. При загрузке очередного изображения
значение `imagesToLoad` уменьшается. А когда значение доходит до 0, значит,
все изображения загрузились, и мы вызываем переданную функцию callback
с массивом изображений в качестве параметра.

```
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // вызывается каждый раз при загрузке изображения
  var onImageLoad = function() {
    --imagesToLoad;
    // если все объекты загрузились, вызываем callback
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

Использование функции loadImages выглядит следующим образом:

```
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

Далее меняем шейдер под использование 2 текстур. В данном случае мы
умножим одну текстуру на другую.

```
<script id="fragment-shader-2d" type="x-shader/x-fragment">
precision mediump float;

// наши текстуры
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// texCoords передаются из вершинного шейдера
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}
</script>
```

Создаём 2 объекта текстуры WebGL.

```
  // создаём 2 текстуры
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // задаём параметры для отображения изображения любого размера
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // загружаем изображение в текстуру
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // добавляем текстуру в массив текстур
    textures.push(texture);
  }
```

В WebGL есть нечто под названием "текстурные блоки". Вы можете представить, что это
массив ссылок на текстуры. Необходимо сообщить шейдеру, какой текстурный блок
использовать для каждого сэмплера.

```
  // получаем ссылки на сэмплеры
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // задаём, какой текстурный блок использовать при рендеринге
  gl.uniform1i(u_image0Location, 0);  // текстурный блок 0
  gl.uniform1i(u_image1Location, 1);  // текстурный блок 1
```

Затем привязываем текстуру к каждому из этих текстурных блоков.

```
  // привязываем текстуру к текстурному блоку
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

Вот 2 изображения, которые я выбрал для загрузки:

<style>.glocal-center { text-align: center; } .glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr><td><img src="../resources/leaves.jpg" /> <img src="../resources/star.jpg" /></td></tr></table></div>

А вот результат их умножения, используя WebGL:

{{{example url="../webgl-2-textures.html" }}}

Стоит пояснить некоторые вещи.

Попробую объяснить другими словами, что такое текстурный блок. Все функции
по работе с текстурами выполняются над "активным текстурным блоком".
"Активный текстурный блок" - это просто глобальная переменная, в которой
содержится индекс текстурного блока, с которым вы хотите работать. Каждый
текстурный блок содержит 2 объекта - TEXTURE_2D и TEXTURE_CUBE_MAP. Каждая
функция по работе с текстурами работает с указанным объектом в текущем
активном текстурном блоке. Если бы вы реализовывали WebGL на JavaScript,
мог бы получиться примерно следующий код:

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
    // преобразовываем значение перечисления в число
    var index = unit - gl.TEXTURE0;
    // устанавливаем активный текстурный блок
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // устанавливаем текстуру для объекта активного текстурного блока
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ... args ...) {
    // вызов texImage2D на текущей текстуре активного текстурного блока
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args...);
  };

  // возвращаем WebGL API
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
  }
};
```

Шейдеры принимают индексы для текстурного блока. Надеюсь, следующие 2 строки будут понятнее.

```
  gl.uniform1i(u_image0Location, 0);  // текстурный блок 0
  gl.uniform1i(u_image1Location, 1);  // текстурный блок 1
```

Однако, необходимо помнить, что при установке uniform-переменных вы используете индексы
для текстурных блоков, но при вызове gl.activeTexture необходимо передавать специальные
константы gl.TEXTURE0, gl.TEXTURE1 и т.д. К счастью, константы идут последовательно,
поэтому вместо следующего кода

```
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

мы можем записать следующим образом:

```
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

или же так:

```
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

Надеюсь, этот небольшой пример помог понять, как использовать несколько
текстур за один вызов отрисовки в WebGL.
