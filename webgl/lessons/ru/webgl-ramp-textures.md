Title: WebGL Ramp Textures
Description: Using ramp textures
TOC: Ramp Textures (Toon Shading)

Важным моментом в WebGL является то, что текстуры — это не просто элементы, 
применяемые непосредственно к треугольникам, как мы рассмотрели в [ статье о текстурах. ](webgl-3d-textures.html).
Текстуры — это массивы данных произвольного доступа, обычно двумерные массивы данных. 
Таким образом, любое решение, в котором мы могли бы использовать массив данных с произвольным доступом,
— это место, где мы, вероятно, можем использовать текстуру.

В [статье о направленном освещени](webgl-3d-lighting-directional.html)
мы рассказали, как использовать *скалярное произведение*для вычисления угла между двумя векторами. 
В нем мы вычислили *скалярное произведение* направления света на нормаль к поверхности нашей модели. 
Так мы определили косинус угла между двумя векторами. Косинус — это значение от -1 до +1, 
и мы использовали его как непосредственный множитель нашего цвета.



```glsl
float light = dot(normal, u_reverseLightDirection);

gl_FragColor = u_color;
gl_FragColor.rgb *= light;
```

Это затемнит свет.

Что, если вместо непосредственного использования этого скалярного произведения мы воспользуемся им для поиска значения в одномерной текстуре?

```glsl
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
+uniform sampler2D u_ramp;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

-  float light = dot(normal, u_reverseLightDirection);
+  float cosAngle = dot(normal, u_reverseLightDirection);
+
+  // convert from -1 <-> 1 to 0 <-> 1
+  float u = cosAngle * 0.5 + 0.5;
+
+  // make a texture coordinate
+  vec2 uv = vec2(u, 0.5);
+
+  // lookup a value from a 1d texture
+  vec4 rampColor = texture2D(u_ramp, uv);
+
  gl_FragColor = u_color;
-  gl_FragColor.rgb *= light;
+  gl_FragColor *= rampColor;
}
```
Нам нужно создать текстуру. Начнем с текстуры 2х1. Мы будем использовать формат `LUMINANCE`,
который дает нам монохромную текстуру, используя только 1 байт на тексель.

```js
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,     // target
    0,                 // mip level
    gl.LUMINANCE,      // internal format
    2,                 // width
    1,                 // height
    0,                 // border
    gl.LUMINANCE,      // format
    gl.UNSIGNED_BYTE,  // type
    new Uint8Array([90, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
```

Цвета двух пикселей выше — темно-серый (90) и белый (255).
Мы также устанавливаем параметры текстуры, чтобы не было фильтрации.

Модифицируя образец новой текстуры, нам нужно найти форму `u_ramp`.

```js
var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
var colorLocation = gl.getUniformLocation(program, "u_color");
+var rampLocation = gl.getUniformLocation(program, "u_ramp");
var reverseLightDirectionLocation =
    gl.getUniformLocation(program, "u_reverseLightDirection");
```

и нам нужно настроить текстуру при рендеринге

```js
// bind the texture to active texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// tell the shader that u_ramp should use the texture on texture unit 0
gl.uniform1i(rampLocation, 0);
```

Я заменил данные для 3D `F` из образца света на данные для "низкополигональной" головы. 
Запустив его, мы получим это

{{{example url="../webgl-ramp-texture.html"}}}

