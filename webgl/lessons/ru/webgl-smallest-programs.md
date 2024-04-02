Title: Небольшие программы WebGL
Description: Небольшие программы WebGL
TOC: Небольшие программы WebGL

В этой статье предполагается, что вы прочитали множество других статей, начиная с основ. Если вы их не читали, сначала начните с них.

Я действительно не знаю, где разместить эту статью, потому что она преследует две цели.

1. Показать вам небольшие программы WebGL.

   Эти методы очень полезны для тестирования чего-либо или при создании [MCVE for Stack Overflow](https://meta.stackoverflow.com/a/349790/128511) или при попытке выявить ошибку.

2. Учимся мыслить нестандартно.

   Я надеюсь написать еще несколько статей на эту тему, которые помогут вам увидеть более широкую картину, а не просто общие закономерности. 
   [Вот один](webgl-drawing-without-data.html).

## Просто очищение

Вот самая маленькая программа WebGL, которая действительно что-то делает

```js
const gl = document.querySelector('canvas').getContext('webgl');
gl.clearColor(1, 0, 0, 1);  // red
gl.clear(gl.COLOR_BUFFER_BIT);
```

Все, что делает эта программа, это очищает холст до красного цвета, но на самом деле она что-то делает.

Подумайте об этом. Только с помощью этого вы действительно можете протестировать некоторые вещи.  Допустим, вы выполняете
[рендеринг текстуры](webgl-render-to-texture.html), но что-то не работает.
Допустим, это так же, как пример [в этой статье](webgl-render-to-texture.html).
Вы визуализируете один или несколько трехмерных объектов в текстуру, а затем визуализируете результат в куб.

Вы ничего не видите. Ну, в качестве простого теста: прекратите рендеринг текстуры с помощью шейдеров, просто очистите текстуру до известного цвета.

```js
gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferWithTexture)
gl.clearColor(1, 0, 1, 1);  // magenta
gl.clear(gl.COLOR_BUFFER_BIT);
```

Теперь выполните рендеринг с использованием текстуры из фреймбуфера. 
Ваш куб стал пурпурным? Если нет, то ваша проблема не в рендеринге текстурной части, а в чем-то другом.

## Использование `SCISSOR_TEST` и `gl.clear`

`SCISSOR_TEST` отсекает как рисование, так и очистку дочернего прямоугольника холста (или текущего фреймбуфера).

Вы включаете "ножничный тест" с помощью

```js
gl.enable(gl.SCISSOR_TEST);
```

а затем вы устанавливаете прямоугольник "scissor" в пикселях относительно нижнего левого угла. Он использует те же параметры, что и `gl.viewport`.

```js
gl.scissor(x, y, width, height);
```

Используя это, можно рисовать прямоугольники с помощью `SCISSOR_TEST` и `gl.clear`.

Пример

```js
const gl = document.querySelector('#c').getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
  gl.scissor(x, y, width, height);
  gl.clearColor(...color);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
  const x = rand(0, 300);
  const y = rand(0, 150);
  const width = rand(0, 300 - x);
  const height = rand(0, 150 - y);
  drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
}


function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}
```

{{{example url="../webgl-simple-scissor.html"}}}

Не скажу, что этот конкретный вариант очень полезен, но все же его полезно знать.

## Использование одного большого `gl.POINTS`

Как показывает большинство примеров, наиболее распространенной задачей в WebGL является создание буферов. 
Поместите данные вершин в эти буферы. Создавайте шейдеры с атрибутами. Настройте атрибуты для извлечения данных из этих буферов. 
Затем нарисуйте, возможно, с униформой и текстурой, также используемыми вашими шейдерами.

Но иногда хочется просто проверить. Допустим, вы хотите просто увидеть что-нибудь нарисованное.

Как насчет этого набора шейдеров?

```glsl
// vertex shader
void main() {
  gl_Position = vec4(0, 0, 0, 1);  // center
  gl_PointSize = 120.0;
}
```

```glsl
// fragment shader
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);  // red
}
```

И вот код для его использования

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
```

Не нужно создавать буферы, не нужно настраивать униформы, и мы получаем одну точку в середине холста.

{{{example url="../webgl-simple-point.html"}}}

> ПРИМЕЧАНИЕ. Safari до 15 версии не прошел [тесты на соответствие WebGL](https://www.khronos.org/registry/webgl/sdk/tests/conformance/rendering/point-no-attributes.html?webglVersion=1&quiet=0) для этой функции.

О `gl.POINTS`: Когда вы передаете `gl.POINTS` в `gl.drawArrays` вам также необходимо установить размер в пикселях
`gl_PointSize` в вашем вершинном шейдере. Важно отметить, что разные графические 
процессоры/драйверы имеют разный максимальный размер точек, который вы можете использовать. 
Вы можете запросить этот максимальный размер с помощью

  gl.POINTS в gl.drawArrays,  gl_PointSize   
```
const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
```

Спецификация WebGL требует только максимальный размер 1.0. К счастью, 
[большинство, если не все графические процессоры и драйверы поддерживают больший размер](https://web3dsurvey.com/webgl/parameters/ALIASED_POINT_SIZE_RANGE).

После того, как вы установили `gl_PointSize` затем, когда вершинный шейдер завершит работу, какое бы значение вы ни установили `gl_Position` 
преобразуется в пространство экрана/холста в пикселях, затем вокруг этой позиции генерируется квадрат, равный +/- gl_PointSize / 2 во всех 4 направлениях.

Хорошо, я слышу, ну и что, кто хочет нарисовать одну точку.

Ну а точки автоматически получают свободные [текстурные координаты](webgl-3d-textures.html). 
Они доступны во фрагментном шейдере с помощью специальной переменной `gl_PointCoord`. 
Итак, давайте нарисуем текстуру в этой точке.

Сначала давайте изменим фрагментный шейдер.

```glsl
// fragment shader
precision mediump float;

+uniform sampler2D tex;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);  // red
+  gl_FragColor = texture2D(tex, gl_PointCoord.xy);
}
```

Теперь, чтобы упростить задачу, давайте создадим текстуру с необработанными данными, как описано
[в статье о текстурах данных](webgl-data-textures.html).

```js
// 2x2 pixel data
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // red
  0x00, 0xFF, 0x00, 0xFF,  // green
  0x00, 0x00, 0xFF, 0xFF,  // blue
  0xFF, 0x00, 0xFF, 0xFF,  // magenta
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // level
    gl.RGBA,           // internal format
    2,                 // width
    2,                 // height
    0,                 // border
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    pixels,            // data
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Поскольку WebGL по умолчанию использует текстурный блок 0, а униформы по умолчанию равны 0, больше нечего настраивать.

