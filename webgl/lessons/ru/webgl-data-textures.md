Title: WebGL 3D - Данные для текстур
Description: Передача данных текстурам
TOC: WebGL - Данные для текстур


Эта статья продолжает серию, которая начинается с
[Основ WebGL](webgl-fundamentals.html). Предыдущая статья была
о [текстурах](webgl-3d-textures.html).

В последней статье мы многое узнали о работе и применении текстур. Там
мы создавали текстуры из загруженных изображений. В этой статье вместо
изображений мы будем использовать данные, объявленные прямо в JavaScript.

Задать данные для текстуры в JavaScript совсем не сложно. По умолчанию
WebGL1 поддерживает лишь несколько типов текстур:

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>Формат</td><td>Тип</td><td>Каналов</td><td>Бит на пиксель</td></tr>
    </thead>
    <tbody>
      <tr><td>RGBA</td><td>UNSIGNED_BYTE</td><td>4</td><td>4</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_BYTE</td><td>3</td><td>3</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_4_4_4_4</td><td>4</td><td>2</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_5_5_5_1</td><td>4</td><td>2</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_SHORT_5_6_5</td><td>3</td><td>2</td></tr>
      <tr><td>LUMINANCE_ALPHA</td><td>UNSIGNED_BYTE</td><td>2</td><td>2</td></tr>
      <tr><td>LUMINANCE</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
      <tr><td>ALPHA</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</div>

Давайте создадим текстуру `LUMINANCE` размером 3х2 пикселей. Как видно из таблицы,
текстура `LUMINANCE` содержит всего одно значение на пиксель, которое повторяется
для каждого из каналов R, G и B.

В качестве заготовки возьмём пример из [последней статьи](webgl-3d-textures.html).
Для начала изменим текстурные координаты для использования всей текстуры для каждой
грани куба.

```
// заполняем буфер текстурными координатами для куба
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // лицевая часть
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```

Ещё поменяем код, который создаёт текстуру

```
// создаём текстуру
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// заполняем текстуру голубым пикселем 1x1
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// заполняем текстуру данными размером 3x2
const level = 0;
const internalFormat = gl.LUMINANCE;
const width = 3;
const height = 2;
const border = 0;
const format = gl.LUMINANCE;
const type = gl.UNSIGNED_BYTE;
const data = new Uint8Array([
  128,  64, 128,
    0, 192,   0,
]);
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);

// задаём фильтрацию без использования мипмапов
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// асинхронная загрузка изображения
-...
```

И вот, что получилось:

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

Упс! Почему же не работает?!?!?

Если открыть консоль JavaScript, мы увидим примерно такую ошибку:

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

Оказывается, в WebGL есть неявная настройка, которая идёт ещё
с первых версий OpenGL. Компьютеры иногда работают быстрее с
данными определённого размера. Например, копирование сразу 2,
4 или 8 байт может произойти быстрее, чем 1 байта. WebGL по
умолчанию использует 4 байта, поэтому предполагается, что в
каждой строке количество значений будет кратно 4 (кроме последней
строки).

В наших данных только 3 байта на строку и 6 байт в сумме, а WebGL
пытается прочитать 4 байта из первой строки, затем 3 байта из второй
строки, что даёт в сумме уже 7 байтов, это и приводит к ошибке.

Мы можем указать WebGL работать с 1 байтом за один раз.

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

Допустимыми значениями для alignment являются 1, 2, 4 и 8.

Подозреваю, в WebGL вы не заметите разницы в скорости между различными
значениями. Я бы хотел, чтобы значением по умолчанию было 1 вместо 4,
чтобы начинающие разработчики не сталкивались с описанной проблемой, но
для совместимости с OpenGL значение по умолчанию должно совпадать. Таким
образом при портировании приложений с подобным объявлением данных для
текстуры всё будет работать без изменений. В новых же приложениях вы
можете просто всегда устанавливать значение `1` и забыть про проблему.

Теперь наша текстура должна заработать:

{{{example url="../webgl-data-texture-3x2.html" }}}

Теперь можно перейти к [рендерингу в текстуру](webgl-render-to-texture.html).

<div class="webgl_bottombar">
<h3>Pixel и Texel</h3>
<p>Иногда пиксели в текстуре называют текселями. Пиксель - это сокрещиние от Picture Element
(элемент изображения). Тексель - сокращение от Texture Element (элемент текстуры).
</p>
<p>Уверен, что получу нагоняй от гуру по графике, но, насколько я знаю, тексель - это жаргон. Лично я, не задумываясь,
использую "пиксель" при разговоре об элементе текстуры. &#x1f607;
</p>
</div>