Если вы повернете модель, вы увидите, что она похожа на  [toon shading](https://en.wikipedia.org/wiki/Cel_shading)

В приведенном выше примере мы установили фильтрацию текстур на `NEAREST`, что означает, 
что мы просто выбираем ближайший тексел из текстуры для нашего цвета. 
Есть только 2 текселя, поэтому, если поверхность обращена от света, мы получаем первый цвет (темно-серый), 
а если поверхность обращена к свету, мы получаем второй цвет (белый). 
Этот цвет умножается на `gl_FragColor`, точно так же, как раньше был `light`.

Thinking about it if we switch to `LINEAR` filtering we *should* get the same
result as before using the texture. Let's try it.

Если подумать, если мы переключимся на `LINEAR` фильтрацию, 
*мы должны* получить тот же результат, что и перед использованием текстуры. Давай попробуем.

```js
-gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
-gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
+gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
+gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

{{{example url="../webgl-ramp-texture-linear.html"}}}

Это выглядит похоже, но если мы действительно сравним их друг с другом...

<div class="webgl_center"><img src="resources/ramp-vs-light.png" style="width: 598px;"></div>

Мы видим, что они не одинаковы. Но почему?

`LINEAR` фильтрация смешивает пиксели. 
Если мы увеличим текстуру размером 2 пикселя с линейной фильтрацией, мы увидим проблему.

<div class="webgl_center"><img src="resources/linear-texture-interpolation.svg" style="width: 500px;"></div>
<div class="webgl_center">Диапазон координат текстуры для ramp</div>

С каждой стороны по полпикселя без интерполяции. Представьте, если для текстуры было установлено
`TEXTURE_WRAP_S` в `REPEAT`. Тогда мы ожидаем, что самая левая половина красного пикселя будет линейно сливаться с зеленым,
как если бы зеленый цвет повторялся влево. Но то, что слева, более красное, поскольку мы используем `CLAMP_TO_EDGE`.

Чтобы действительно получить линейное изменение, нам просто нужно выбрать значения из этого центрального диапазона.
Мы можем сделать это с помощью небольших математических вычислений в нашем шейдере.

```glsl
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
+uniform vec2 u_rampSize;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // convert from -1 <-> 1 to 0 <-> 1
  float u = cosAngle * 0.5 + 0.5;

  // make a texture coordinate.
  vec2 uv = vec2(u, 0.5);

+  // scale to size of ramp
+  vec2 texelRange = uv * (u_rampSize - 1.0);
+
+  // offset by half a texel and convert to texture coordinate
+  vec2 rampUV = (texelRange + 0.5) / u_rampSize;

-  vec4 rampColor = texture2D(u_ramp, uv);
+  vec4 rampColor = texture2D(u_ramp, rampUV);

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

Выше мы в основном масштабируем нашу UV-координату, чтобы она изменялась от 0 до 1 на 1 меньше ширины текстуры.
Затем добавляем половину пикселя и конвертируем обратно в нормализованные координаты текстуры.

Нам нужно найти местоположение `u_rampSize`

```js
var colorLocation = gl.getUniformLocation(program, "u_color");
var rampLocation = gl.getUniformLocation(program, "u_ramp");
+var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
```

И нам нужно установить его во время рендеринга

```js
// bind the texture to active texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// tell the shader that u_ramp should use the texture on texture unit 0
gl.uniform1i(rampLocation, 0);
+gl.uniform2fv(rampSizeLocation, [2, 1]);
```

Прежде чем запустить его, давайте добавим флаг, чтобы мы могли сравнивать с *ramp texture* и без нее.


```glsl
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
uniform vec2 u_rampSize;
+uniform bool u_useRampTexture;

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // convert from -1 <-> 1 to 0 <-> 1
  float u = cosAngle * 0.5 + 0.5;

  // make a texture coordinate.
  vec2 uv = vec2(u, 0.5);

  // scale to size of ramp
  vec2 texelRange = uv * (u_rampSize - 1.0);

  // offset by half a texel and convert to texture coordinate
  vec2 rampUV = (texelRange + 0.5) / u_rampSize;

  vec4 rampColor = texture2D(u_ramp, rampUV);

+  if (!u_useRampTexture) {
+    rampColor = vec4(u, u, u, 1);
+  }

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

Мы также найдем местонахождение этой формы.

```js
var rampLocation = gl.getUniformLocation(program, "u_ramp");
var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
+var useRampTextureLocation = gl.getUniformLocation(program, "u_useRampTexture");
```

и установим её

```js
var data = {
  useRampTexture: true,
};

...

// bind the texture to active texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0);
gl.bindTexture(gl.TEXTURE_2D, tex);
// tell the shader that u_ramp should use the texture on texture unit 0
gl.uniform1i(rampLocation, 0);
gl.uniform2fv(rampSizeLocation, [2, 1]);

+gl.uniform1i(useRampTextureLocation, data.useRampTexture);
```

Таким образом, мы видим, что старый способ освещения и новый способ texture rump совпадают.

{{{example url="../webgl-ramp-texture-issue-confirm.html"}}}

Установив флажок «useRampTexture», мы не видим никаких изменений, поскольку теперь эти два метода совпадают.

> Примечание. Обычно я не рекомендую использовать в шейдере условие типа `u_useRampTexture`
> Вместо этого я рекомендую создать две шейдерные программы: одну, использующую нормальное освещение, 
> и другую, использующую ramp texture. К сожалению, поскольку код не использует
> что-то вроде [нашей вспомогательной библиотеки](webgl-less-code-more-fun.html),
> для поддержки двух шейдерных программ потребовалось бы существенное изменение. 
> Для каждой программы нужен свой набор локаций. Внесение столь значительных изменений отвлекло 
> бы от сути этой статьи, поэтому в данном случае я решил использовать условность. 
> В целом я стараюсь избегать условий при выборе функций в шейдерах и вместо этого создаю разные шейдеры для разных функций.

Примечание. Эта математика важна только в том случае, если мы используем `LINEAR` фильтрацию. 
Если мы используем фильтрацию `NEAREST`, нам нужна исходная математика.

Теперь, когда мы знаем, что математические расчеты рампы верны, давайте создадим несколько различных ramp textures.

```js
+// make a 256 array where elements 0 to 127
+// go from 64 to 191 and elements 128 to 255
+// are all 255.
+const smoothSolid = new Array(256).fill(255);
+for (let i = 0; i < 128; ++i) {
+  smoothSolid[i] = 64 + i;
+}
+
+const ramps = [
+  { name: 'dark-white',          color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255] },
+  { name: 'dark-white-skewed',   color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 255, 255] },
+  { name: 'normal',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: true,
+    data: [0, 255] },
+  { name: '3-step',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 160, 255] },
+  { name: '4-step',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 140, 200, 255] },
+  { name: '4-step skewed',       color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 80, 140, 200, 255] },
+  { name: 'black-white-black',   color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255, 80] },
+  { name: 'stripes',             color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255] },
+  { name: 'stripe',              color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255] },
+  { name: 'smooth-solid',        color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false,
+    data: smoothSolid },
+  { name: 'rgb',                 color: [  1, 1,   1, 1], format: gl.RGB,       filter: true,
+    data: [255, 0, 0, 0, 255, 0, 0, 0, 255] },
+];
+
+var elementsForFormat = {};
+elementsForFormat[gl.LUMINANCE] = 1;
+elementsForFormat[gl.RGB      ] = 3;
+
+ramps.forEach((ramp) => {
+  const {name, format, filter, data} = ramp;
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
+  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
+  const width = data.length / elementsForFormat[format];
  gl.texImage2D(
      gl.TEXTURE_2D,     // target
      0,                 // mip level
*      format,            // internal format
*      width,
      1,                 // height
      0,                 // border
*     format,            // format
      gl.UNSIGNED_BYTE,  // type
*      new Uint8Array(data));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
*  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter ? gl.LINEAR : gl.NEAREST);
*  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter ? gl.LINEAR : gl.NEAREST);
+  ramp.texture = tex;
+  ramp.size = [width, 1];
+});
```

и давайте создадим шейдер так, чтобы он мог обрабатывать как `NEAREST, так и `LINEAR`. 
Как я уже упоминал выше, я обычно не использую логические операторы if в шейдерах, 
но если различия небольшие и я могу сделать это без условия, то я рассмотрю возможность использования одного шейдера. 
Для этого мы можем добавить плавающую форму `u_linearAdjust`, которой мы установим значение 0,0 или 1,0.

