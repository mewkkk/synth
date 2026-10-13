# Luma — маленький синтезатор

Для запуска откройте luma.html в браузере: стили и JavaScript уже внутри. Установка библиотек и сборка не нужны.

Основные исходники лежат в папках `app` и `public`. Структура повторяет общий принцип `synth-of-nature`, но без Rails, React и сборщика:

```text
app/
  assets/stylesheets/
    controls/Slider.css
    views/SynthRoom.css
    application.css
    basics.css
    vars.css
  javascript/
    control_components/Slider.js
    packs/application.js
    tunes/settings.js
public/index.html
dist/index.html
```

`public/index.html` подключает разнесённые исходники. В `dist` лежит собранная версия, а `luma.html` содержит всё в одном файле.

Нажмите «Запустить», чтобы включить общий 16-шаговый луп. В нём три дорожки: мелодия, бас и ударные. Дорожки можно отключать, включать соло, разводить по панораме и настраивать по громкости. Для выбранной дорожки доступны форма волны, эхо, фильтр и ADSR-огибающая. Ритм редактируется нажатием на цветные точки секвенсора.

Код написан на обычных HTML, CSS и JavaScript с Web Audio API. Имена короткие и прямые, без лишних слоёв и внешних зависимостей.

## Референсы

Изучены исходники:
- https://github.com/someth1ngWrong/synth-of-nature — настройки синтезатора и цепочка эффектов, обычный range для ползунков.
- https://github.com/iamdasha/firstAid — крупные цветные блоки, пресеты, формы волн и последовательности нот.
- https://github.com/dorothieny/ADC-Generative-Art-Boilerplate-2023 — простой компонент ползунка, объекты настроек и мелодии.
- https://github.com/NatashaKim/adc2021_js — многодорожечная структура, секвенсор, mute/solo, темп и настройки огибающей.

Это самостоятельная реализация, вдохновлённая структурой и взаимодействиями примеров. Их React/Rails/Tone.js окружение не требуется.