{{{example url="../webgl-simple-point-w-texture.html"}}}

Это может быть отличным способом проверить проблемы, связанные с текстурами. 
Мы по-прежнему не используем ни буферов, ни атрибутов, и нам не нужно искать и устанавливать какие-либо униформы. 
Например, если мы загрузили изображение, оно не отображается. Что, если мы попробуем шейдер выше, покажет ли он изображение в точке? 
Мы выполнили рендеринг текстуры, а затем хотим просмотреть текстуру. 
Обычно мы настраиваем некоторую геометрию с помощью буферов и атрибутов, 
но мы можем визуализировать текстуру, просто показывая ее в этой единственной точке.

## Использование нескольких одиночных `POINTS`

Еще одно простое изменение в приведенном выше примере. Мы можем изменить вершинный шейдер на этот

```glsl
// vertex shader

+attribute vec4 position;

void main() {
-  gl_Position = vec4(0, 0, 0, 1);
+  gl_Position = position;
  gl_PointSize = 120.0;
}
```

атрибуты имеют значение по умолчанию `0, 0, 0, 1,` поэтому даже с этим изменением, приведенные выше примеры все равно продолжат работать.
Но теперь мы получаем возможность устанавливать позицию, если захотим.

```js
+const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');

...

+const numPoints = 5;
+for (let i = 0; i < numPoints; ++i) {
+  const u = i / (numPoints - 1);    // 0 to 1
+  const clipspace = u * 1.6 - 0.8;  // -0.8 to +0.8
+  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

*  const offset = 0;
*  const count = 1;
*  gl.drawArrays(gl.POINTS, offset, count);
+}
```

Прежде чем мы запустим, давайте уменьшим точку.

```glsl
// vertex shader

attribute vec4 position;
+uniform float size;

void main() {
  gl_Position = position;
-  gl_PointSize = 120.0;
+  gl_PointSize = 20.0;
}
```

И давайте сделаем так, чтобы мы могли установить цвет точки. (примечание: я вернулся к коду без текстуры).

```glsl
precision mediump float;

+uniform vec4 color;

void main() {
-  gl_FragColor = vec4(1, 0, 0, 1);   // red
+  gl_FragColor = color;
}
```

и нам нужно найти местоположение цвета

```js
// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
+const colorLoc = gl.getUniformLocation(program, 'color');
```

И используем их

```js
gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
  const u = i / (numPoints - 1);    // 0 to 1
  const clipspace = u * 1.6 - 0.8;  // -0.8 to +0.8
  gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

+  gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

  const offset = 0;
  const count = 1;
  gl.drawArrays(gl.POINTS, offset, count);
}
```

И теперь мы получаем 5 точек с 5 цветами, и нам по-прежнему не нужно настраивать какие-либо буферы или атрибуты.

{{{example url="../webgl-simple-points.html"}}}

Конечно, это **НЕ** тот способ, которым вы должны рисовать много точек в WebGL. 
Если вы хотите нарисовать много точек, вам следует сделать что-то вроде установки 
атрибута с позицией для каждой точки и цветом для каждой точки и нарисовать все точки за один вызов отрисовки.

НО!, для тестирования, для отладки, для создания [MCVE](https://meta.stackoverflow.com/a/349790/128511) 
это отличный способ **минимизировать** код. В качестве другого примера предположим, 
что мы рисуем текстуры для постобработки и хотим их визуализировать. 
Мы могли бы просто нарисовать по одной большой точке для каждой, 
используя комбинацию этого примера и предыдущего с текстурой. 
Не требуется никаких сложных действий с буферами и атрибутами, 
что отлично подходит для отладки.