```glsl
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_ramp;
uniform vec2 u_rampSize;
-uniform bool u_useRampTexture;
-uniform float u_linearAdjust;  // 1.0 if linear, 0.0 if nearest

void main() {
  // because v_normal is a varying it's interpolated
  // so it will not be a unit vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  float cosAngle = dot(normal, u_reverseLightDirection);

  // convert from -1 <-> 1 to 0 <-> 1
  float u = cosAngle * 0.5 + 0.5;

  // make a texture coordinate.
  vec2 uv = vec2(u, 0.5);

  // scale to size of ramp
-  vec2 texelRange = uv * (u_rampSize - 1.0);
+  vec2 texelRange = uv * (u_rampSize - u_linearAdjust);

-  // offset by half a texel and convert to texture coordinate
-  vec2 rampUV = (texelRange + 0.5) / u_rampSize;
+  // offset by half a texel if linear and convert to texture coordinate
+  vec2 rampUV = (texelRange + 0.5 * u_linearAdjust) / u_rampSize;

  vec4 rampColor = texture2D(u_ramp, rampUV);

-  if (!u_useRampTexture) {
-    rampColor = vec4(u, u, u, 1);
-  }

  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
}
```

во время инициализации найдите местоположение

```js
var colorLocation = gl.getUniformLocation(program, "u_color");
var rampLocation = gl.getUniformLocation(program, "u_ramp");
var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
+var linearAdjustLocation = gl.getUniformLocation(program, "u_linearAdjust");
```

и во время рендеринга выберите одну из текстур

```js
var data = {
  ramp: 0,
};

...
+const {texture, color, size, filter} = ramps[data.ramp];

// Set the color to use
-gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]);
+gl.uniform4fv(colorLocation, color);

// set the light direction.
gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([-1.75, 0.7, 1]));

// bind the texture to active texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0);
-gl.bindTexture(gl.TEXTURE_2D, tex);
+gl.bindTexture(gl.TEXTURE_2D, texture);
// tell the shader that u_ramp should use the texture on texture unit 0
gl.uniform1i(rampLocation, 0);
-gl.uniform2fv(rampSizeLocation, [2, 1]);
+gl.uniform2fv(rampSizeLocation, size);

+// adjust if linear
+gl.uniform1f(linearAdjustLocation, filter ? 1 : 0);
```

{{{example url="../webgl-ramp-textures.html"}}}

Попробуйте различные ramp textures, и вы увидите множество странных эффектов. 
Это один из способов универсальной корректировки шейдера.
Вы можете создать шейдер, который выполняет двухцветное *toon shading*, 
установив 2 цвета и такой порог.

```js
uniform vec4 color1;
uniform vec4 color2;
uniform float threshold;

...

  float cosAngle = dot(normal, u_reverseLightDirection);

  // convert from -1 <-> 1 to 0 <-> 1
  float u = cosAngle * 0.5 + 0.5;

  gl_FragColor = mix(color1, color2, step(cosAngle, threshold));
```

И это сработает. Но если вам нужна трехэтапная или четырехшаговая версия, 
вам придется написать еще один шейдер. С *ramp texture* вы можете просто 
создать другую текстуру. Кроме того, обратите внимание выше: даже если вам 
нужен двухшаговый шейдер мультяшного изображения,
вы все равно можете настроить место выполнения шага, просто добавив больше 
или меньше данных в текстуру. Например текстура с

```
[dark, light]
```

Дает вам двухступенчатую текстуру, где она разделяется посередине между направлением к свету или от него. Но текстура типа

```
[dark, dark, dark, light, light]
```

позволит переместить разделение на отметку 60% между лицом от света и лицом к свету, и все это без необходимости изменения шейдера.

Этот конкретный пример использования *ramp texture* для *toon shading* или странных
эффектов может оказаться для вас полезным, а может и нет, но более важным выводом является 
просто базовая концепция использования некоторого значения для поиска данных в текстуре. 
Использование подобных текстур предназначено не только для преобразования расчета освещения. 
Вы можете использовать *ramp texture*  [для постобработки](webgl-post-processing.html), чтобы добиться того же эффекта, 
[что и карта градиента в фотошопе](https://www.photoshopessentials.com/photo-effects/gradient-map/)

Вы также можете использовать *ramp texture* для анимации на основе графического процессора. 
Вы сохраняете ключевые значения в текстуре и используете «time» в качестве значения 
для перемещения по текстуре. Есть много применений этой техники.
