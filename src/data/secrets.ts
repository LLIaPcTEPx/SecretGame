import { SecretDef } from '../types/game';

export const SECRETS: SecretDef[] = [
  // ===================== EASY (1 - 24) =====================
  {
    id: 1,
    title: { en: 'Welcome!', ru: 'Welcome!' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'plaza_base',
    hint: {
      en: 'Simply enter Secret Universe! Your very first secret builds the Spawn Plaza.',
      ru: 'Просто войди в Secret Universe! Твой самый первый секрет построит Площадь Спавна.',
    },
    lore: {
      en: 'Welcome to a universe where every corner, word, and setting builds the world around you.',
      ru: 'Добро пожаловать во вселенную, где каждый угол, слово и настройка возводят мир вокруг тебя.',
    },
    timeEstimate: { en: '1 sec', ru: '1 сек' },
  },
  {
    id: 2,
    title: { en: 'First Steps', ru: 'Первые шаги' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'fountain',
    hint: {
      en: 'Stretch your legs: walk 15 meters across the Spawn Plaza (WASD) to build the Central Fountain.',
      ru: 'Разомни ноги: пройди 15 метров по Площади Спавна (WASD), чтобы построить Центральный Фонтан.',
    },
    lore: {
      en: 'The journey to a hundred secrets begins with fifteen steps.',
      ru: 'Путь к сотне секретов начинается с пятнадцати шагов.',
    },
    timeEstimate: { en: '5 sec', ru: '5 сек' },
  },
  {
    id: 3,
    title: { en: 'Hopper', ru: 'Попрыгунчик' },
    difficulty: 'easy',
    category: 'parkour',
    buildsStructure: 'difficulty_monument',
    hint: {
      en: 'Press Space 10 times to test gravity — builds the Difficulty Chart Monument!',
      ru: 'Нажми Пробел 10 раз — проверь гравитацию и построй Монумент Сложности!',
    },
    lore: {
      en: 'A bouncy stride will serve you well on the Sky Obby.',
      ru: 'Пружинистая походка пригодится на Небесном Обби.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 4,
    title: { en: 'Fountain Splash', ru: 'Плеск в фонтане' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'pavilion',
    hint: {
      en: 'Jump right into the glowing water of the Central Fountain on Spawn Plaza (built by #2).',
      ru: 'Запрыгни прямо в воду Центрального Фонтана на Площади Спавна (строится за #2).',
    },
    lore: {
      en: 'The fountain water glows because forgotten riddles are dissolved inside it.',
      ru: 'Вода в фонтане светится, потому что в ней растворены забытые загадки.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 5,
    title: { en: 'Hello World!', ru: 'Привет, мир!' },
    difficulty: 'easy',
    category: 'chat',
    buildsStructure: 'founder_statue',
    hint: {
      en: 'Open chat (Enter or /) and greet the universe with "hello" (or "привет") to build the Founder Statue.',
      ru: 'Открой чат (Enter или /) и поздоровайся словом «привет» или «hello», чтобы построить Статую Основателя.',
    },
    lore: {
      en: 'Politeness opens more doors than you might expect.',
      ru: 'Вежливость открывает больше дверей, чем кажется.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 6,
    title: { en: 'Need Help?', ru: 'Помощь зала' },
    difficulty: 'easy',
    category: 'command',
    buildsStructure: 'forest_island',
    hint: {
      en: 'Type the basic /help command in chat — builds the western bridge & Whispering Forest!',
      ru: 'Введи базовую команду /help в чате — это построит западный мост и Шепчущий Лес!',
    },
    lore: {
      en: 'Not every command is listed in /help — the best ones must be decoded.',
      ru: 'Не все команды показаны в списке /help — лучшие придётся расшифровать.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 7,
    title: { en: 'Dance Floor', ru: 'Танцпол' },
    difficulty: 'easy',
    category: 'command',
    buildsStructure: 'sky_obby',
    hint: {
      en: 'Start a party! Type /dance in chat — builds the Bounce Pad & Sky Obby!',
      ru: 'Устрой дискотеку! Введи команду /dance в чате — это построит Батут и Небесный Обби!',
    },
    lore: {
      en: 'Even the greatest secret hunters bust a move sometimes.',
      ru: 'Даже великие охотники за секретами иногда танцуют.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 8,
    title: { en: 'Take a Seat', ru: 'Передышка' },
    difficulty: 'easy',
    category: 'command',
    buildsStructure: 'plaza_lanterns',
    hint: {
      en: 'Sit on the bench near the Fountain (E) or type /sit in chat — builds Plaza Lanterns!',
      ru: 'Сядь на скамейку рядом с фонтаном (E) или введи /sit в чате — построит Фонари Площади!',
    },
    lore: {
      en: 'Sometimes the best way to find a secret is to sit down and look around.',
      ru: 'Иногда лучший способ найти секрет — просто присесть и осмотреться.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 9,
    title: { en: 'Index Explorer', ru: 'Хранитель Индекса' },
    difficulty: 'easy',
    category: 'meta',
    buildsStructure: 'library_island',
    hint: {
      en: 'Open the Index (top-right button or Tab key) — builds the northern bridge & Cipher Library!',
      ru: 'Открой книгу секретов Index (кнопка справа сверху или Tab) — построит Библиотеку Шифров!',
    },
    lore: {
      en: 'Inside the Index lie not only hints, but secrets of its own...',
      ru: 'Внутри Индекса спрятаны не только подсказки, но и собственные тайны...',
    },
    timeEstimate: { en: '5 sec', ru: '5 сек' },
  },
  {
    id: 10,
    title: { en: 'Coffee Break', ru: 'Пауза на кофе' },
    difficulty: 'easy',
    category: 'meta',
    buildsStructure: 'lab_island',
    hint: {
      en: 'Open the Pause Menu (Esc or Pause button) — builds the eastern bridge & Tech Lab!',
      ru: 'Открой меню Паузы (Esc или кнопка Пауза) — построит восточный мост и Техно-Лабораторию!',
    },
    lore: {
      en: 'Check Settings closely — there is far more hidden there than plain sliders.',
      ru: 'Загляни в Настройки — там скрыто куда больше, чем просто ползунки.',
    },
    timeEstimate: { en: '5 sec', ru: '5 сек' },
  },
  {
    id: 11,
    title: { en: 'ShiftLock Master', ru: 'Мастер ShiftLock' },
    difficulty: 'easy',
    category: 'camera',
    hint: {
      en: 'Toggle ShiftLock mode using Left Shift (or the ShiftLock button on screen).',
      ru: 'Активируй режим ShiftLock клавишей Left Shift (или кнопкой на экране).',
    },
    lore: {
      en: 'The classic Roblox trick: over-the-shoulder camera and crisp directional control.',
      ru: 'Классический приём из Роблокса: камера за плечом и точный контроль поворота.',
    },
    timeEstimate: { en: '5 sec', ru: '5 сек' },
  },
  {
    id: 12,
    title: { en: 'First Person', ru: 'От первого лица' },
    difficulty: 'easy',
    category: 'camera',
    buildsStructure: 'plaza_mysteries',
    hint: {
      en: 'Zoom the camera all the way in (Scroll up or key I) to enter First Person — builds Plaza Runes & Torch!',
      ru: 'Приблизь камеру максимально близко (колёсико вверх / I) — построит Ультра-Руны и Факел Площади!',
    },
    lore: {
      en: 'In First Person you can inspect tiny inscriptions and peer through keyholes.',
      ru: 'От первого лица ты сможешь разглядеть крошечные надписи и замочные скважины.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 13,
    title: { en: 'Eagle Eye', ru: 'Взгляд орла' },
    difficulty: 'easy',
    category: 'camera',
    buildsStructure: 'plaza_sky_under',
    hint: {
      en: 'Zoom the camera all the way out (Scroll down or key O) — builds the Sky Cipher & Underground Vault!',
      ru: 'Отдали камеру до предела (колёсико вниз / O) — построит Небесный Шифр и Тайник под Площадью!',
    },
    lore: {
      en: 'From a bird’s-eye view, messages appear on rooftops, in the sky, and beneath islands.',
      ru: 'С высоты птичьего полёта видны послания на крышах, в небе и даже под островами.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 14,
    title: { en: 'Into the Void', ru: 'Шаг в пустоту' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'volcano_island',
    hint: {
      en: 'What happens if you jump off the edge of the floating island? Builds the Volcanic Cavern!',
      ru: 'Что будет, если спрыгнуть с края острова вниз? Построит Вулканическую Пещеру!',
    },
    lore: {
      en: 'The void always brings you back... yet remembers every single fall.',
      ru: 'Пустота всегда возвращает тебя обратно... но запоминает каждое падение.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 15,
    title: { en: 'Big Red Button', ru: 'Большая красная кнопка' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'clocktower',
    hint: {
      en: 'Walk behind the Spawn Welcome Arch — press the tempting red button to raise the Clocktower!',
      ru: 'Обойди сзади приветственную Арку Спавна — нажми красную кнопку, чтобы возвести Башню Часов!',
    },
    lore: {
      en: 'Nobody has ever resisted pressing a big red button.',
      ru: 'Никто ещё не смог устоять перед большой красной кнопкой.',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 16,
    title: { en: 'Forest Wanderer', ru: 'Лесной путник' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'forest_ruins',
    hint: {
      en: 'Cross the western wooden bridge (built by #6) into Whispering Forest — builds Ancient Ruins!',
      ru: 'Перейди по западному мосту (строится за #6) в Шепчущий Лес — построит Древние Руины!',
    },
    lore: {
      en: 'Ancient trees remember the order of colors and the whispers of ruins.',
      ru: 'Древние деревья помнят порядок цветов и шёпот руин.',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 17,
    title: { en: 'Bookworm', ru: 'Книжный червь' },
    difficulty: 'easy',
    category: 'exploration',
    hint: {
      en: 'Cross the northern marble bridge (built by #9) into the Cipher Library. [O]nly curious minds read every shelf.',
      ru: 'Перейди по северному мосту (строится за #9) в Библиотеку Шифров. [O]сторожно: книги здесь говорят загадками.',
    },
    lore: {
      en: 'These halls hold the keys to dozens of ciphers.',
      ru: 'В этих залах хранятся ключи к десяткам шифров.',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 18,
    title: { en: 'Fiery Breath', ru: 'Огненное дыхание' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'volcano_crystals',
    hint: {
      en: 'Cross the southern stone bridge (built by #14) into the Volcanic Cavern — builds the 4 Crystals!',
      ru: 'Перейди по южному мосту (строится за #14) в Вулканическую Пещеру — построит 4 Кристалла!',
    },
    lore: {
      en: 'Watch out for lava, and keep an eye out for hidden crystals along the walls.',
      ru: 'Осторожнее с лавой, но не бойся искать скрытые кристаллы у стен.',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 19,
    title: { en: 'Lab Visitor', ru: 'Гость Лаборатории' },
    difficulty: 'easy',
    category: 'exploration',
    hint: {
      en: 'Cross the eastern neon bridge (built by #10) into the Tech Lab.',
      ru: 'Перейди по восточному неоновому мосту (строится за #10) в Техно-Лабораторию.',
    },
    lore: {
      en: 'Monitors, terminals, and secret graphics protocols await inside.',
      ru: 'Мониторы, терминалы и секретные протоколы графики ждут тебя.',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 20,
    title: { en: 'On the Pavilion Roof', ru: 'На крыше павильона' },
    difficulty: 'easy',
    category: 'parkour',
    hint: {
      en: 'Climb the ledges onto the red roof of the Pavilion on southeast Spawn Plaza (built by #4).',
      ru: 'Заберись по ступеням на крышу беседки на юго-востоке Площади Спавна (строится за #4).',
    },
    lore: {
      en: 'A great view of the plaza — and a warm-up for real parkour.',
      ru: 'Отличный обзор на площадь — и разминка перед настоящим паркуром.',
    },
    timeEstimate: { en: '20 sec', ru: '20 сек' },
  },
  {
    id: 21,
    title: { en: 'Fresh Start', ru: 'Свежий старт' },
    difficulty: 'easy',
    category: 'command',
    buildsStructure: 'spawn_crystal_arch',
    hint: {
      en: 'Use the /reset command in chat to teleport back to spawn — builds the Spawn Crystal Arch!',
      ru: 'Используй команду /reset в чате, чтобы вернуться на спавн — построит Кристальную Арку!',
    },
    lore: {
      en: 'Sometimes returning to the start is the fastest shortcut.',
      ru: 'Иногда возвращение к истокам — самый быстрый путь.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 22,
    title: { en: 'Where Am I?', ru: 'Где я?' },
    difficulty: 'easy',
    category: 'command',
    hint: {
      en: 'Check your exact coordinates using /pos (or /coords) in chat.',
      ru: 'Узнай своё точное положение в пространстве командой /pos (или /coords).',
    },
    lore: {
      en: 'X, Y, and Z coordinates will lead you to buried secrets.',
      ru: 'Координаты X, Y, Z ещё не раз приведут тебя к зарытым тайнам.',
    },
    timeEstimate: { en: '10 sec', ru: '10 сек' },
  },
  {
    id: 23,
    title: { en: 'Boing!', ru: 'Боинг!' },
    difficulty: 'easy',
    category: 'parkour',
    buildsStructure: 'sky_observatory',
    hint: {
      en: 'Jump on the bright green bounce pad on northeast Plaza (built by #7) — builds the Sky Observatory!',
      ru: 'Прыгни на ярко-зелёный батут на северо-востоке Площади (строится за #7) — построит Обсерваторию!',
    },
    lore: {
      en: 'Up into the clouds — the Observatory floats above!',
      ru: 'Вверх к облакам — там парит Обсерватория!',
    },
    timeEstimate: { en: '15 sec', ru: '15 сек' },
  },
  {
    id: 24,
    title: { en: 'Behind the Great Tree', ru: 'За великим деревом' },
    difficulty: 'easy',
    category: 'exploration',
    buildsStructure: 'rainbow_pillars',
    hint: {
      en: 'In Whispering Forest, look behind the trunk of the largest ancient tree — builds the Rainbow Pillars!',
      ru: 'В Шепчущем Лесу загляни за ствол самого огромного дерева — построит Столбы Радуги!',
    },
    lore: {
      en: 'A glowing cube lay hidden in the shadow of roots for centuries.',
      ru: 'Светящийся куб веками лежал в тени корней.',
    },
    timeEstimate: { en: '25 sec', ru: '25 сек' },
  },

  // ===================== MEDIUM (25 - 46) =====================
  {
    id: 25,
    title: { en: 'Illusion Wall', ru: 'Стена-иллюзия' },
    difficulty: 'medium',
    category: 'exploration',
    buildsStructure: 'void_island',
    hint: {
      en: 'On the west edge of the Forest Ruins (built by #16), one stone wall shimmers strangely. Walk through it to build the Void Portal & Void Island!',
      ru: 'На западном краю Лесных Руин (строятся за #16) одна стена странно мерцает. Пройди сквозь неё, чтобы построить Портал и Остров Бездны!',
    },
    lore: {
      en: 'Not everything that looks solid truly blocks your path.',
      ru: 'Не всё твёрдое на вид действительно преграждает путь.',
    },
    timeEstimate: { en: '40 sec', ru: '40 сек' },
  },
  {
    id: 26,
    title: { en: 'Rooftop Message', ru: 'Послание на крыше' },
    difficulty: 'medium',
    category: 'camera',
    buildsStructure: 'library_spire',
    hint: {
      en: 'Zoom the camera far out and look down at the roof of the Cipher Library. Type the word you see in chat!',
      ru: 'Отдали камеру далеко вверх и взгляни сверху на крышу Библиотеки Шифров. Напиши увиденное слово в чат!',
    },
    lore: {
      en: 'Eyes in the sky see what stays hidden from the ground (SKYEYE).',
      ru: 'Небесные глаза видят то, что скрыто с земли (SKYEYE).',
    },
    timeEstimate: { en: '45 sec', ru: '45 сек' },
  },
  {
    id: 27,
    title: { en: 'Keyhole Peek', ru: 'Замочная скважина' },
    difficulty: 'medium',
    category: 'camera',
    hint: {
      en: 'In Tech Lab, walk right up to the locked steel vault, enter First Person, peek into the keyhole (E), and type the code in chat.',
      ru: 'В Техно-Лаборатории подойди вплотную к запертой стальной камере, войди в First Person, загляни в скважину (E) и напиши код в чат.',
    },
    lore: {
      en: 'Four glowing digits behind a steel door yielded to your sharp eyes.',
      ru: 'Четыре цифры за толстой дверью поддались твоему зоркому взгляду.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 28,
    title: { en: 'Mirrored Words', ru: 'Зеркальные слова' },
    difficulty: 'medium',
    category: 'cipher',
    hint: {
      en: 'Find the note reading "TERCES" in the Library, read it backwards, and type the answer in chat.',
      ru: 'Найди записку со словом «TERCES» в Библиотеке, прочти её наоборот и напиши ответ в чат.',
    },
    lore: {
      en: 'The simplest cipher is a look in the mirror.',
      ru: 'Простейший шифр — взгляд в зеркало.',
    },
    timeEstimate: { en: '45 sec', ru: '45 сек' },
  },
  {
    id: 29,
    title: { en: 'Caesar Cipher I', ru: 'Шифр Цезаря I' },
    difficulty: 'medium',
    category: 'cipher',
    buildsStructure: 'forest_rune_arch',
    hint: {
      en: 'A stone plaque in Forest Ruins reads "ZRUOG" (Caesar +3). Decode it and type the word in chat!',
      ru: 'На каменной табличке в Лесных Руинах выбито «ZRUOG» (Цезарь +3). Расшифруй и напиши слово в чат!',
    },
    lore: {
      en: 'Shifting three letters back reveals an entire WORLD.',
      ru: 'Сдвиг на три буквы назад открывает целый WORLD.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 30,
    title: { en: 'Binary Whisper', ru: 'Двоичный шёпот' },
    difficulty: 'medium',
    category: 'cipher',
    hint: {
      en: 'A monitor in Tech Lab flashes ASCII binary. Convert it to a word and type /word in chat.',
      ru: 'Монитор в Техно-Лаборатории мигает нулями и единицами (ASCII). Переведи слово и введи его как /слово в чат.',
    },
    lore: {
      en: '01000011 01001111 01000100 01000101 — machine tongue decoded (/code).',
      ru: '01000011 01001111 01000100 01000101 — язык машин раскрыт (/code).',
    },
    timeEstimate: { en: '1.5 min', ru: '1.5 мин' },
  },
  {
    id: 31,
    title: { en: 'Campfire Warmth', ru: 'Тепло костра' },
    difficulty: 'medium',
    category: 'chat',
    hint: {
      en: 'Stand right next to the Whispering Forest campfire for 5 seconds, then say "warm" (or "тепло") in chat.',
      ru: 'Погрейся прямо у костра в Шепчущем Лесу 5 секунд, а затем напиши в чат «тепло» (или «warm»).',
    },
    lore: {
      en: 'The campfire sparks rose gently in answer to your words.',
      ru: 'Искры костра тихо взметнулись в ответ на твои слова.',
    },
    timeEstimate: { en: '40 sec', ru: '40 сек' },
  },
  {
    id: 32,
    title: { en: 'Clocktower Peak', ru: 'Вершина Башни Часов' },
    difficulty: 'medium',
    category: 'parkour',
    buildsStructure: 'clocktower_gears',
    hint: {
      en: 'Climb the spiral steps all the way to the top of the Clocktower (built by #15) — adds golden floating gears!',
      ru: 'Взберись по уступам на самый верх Башни Часов (строится за #15) — добавит парящие золотые шестерни!',
    },
    lore: {
      en: 'Up here you can hear the steady ticking of eternity itself.',
      ru: 'Отсюда слышен равномерный ход самой вечности.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 33,
    title: { en: 'Sky Observatory', ru: 'Небесная Обсерватория' },
    difficulty: 'medium',
    category: 'parkour',
    buildsStructure: 'sky_gauntlet',
    hint: {
      en: 'Climb the colorful Sky Obby to the floating Sky Observatory (built by #23) — builds the ShiftLock Gauntlet & Sky Glitch!',
      ru: 'Пройди Небесный Обби до Обсерватории (строится за #23) — построит Испытание ShiftLock и Небесный Глитч!',
    },
    lore: {
      en: 'Clouds beneath your feet, stars above your head.',
      ru: 'Облака под ногами, звёзды над головой.',
    },
    timeEstimate: { en: '1.5 min', ru: '1.5 мин' },
  },
  {
    id: 34,
    title: { en: 'Lava Hopper', ru: 'Прыжки над лавой' },
    difficulty: 'medium',
    category: 'parkour',
    buildsStructure: 'volcano_pillars',
    hint: {
      en: 'Hop across the basalt stones over the lava pool in Volcanic Cavern and open the golden chest!',
      ru: 'Перепрыгни по базальтовым камням через озеро лавы в Вулканической Пещере к золотому сундуку!',
    },
    lore: {
      en: 'The heat below only makes victory sweeter.',
      ru: 'Жар внизу лишь делает победу слаще.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 35,
    title: { en: 'Mute World', ru: 'Тишина в студии' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Open Settings and turn BOTH Sound Effects and Music down to 0%. [K]eep listening — silence whispers.',
      ru: 'Открой Настройки и уменьши громкость звуков И музыки до 0%. [K]ажется, тишина тоже что-то шепчет.',
    },
    lore: {
      en: 'In total silence, you can hear the heartbeat of the secret world.',
      ru: 'В абсолютной тишине слышно биение секретного мира.',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 36,
    title: { en: 'Fish Eye', ru: 'Рыбий глаз' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Crank Field of View (FOV) in Settings all the way up to maximum (110°).',
      ru: 'Выкрути Поле Зрения (FOV) в Настройках до самого максимума (110°).',
    },
    lore: {
      en: 'The horizon widened and everything suddenly felt faster!',
      ru: 'Горизонт расширился, и мир стал казаться быстрее!',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 37,
    title: { en: 'Tunnel Vision', ru: 'Туннельное зрение' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Narrow Field of View (FOV) in Settings all the way down to minimum (50°).',
      ru: 'Сузь Поле Зрения (FOV) в Настройках до минимума (50°).',
    },
    lore: {
      en: 'Pure focus on what matters — nothing extra at the edges.',
      ru: 'Фокус на самом главном — ничего лишнего по краям.',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 38,
    title: { en: 'Hyper Mouse', ru: 'Гипер-мышь' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Set Mouse Sensitivity in Settings to absolute maximum (3.00).',
      ru: 'Поставь Чувствительность мыши в Настройках на абсолютный максимум (3.00).',
    },
    lore: {
      en: 'One flick of the wrist and you spun three full circles!',
      ru: 'Одно движение запястья — и ты обернулся трижды!',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 39,
    title: { en: 'Turtle Mouse', ru: 'Черепашья мышь' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Set Mouse Sensitivity in Settings to absolute minimum (0.20).',
      ru: 'Поставь Чувствительность мыши в Настройках на абсолютный минимум (0.20).',
    },
    lore: {
      en: 'Sniper precision requires patience.',
      ru: 'Снайперская точность требует терпения.',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 40,
    title: { en: 'Potato Mode', ru: 'Режим Картошки' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Lower Graphics to 1 (Minimum) — the illusion fog in southern Forest disappears, revealing the Phantom Cube!',
      ru: 'Снизь Графику до 1 (Минимум) — иллюзорный туман на юге Леса рассеется и откроет Призрачный Куб!',
    },
    lore: {
      en: 'Minimum detail strips away the veil of illusion.',
      ru: 'Минимальная детализация снимает завесу иллюзий.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 41,
    title: { en: 'Ultra Runes', ru: 'Ультра-руны' },
    difficulty: 'medium',
    category: 'settings',
    hint: {
      en: 'Set Graphics to 5 (Ultra) — a hidden glowing rune circle lights up on Spawn Plaza (built by #12). Activate it (E)!',
      ru: 'Включи Графику 5 (Ультра) — на Площади Спавна засияет скрытый рунный круг (строится за #12). Активируй его (E)!',
    },
    lore: {
      en: 'Some magical sigils only appear at maximum fidelity.',
      ru: 'Некоторые магические узоры видны лишь на максимальном качестве.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 42,
    title: { en: 'Three Pressure Plates', ru: 'Три нажимные плиты' },
    difficulty: 'medium',
    category: 'exploration',
    hint: {
      en: 'Find and step on 3 hidden golden plates: on Spawn Plaza (#12), the corner of Forest, and the corner of Tech Lab.',
      ru: 'Найди и наступи на 3 скрытые золотые плиты: на Площади (#12), на краю Леса и в углу Лаборатории.',
    },
    lore: {
      en: 'Three mechanical clicks echoed across every floating island.',
      ru: 'Три щелчка механизма отозвались эхом по всем островам.',
    },
    timeEstimate: { en: '1.5 min', ru: '1.5 мин' },
  },
  {
    id: 43,
    title: { en: 'Wave to the Founder', ru: 'Поклон Основателю' },
    difficulty: 'medium',
    category: 'command',
    hint: {
      en: 'Walk up to the Golden Founder Statue on northern Plaza (built by #5) and type /wave.',
      ru: 'Подойди к Золотой Статуе Основателя на севере Площади (строится за #5) и введи /wave.',
    },
    lore: {
      en: 'The statue seemed to smile ever so slightly in return.',
      ru: 'Статуя словно едва заметно улыбнулась в ответ.',
    },
    timeEstimate: { en: '40 sec', ru: '40 сек' },
  },
  {
    id: 44,
    title: { en: 'Laugh in the Fire', ru: 'Смех в бездне огня' },
    difficulty: 'medium',
    category: 'command',
    hint: {
      en: 'Enter the Volcanic Cavern and fearlessly laugh with /laugh.',
      ru: 'Зайди в Вулканическую Пещеру и бесстрашно рассмейся командой /laugh.',
    },
    lore: {
      en: 'Your laughter echoed across the dark basalt ledges.',
      ru: 'Эхо твоего смеха прокатилось по базальтовым сводам.',
    },
    timeEstimate: { en: '45 sec', ru: '45 сек' },
  },
  {
    id: 45,
    title: { en: 'Under the Bridge', ru: 'Под мостом' },
    difficulty: 'medium',
    category: 'exploration',
    hint: {
      en: 'Look beneath the wooden bridge between Spawn Plaza and Whispering Forest — a hidden ledge awaits!',
      ru: 'Загляни под деревянный мост между Площадью и Лесом — там притаился скрытый уступ с кристаллом!',
    },
    lore: {
      en: 'Everyone runs across the bridge, almost nobody checks underneath it.',
      ru: 'Все бегут по мосту, и почти никто не смотрит под него.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 46,
    title: { en: 'Search Secret', ru: 'Секрет в поиске' },
    difficulty: 'medium',
    category: 'meta',
    hint: {
      en: 'Open the Index and type the secret word "findme" into the search bar.',
      ru: 'Открой Index и впиши в строку поиска секретное английское слово «findme».',
    },
    lore: {
      en: 'Even the Index search bar hides little easter eggs.',
      ru: 'Даже строка поиска в Индексе хранит свои маленькие пасхалки.',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },

  // ===================== HARD (47 - 64) =====================
  {
    id: 47,
    title: { en: 'Graphics Protocol', ru: 'Протокол Графики' },
    difficulty: 'hard',
    category: 'settings',
    buildsStructure: 'lab_gpu_monolith',
    hint: {
      en: 'In Tech Lab, read the "GPU Protocol" monitor and click the Graphics levels in Settings in that exact order!',
      ru: 'В Техно-Лаборатории найди экран «GPU Protocol» и нажми уровни Графики в Настройках строго в указанном порядке!',
    },
    lore: {
      en: '1 → 5 → 2 → 4 → 3: the universe’s graphics driver has been hacked.',
      ru: '1 → 5 → 2 → 4 → 3: видеодрайвер вселенной взломан.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 48,
    title: { en: 'Rainbow Order', ru: 'Порядок Радуги' },
    difficulty: 'hard',
    category: 'sequence',
    buildsStructure: 'forest_rainbow_arch',
    hint: {
      en: 'Activate the 5 colorful pillars in Forest (built by #24) in true rainbow order (clue inside Library).',
      ru: 'Активируй 5 цветных столбов в Лесу (строятся за #24) в правильном порядке радуги (подсказка в Библиотеке).',
    },
    lore: {
      en: 'Red, Orange, Yellow, Green, Blue — spectral harmony restored.',
      ru: 'Красный, Оранжевый, Жёлтый, Зелёный, Синий — гармония спектра восстановлена.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 49,
    title: { en: 'Morse Beacon', ru: 'Маяк Морзе' },
    difficulty: 'hard',
    category: 'cipher',
    hint: {
      en: 'On Sky Observatory, decode the blinking Morse beacon ("... - .- .-.") and enter /word in chat.',
      ru: 'На Небесном Острове расшифруй сигнал Морзе у маяка («... - .- .-.») и введи ответ как /команду в чат.',
    },
    lore: {
      en: 'The starlight beacon answered your /star signal.',
      ru: 'Звёздный маяк услышал твой сигнал /star.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 50,
    title: { en: 'Atbash Relic', ru: 'Реликвия Атбаш' },
    difficulty: 'hard',
    category: 'cipher',
    hint: {
      en: 'In the Library, an Atbash tablet (A↔Z, B↔Y) reads "NLLM". Decode it and say the word in chat.',
      ru: 'В Библиотеке лежит плита Атбаш (A↔Z, B↔Y): «NLLM». Расшифруй слово и напиши его в чат.',
    },
    lore: {
      en: 'The ancient mirror of the alphabet revealed moonlight (MOON).',
      ru: 'Древнее зеркало алфавита показало лунный свет (MOON).',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 51,
    title: { en: 'Beneath the World', ru: 'Изнанка Острова' },
    difficulty: 'hard',
    category: 'camera',
    hint: {
      en: 'Zoom out to max at the edge of Spawn Plaza (after #13) and angle the camera UNDER the island! Type the command written below.',
      ru: 'Отдали камеру на максимум у края Площади (после #13) и загляни ПОД дно острова! Введи найденную команду.',
    },
    lore: {
      en: 'Beneath your feet it always read /underworld.',
      ru: 'Под ногами всегда было написано /underworld.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 52,
    title: { en: 'Sky Dome Cipher', ru: 'Шифр Небесного Купола' },
    difficulty: 'hard',
    category: 'camera',
    hint: {
      en: 'Zoom out to max (after #13) and look straight up into the sky above Spawn Plaza. Enter the floating numbers as /numbers.',
      ru: 'Отдали камеру на максимум (после #13) и посмотри высоко в небо над центром мира. Введи числа как /числа в чат.',
    },
    lore: {
      en: 'The floating sky numbers /481516 resonated with a mysterious chime.',
      ru: 'Парящие в небе числа /481516 откликнулись таинственным звоном.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 53,
    title: { en: 'Microscopic Text', ru: 'Микро-текст' },
    difficulty: 'hard',
    category: 'camera',
    hint: {
      en: 'On the eastern Library shelves hides a tiny golden book spine. Read it in First Person (E) and enter /echo <word>.',
      ru: 'На восточных полках Библиотеки спрятан крошечный золотой корешок. Прочти его в First Person (E) и введи /echo <слово>.',
    },
    lore: {
      en: 'Only up close could anyone read "echoes".',
      ru: 'Только впритык можно было увидеть «echoes».',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },
  {
    id: 54,
    title: { en: 'ShiftLock Gauntlet', ru: 'Испытание ShiftLock' },
    difficulty: 'hard',
    category: 'parkour',
    hint: {
      en: 'Walk across the narrow east beam on Sky Observatory (built by #33) and touch the glowing orb with ShiftLock ON!',
      ru: 'Пройди узкую восточную балку на Небесном Острове (строится за #33) и коснись сферы с ВКЛЮЧЁННЫМ ShiftLock!',
    },
    lore: {
      en: 'Steady footing along a razor edge above the clouds.',
      ru: 'Уверенная поступь по тонкой грани над облаками.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 55,
    title: { en: 'Volcanic Crystals', ru: 'Вулканические кристаллы' },
    difficulty: 'hard',
    category: 'sequence',
    hint: {
      en: 'Activate the 4 crystals (I, II, III, IV) in Volcanic Cavern (built by #18) in the Roman numeral order carved nearby.',
      ru: 'Активируй 4 кристалла (I, II, III, IV) в Вулкане (строятся за #18) в римском порядке, выбитом рядом.',
    },
    lore: {
      en: 'III → I → IV → II: the magma beneath grew calm.',
      ru: 'III → I → IV → II: магма в недрах успокоилась.',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },
  {
    id: 56,
    title: { en: 'Base64 Terminal', ru: 'Терминал Base64' },
    difficulty: 'hard',
    category: 'cipher',
    hint: {
      en: 'Decode the Base64 string on the Tech Lab computer and enter /unlock <decoded> in chat.',
      ru: 'Расшифруй строку Base64 на компьютере в Техно-Лаборатории и введи /unlock <результат> в чат.',
    },
    lore: {
      en: 'c2VjcmV0X2xhYg== → secret_lab. Access granted!',
      ru: 'c2VjcmV0X2xhYg== → secret_lab. Доступ разрешён!',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },
  {
    id: 57,
    title: { en: 'Coordinate Cache', ru: 'Координатный клад' },
    difficulty: 'hard',
    category: 'exploration',
    hint: {
      en: 'A note in Forest points to X ≈ -30, Z ≈ 30 (enable Coords in Settings or use /pos). Stand there and type /cheer!',
      ru: 'Записка в Лесу зовёт к точке X ≈ -30, Z ≈ 30 (включи Координаты или /pos). Встань туда и введи /cheer!',
    },
    lore: {
      en: 'Precise navigation led straight to the buried cache.',
      ru: 'Точная навигация по координатам привела к зарытому кладу.',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },
  {
    id: 58,
    title: { en: 'Clockwork Code', ru: 'Код Часовщика' },
    difficulty: 'hard',
    category: 'time',
    hint: {
      en: 'Check [A]lmost every hand on the Clocktower dial carefully, then type /time HHMM in chat!',
      ru: 'Посмотри, [A]бсолютно точно какое время показывают стрелки Башни Часов. Введи /time ЧЧММ в чат!',
    },
    lore: {
      en: '03:45 — the hour when the hands froze forever.',
      ru: '03:45 — час, когда стрелки замерли навсегда.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 59,
    title: { en: 'Statue Stillness', ru: 'Каменная статуя' },
    difficulty: 'hard',
    category: 'time',
    hint: {
      en: 'Freeze like a stone statue: do not walk or jump for 30 seconds straight.',
      ru: 'Замри как изваяние: не двигайся и не прыгай ровно 30 секунд подряд.',
    },
    lore: {
      en: 'In a world of endless haste, stillness is a rare gift.',
      ru: 'В мире вечной спешки спокойствие — редкий дар.',
    },
    timeEstimate: { en: '30 sec', ru: '30 сек' },
  },
  {
    id: 60,
    title: { en: 'Zero-G Experiment', ru: 'Нулевая гравитация' },
    difficulty: 'hard',
    category: 'command',
    hint: {
      en: 'The whiteboard in Tech Lab lists an experimental gravity command. Try running it in chat!',
      ru: 'На доске в Лаборатории записана экспериментальная команда управления притяжением. Попробуй её в чате!',
    },
    lore: {
      en: '/gravity briefly broke the laws of physics beneath your boots.',
      ru: 'Команда /gravity на мгновение оторвала тебя от законов физики.',
    },
    timeEstimate: { en: '1.5 min', ru: '1.5 мин' },
  },
  {
    id: 61,
    title: { en: 'Nice Try!', ru: 'Хорошая попытка!' },
    difficulty: 'hard',
    category: 'command',
    hint: {
      en: 'What happens if you try to cheat by typing /fly or /noclip in chat?',
      ru: 'Что скажет система, если ты попробуешь считерить в чате командой /fly или /noclip?',
    },
    lore: {
      en: 'The anti-cheat chuckled at your boldness and gave a secret instead of a ban.',
      ru: 'Античит улыбнулся твоей смекалке и подарил секрет вместо бана.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 62,
    title: { en: 'Konami Legacy', ru: 'Наследие Конами' },
    difficulty: 'hard',
    category: 'meta',
    hint: {
      en: 'A gaming classic: press the legendary code on your keyboard: ↑ ↑ ↓ ↓ ← → ← → B A!',
      ru: 'Классика всех игр: нажми на клавиатуре легендарный код ↑ ↑ ↓ ↓ ← → ← → B A!',
    },
    lore: {
      en: 'No 30 extra lives, but it unlocked a secret immediately.',
      ru: '30 жизней не дало, но секрет открыло мгновенно.',
    },
    timeEstimate: { en: '1 min', ru: '1 мин' },
  },
  {
    id: 63,
    title: { en: 'Portal to the Void', ru: 'Портал в Бездну' },
    difficulty: 'hard',
    category: 'exploration',
    buildsStructure: 'void_extensions',
    hint: {
      en: 'Step through the purple portal behind the Forest Illusion Wall (built by #25) — builds the Void Bridge & Black Obby!',
      ru: 'Войди в фиолетовый портал за фальшивой стеной Леса (строится за #25) — построит Невидимый Мост и Чёрный Обби!',
    },
    lore: {
      en: 'Beyond the ordinary islands drifts a distorted dimension.',
      ru: 'За гранью обычных островов парит искажённое измерение.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 64,
    title: { en: 'Number Alphabet', ru: 'Числовой алфавит' },
    difficulty: 'hard',
    category: 'cipher',
    hint: {
      en: 'On Glitch Void Island a tablet reads "22-15-9-4" (A=1..Z=26). Decode and enter /word while on Void Island!',
      ru: 'На Острове Бездны выбиты числа «22-15-9-4» (A=1..Z=26). Расшифруй и введи /слово прямо на Острове Бездны!',
    },
    lore: {
      en: '22(V)-15(O)-9(I)-4(D) — the Void answered to its own name (/void).',
      ru: '22(V)-15(O)-9(I)-4(D) — Бездна откликнулась на своё имя (/void).',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },

  // ===================== AMAZING (65 - 79) =====================
  {
    id: 65,
    title: { en: 'Chameleon Path', ru: 'Путь Хамелеона' },
    difficulty: 'amazing',
    category: 'sequence',
    buildsStructure: 'plaza_flame_crown',
    hint: {
      en: 'Light 5 torches across 5 zones in the exact order hidden in the Library poem!',
      ru: 'Зажги 5 факелов в 5 зонах в строгом порядке, зашифрованном акростихом в Библиотеке!',
    },
    lore: {
      en: 'Plaza → Forest → Library → Lab → Volcano: five flames united the world.',
      ru: 'Площадь → Лес → Библиотека → Лаборатория → Вулкан: пламя соединило мир.',
    },
    timeEstimate: { en: '4 min', ru: '4 мин' },
  },
  {
    id: 66,
    title: { en: 'Precision Calibration', ru: 'Ювелирная настройка' },
    difficulty: 'amazing',
    category: 'settings',
    hint: {
      en: 'In Tech Lab, inspect the hidden blueprint in First Person with Graphics ≥ 4. Set those exact Sensitivity & FOV values in Settings!',
      ru: 'В Лаборатории при Графике ≥ 4 в режиме First Person осмотри скрытый чертёж. Выстави точные Чувствительность и FOV в Настройках!',
    },
    lore: {
      en: 'Sensitivity 1.35 and FOV 77° — razor-sharp optical calibration.',
      ru: 'Чувствительность 1.35 и FOV 77° — идеальная калибровка оптики.',
    },
    timeEstimate: { en: '3.5 min', ru: '3.5 мин' },
  },
  {
    id: 67,
    title: { en: 'Triple Perspective', ru: 'Тройная перспектива' },
    difficulty: 'amazing',
    category: 'camera',
    hint: {
      en: 'Stand inside the center ring on Glitch Void Island and within 10s do in order: 1) First Person, 2) ShiftLock ON, 3) Max Zoom Out!',
      ru: 'Встань в центр рунного круга на Острове Бездны и за 10 секунд сделай по порядку: 1) First Person, 2) ShiftLock ВКЛ, 3) Макс. зум-аут!',
    },
    lore: {
      en: 'Three ways of seeing reality converged into a single resonance.',
      ru: 'Три взгляда на реальность слились в единый резонанс.',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },
  {
    id: 68,
    title: { en: 'Oracle Dialogue', ru: 'Диалог с Оракулом' },
    difficulty: 'amazing',
    category: 'cipher',
    hint: {
      en: 'At the Ancient Oracle on Sky Island, decode Caesar (+5): "XJHWJY ZSNAJWXJ". Say the decoded phrase in chat while on Sky Island!',
      ru: 'У Древнего Оракула на Небесном Острове шифр Цезаря (+5): «XJHWJY ZSNAJWXJ». Произнеси расшифрованную фразу на Небесном Острове!',
    },
    lore: {
      en: '"SECRET UNIVERSE" — the Oracle judged you worthy.',
      ru: '«SECRET UNIVERSE» — Оракул признал тебя достойным.',
    },
    timeEstimate: { en: '3.5 min', ru: '3.5 мин' },
  },
  {
    id: 69,
    title: { en: 'Invisible Bridge', ru: 'Невидимый мост' },
    difficulty: 'amazing',
    category: 'parkour',
    hint: {
      en: 'North of Glitch Void Island (after #63) stretches an invisible path. Turn Graphics to 5 (Ultra) to see faint sparkles and reach the Phantom Sphere!',
      ru: 'На север от Острова Бездны (после #63) тянется невидимый путь. Включи Графику 5 (Ультра), чтобы увидеть искры, и дойди до Сферы!',
    },
    lore: {
      en: 'Only faith and Ultra graphics carried you over the abyss.',
      ru: 'Лишь вера и Ультра-графика удержали тебя над пропастью.',
    },
    timeEstimate: { en: '3.5 min', ru: '3.5 мин' },
  },
  {
    id: 70,
    title: { en: 'Double Layer Cipher', ru: 'Матрёшка-шифр' },
    difficulty: 'amazing',
    category: 'cipher',
    hint: {
      en: 'Library note "=02cpJHc": first reverse the string, then Base64-decode it, and type /result in chat.',
      ru: 'Записка в Библиотеке «=02cpJHc»: сперва переверни строку, затем декодируй Base64, и введи /результат в чат.',
    },
    lore: {
      en: '=02cpJHc → cHJpc20= → /prism. Dual encryption cracked!',
      ru: '=02cpJHc → cHJpc20= → /prism. Двойная защита взломана!',
    },
    timeEstimate: { en: '4 min', ru: '4 мин' },
  },
  {
    id: 71,
    title: { en: 'Emote Chain', ru: 'Цепочка эмоций' },
    difficulty: 'amazing',
    category: 'sequence',
    hint: {
      en: 'Inside the Plaza Pavilion, a plaque lists 4 emotes in order. Perform all 4 via chat commands within 20 seconds!',
      ru: 'На табличке в беседке на Площади указаны 4 эмоции по порядку. Выполни их все командами в чате за 20 секунд!',
    },
    lore: {
      en: '/wave → /dance → /cheer → /sit: a flawless performance!',
      ru: '/wave → /dance → /cheer → /sit: безупречное выступление!',
    },
    timeEstimate: { en: '2.5 min', ru: '2.5 мин' },
  },
  {
    id: 72,
    title: { en: 'Pixel Hunter', ru: 'Охотник на пиксели' },
    difficulty: 'amazing',
    category: 'meta',
    hint: {
      en: 'Open Pause → Settings and look closely at the very bottom-right corner of the window. Click the tiny hidden π symbol!',
      ru: 'Открой Пауза → Настройки и внимательно присмотрись к правому нижнему углу окна. Нажми крошечный символ π!',
    },
    lore: {
      en: '3.14159... Not a single hidden pixel escaped your eyes.',
      ru: '3.14159... Ни один тайный пиксель не ускользнул от тебя.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 73,
    title: { en: 'Index Counter Secret', ru: 'Секрет заголовка Индекса' },
    difficulty: 'amazing',
    category: 'meta',
    hint: {
      en: 'Inside the Index window, click the found-secrets counter pill (X / 100) 7 times in a row! [Y]ou will be surprised.',
      ru: 'В окне Index нажми на счётчик найденных секретов (X / 100) ровно 7 раз подряд! [Y]дивительно, правда?',
    },
    lore: {
      en: 'Persistent knocking unlocked a hidden latch inside the Index book.',
      ru: 'Настойчивый стук открыл потайной замок самой книги Индекса.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 74,
    title: { en: 'Chrono Ritual', ru: 'Хроно-ритуал' },
    difficulty: 'amazing',
    category: 'time',
    hint: {
      en: 'Climb to the top of the Clocktower and stand on the golden Time Altar for 45 seconds without stepping off.',
      ru: 'Заберись на вершину Башни Часов и продержись на Алтаре Времени 45 секунд, не сходя с него.',
    },
    lore: {
      en: 'Forty-five heartbeats — and time bowed before you.',
      ru: 'Сорок пять ударов сердца — и время поклонилось тебе.',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },
  {
    id: 75,
    title: { en: 'Flicker of Shadow', ru: 'Мерцание Тени' },
    difficulty: 'amazing',
    category: 'settings',
    hint: {
      en: 'While inside Volcanic Cavern, toggle Graphics in Settings strictly as: 1 → 5 → 1 → 5 → 1 to awaken the Shadow Altar!',
      ru: 'Находясь в Вулканической Пещере, переключи Графику в Настройках точно так: 1 → 5 → 1 → 5 → 1, чтобы пробудить Теневой Алтарь!',
    },
    lore: {
      en: 'Light and shadow flickered until the volcano yielded its secret.',
      ru: 'Свет и тьма сменяли друг друга, пока тень вулкана не открыла секрет.',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },
  {
    id: 76,
    title: { en: 'Four Colored Tomes', ru: 'Тайна четырёх томов' },
    difficulty: 'amazing',
    category: 'sequence',
    hint: {
      en: 'Find 4 colored books at different shelf heights in the Library. Combine their codes BOTTOM TO TOP and enter /tome CODE.',
      ru: 'В Библиотеке найди 4 цветных тома на разных высотах полок. Сложи их коды СНИЗУ ВВЕРХ и введи /tome КОД в чат.',
    },
    lore: {
      en: 'K9 + A7 + M4 + X2 → /tome K9A7M4X2. Ancient volume decoded!',
      ru: 'K9 + A7 + M4 + X2 → /tome K9A7M4X2. Древний том расшифрован!',
    },
    timeEstimate: { en: '4 min', ru: '4 мин' },
  },
  {
    id: 77,
    title: { en: 'Leap of Faith', ru: 'Прыжок веры' },
    difficulty: 'amazing',
    category: 'parkour',
    hint: {
      en: 'Use the southwest diving board on Sky Observatory to leap 24 meters straight down into the Spawn Plaza Fountain!',
      ru: 'Найди трамплин на юго-западном краю Небесного Острова и спрыгни с высоты 24м прямо в воду Фонтана на Площади!',
    },
    lore: {
      en: 'Twenty-four meters of freefall and a bullseye splashdown!',
      ru: 'Двадцать четыре метра свободного падения и идеальное приводнение!',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },
  {
    id: 78,
    title: { en: 'Abyssal Echo', ru: 'Эхо Бездны' },
    difficulty: 'amazing',
    category: 'exploration',
    hint: {
      en: 'Fall into the void 5 times — on your fifth fall, the Abyss will whisper a secret word in chat. Repeat it in chat!',
      ru: 'Упади в бездну 5 раз — после пятого падения Бездна прошепчет тебе в чат тайное слово. Повтори его в чате!',
    },
    lore: {
      en: 'One who gazed into the abyss five times heard "nullvoid".',
      ru: 'Тот, кто пять раз заглянул в пропасть, услышал «nullvoid».',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },
  {
    id: 79,
    title: { en: 'Backwards ShiftLock', ru: 'Задом наперёд' },
    difficulty: 'amazing',
    category: 'parkour',
    hint: {
      en: 'On the south terrace of Tech Lab, walk from the green pad to the purple pad walking BACKWARDS (S key) with ShiftLock ON!',
      ru: 'На южной террасе Лаборатории пройди полосу от зелёной плиты до фиолетовой, идя СПИНОЙ ВПЕРЁД (S) со включённым ShiftLock!',
    },
    lore: {
      en: 'Flawless coordination without looking behind!',
      ru: 'Безупречная координация вслепую!',
    },
    timeEstimate: { en: '3 min', ru: '3 мин' },
  },

  // ===================== OKAY? (80 - 91) =====================
  {
    id: 80,
    title: { en: 'Vigenère Vault', ru: 'Хранилище Виженера' },
    difficulty: 'okay',
    category: 'cipher',
    hint: {
      en: 'In eastern Tech Lab hides Vigenère ciphertext "ERGFIPCI". Find the 3-letter micro-key nearby (First Person) and enter /vigenere <word>.',
      ru: 'В восточном отсеке Лаборатории спрятан шифр Виженера «ERGFIPCI». Ключ (3 буквы) скрыт рядом в First Person. Введи /vigenere <ответ>.',
    },
    lore: {
      en: 'Key KEY turned ERGFIPCI into UNIVERSE. True cryptographer!',
      ru: 'Ключ KEY превратил ERGFIPCI в UNIVERSE. Истинный криптограф!',
    },
    timeEstimate: { en: '6 min', ru: '6 мин' },
  },
  {
    id: 81,
    title: { en: 'Elemental Order', ru: 'Великий порядок стихий' },
    difficulty: 'okay',
    category: 'sequence',
    buildsStructure: 'fountain_elemental_orbit',
    hint: {
      en: 'Across the 6 main zones stand 6 Elemental Altars labeled #1 through #6. Activate all 6 in strict order without a mistake!',
      ru: 'В 6 главных зонах стоят 6 Алтарей Стихий с номерами #1..#6. Активируй все 6 строго по порядку без ошибок!',
    },
    lore: {
      en: 'Fire → Water → Earth → Cosmos → Tech → Knowledge: cosmic balance!',
      ru: 'Огонь → Вода → Земля → Космос → Технология → Знание: баланс вселенной!',
    },
    timeEstimate: { en: '7 min', ru: '7 мин' },
  },
  {
    id: 82,
    title: { en: 'Omega Matrix', ru: 'Матрица Омега' },
    difficulty: 'okay',
    category: 'settings',
    hint: {
      en: 'Find the "Omega Protocol" terminal on Void Island, set ALL 6 listed Settings simultaneously, and type /omega in chat.',
      ru: 'Найди терминал «Протокол Омега» на Острове Бездны, выстави одновременно ВСЕ 6 параметров в Настройках и введи /omega.',
    },
    lore: {
      en: 'Graphics 3, FOV 90, Sens 1.00, Music 0%, Coords ON, ShiftLock ON — matrix synced!',
      ru: 'Графика 3, FOV 90, Sens 1.00, Музыка 0%, Координаты ВКЛ, ShiftLock ВКЛ — матрица синхронизирована!',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },
  {
    id: 83,
    title: { en: 'Grand Tour Speedrun', ru: 'Спидран по мирам' },
    difficulty: 'okay',
    category: 'time',
    hint: {
      en: 'Type /race in chat and visit all 6 main zones (Plaza, Forest, Library, Lab, Volcano, Sky Island) in under 90 seconds!',
      ru: 'Введи /race в чате и успей посетить все 6 главных зон (Площадь, Лес, Библиотека, Лаборатория, Вулкан, Небесный Остров) за 90 секунд!',
    },
    lore: {
      en: 'A lightning-fast sprint across the entire Secret Universe!',
      ru: 'Молниеносный забег по всей Secret Universe!',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },
  {
    id: 84,
    title: { en: 'Symphony of Silence', ru: 'Симфония Тишины' },
    difficulty: 'okay',
    category: 'settings',
    hint: {
      en: 'Set SFX and Music to 0%, climb to the top Observatory deck, enter First Person, and type "..." in chat.',
      ru: 'Выключи звук и музыку в 0%, поднимись на верхнюю площадку Обсерватории, войди в First Person и напиши «...» в чат.',
    },
    lore: {
      en: 'In total silence among the stars, the cosmos whispers back.',
      ru: 'В абсолютной тишине среди звёзд слышен шёпот космоса.',
    },
    timeEstimate: { en: '4 min', ru: '4 мин' },
  },
  {
    id: 85,
    title: { en: 'Index Detective', ru: 'Детектив Индекса' },
    difficulty: 'okay',
    category: 'meta',
    hint: {
      en: 'Read other secret hints in the Index carefully! Four of them hide letters in [square brackets]. Combine them in ascending ID order and type /word? in chat.',
      ru: 'Внимательно читай подсказки других секретов в Index! В четырёх из них спрятаны буквы в [квадратных скобках]. Собери их по возрастанию ID и введи /слово? в чат.',
    },
    lore: {
      en: '[O] (#17) + [K] (#35) + [A] (#58) + [Y] (#73) → /okay? Brilliant!',
      ru: '[O] (#17) + [K] (#35) + [A] (#58) + [Y] (#73) → /okay? Гениально!',
    },
    timeEstimate: { en: '6 min', ru: '6 мин' },
  },
  {
    id: 86,
    title: { en: 'Camera X-Ray', ru: 'Камера-рентген' },
    difficulty: 'okay',
    category: 'camera',
    hint: {
      en: 'Beneath northern Spawn Plaza (after #13) sits a sealed room with NO door. Zoom out and angle your camera underground to read the neon code inside, then type it in chat!',
      ru: 'Под северным краем Площади (после #13) замурована комната БЕЗ двери. Отдали камеру и загляни под землю, чтобы прочесть неоновый код, и напиши его в чат!',
    },
    lore: {
      en: 'Your camera peered through solid stone to spot XRAY99.',
      ru: 'Камера сквозь камень разглядела секретный код XRAY99.',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },
  {
    id: 87,
    title: { en: 'Clock Paradox', ru: 'Парадокс Времени' },
    difficulty: 'okay',
    category: 'sequence',
    hint: {
      en: 'Find 3 Time Levers (Past in Forest, Present by Clocktower, Future in Lab) and pull them in REVERSE order (Future → Present → Past) within 45 seconds!',
      ru: 'Найди 3 Рычага Времени (Прошлое в Лесу, Настоящее у Башни, Будущее в Лаборатории) и дёрни их в ОБРАТНОМ порядке (Будущее → Настоящее → Прошлое) за 45 секунд!',
    },
    lore: {
      en: 'The river of time briefly flowed backwards.',
      ru: 'Река времени на мгновение потекла вспять.',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },
  {
    id: 88,
    title: { en: 'Sky Glitch Cube', ru: 'Глитч-куб в небе' },
    difficulty: 'okay',
    category: 'camera',
    hint: {
      en: 'On Observatory Peak (after #33) is a purple bounce pad. Set Graphics = 1 AND Max Zoom Out to materialize the secret floating glitch cube!',
      ru: 'На вершине Обсерватории (после #33) есть фиолетовый батут. Включи Графику 1 И максимальный зум-аут — только тогда проявится Глитч-Кристалл!',
    },
    lore: {
      en: 'A bug in the matrix? No — an intentional miracle.',
      ru: 'Баг матрицы? Нет — намеренно спрятанное чудо.',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },
  {
    id: 89,
    title: { en: 'Constellation Cipher', ru: 'Созвездие Шифров' },
    difficulty: 'okay',
    category: 'camera',
    hint: {
      en: 'Walk up to the Telescope on Observatory Peak, switch to First Person, and peer through (E) to read the star name. Type /name in chat.',
      ru: 'Подойди к Телескопу на вершине Обсерватории, войди в First Person и посмотри в окуляр (E), чтобы прочесть имя созвездия. Введи /имя в чат.',
    },
    lore: {
      en: 'Five bright stars spelled out /astra.',
      ru: 'Пять звёзд сложились в /astra.',
    },
    timeEstimate: { en: '4 min', ru: '4 мин' },
  },
  {
    id: 90,
    title: { en: "Monk's Patience", ru: 'Терпение Монаха' },
    difficulty: 'okay',
    category: 'time',
    hint: {
      en: 'Stand in the purple meditation ring inside Forest Ruins, sit down (/sit), and remain completely still for 60 seconds.',
      ru: 'Встань в центр фиолетового круга Лесных Руин, сядь (/sit) и просиди абсолютно неподвижно 60 секунд.',
    },
    lore: {
      en: 'One minute of meditation — and ancient stones opened their heart.',
      ru: 'Минута медитации — и древние камни открыли своё сердце.',
    },
    timeEstimate: { en: '2 min', ru: '2 мин' },
  },
  {
    id: 91,
    title: { en: 'Mirror of Truth', ru: 'Зеркало Истины' },
    difficulty: 'okay',
    category: 'camera',
    hint: {
      en: 'Stand right before the Mirror on Void Island in First Person, type "esrevinu" (universe backwards) in chat, then immediately zoom out to maximum!',
      ru: 'Подойди вплотную к Зеркалу на Острове Бездны в First Person, напиши «esrevinu» (universe наоборот) в чат и сразу отдали камеру на максимум!',
    },
    lore: {
      en: 'Your reflection stepped forward from another world.',
      ru: 'Отражение сделало шаг навстречу из другого мира.',
    },
    timeEstimate: { en: '5 min', ru: '5 мин' },
  },

  // ===================== BEST (92 - 100) =====================
  {
    id: 92,
    title: { en: 'Master Graphics Code', ru: 'Мастер Графического Кода' },
    difficulty: 'best',
    category: 'settings',
    hint: {
      en: 'Find 3 fragments of an 8-step Graphics sequence (Under Spawn Plaza, Void Island Keyhole, Clocktower Peak) and click all 8 levels in Settings without a single mistake!',
      ru: 'Собери 3 фрагмента 8-шагового кода Графики (Под дном Площади, Замочная скважина Бездны, вершина Башни Часов) и введи всю цепочку в Настройках без ошибок!',
    },
    lore: {
      en: '5 → 1 → 4 → 2 → 3 → 5 → 3 → 1: total mastery over the engine of reality.',
      ru: '5 → 1 → 4 → 2 → 3 → 5 → 3 → 1: абсолютный контроль над движком реальности.',
    },
    timeEstimate: { en: '10 min', ru: '10 мин' },
  },
  {
    id: 93,
    title: { en: 'Quad Layer Cipher', ru: 'Четырёхслойный Шифр' },
    difficulty: 'best',
    category: 'cipher',
    hint: {
      en: 'On Void Island: "-.-- ..-. --.- -...". Peel 3 layers back: Morse → Caesar(-1) → Reverse, then type /quad <answer> in chat!',
      ru: 'На Острове Бездны: «-.-- ..-. --.- -...». Сними 3 слоя: Морзе → Цезарь(-1) → Реверс, затем введи /quad <ответ> в чат!',
    },
    lore: {
      en: 'Morse → YFQB → XEPA → APEX (/quad apex). Master-level cryptanalysis!',
      ru: 'Морзе → YFQB → XEPA → APEX (/quad apex). Высший пилотаж дешифровки!',
    },
    timeEstimate: { en: '10 min', ru: '10 мин' },
  },
  {
    id: 94,
    title: { en: 'Ritual of Seven Seals', ru: 'Ритуал Семи Печатей' },
    difficulty: 'best',
    category: 'sequence',
    hint: {
      en: 'Complete 7 steps in strict order: 1) Enter Fountain → 2) ShiftLock ON → 3) Press Red Button → 4) Graphics = 5 → 5) Say "ignis" in Library → 6) Touch Fire Altar in Volcano → 7) Type /seal on Sky Island.',
      ru: 'Выполни 7 шагов строго по порядку: 1) Зайди в Фонтан → 2) Включи ShiftLock → 3) Красная кнопка → 4) Графика = 5 → 5) В Библиотеке напиши «ignis» → 6) Алтарь Огня в Вулкане → 7) На Обсерватории введи /seal.',
    },
    lore: {
      en: 'Seven ancient seals fell one by one. The grand ritual is complete!',
      ru: 'Семь древних печатей пали одна за другой. Грандиозный ритуал завершён!',
    },
    timeEstimate: { en: '12 min', ru: '12 мин' },
  },
  {
    id: 95,
    title: { en: 'The Black Obby', ru: 'Чёрный Обби Абсолюта' },
    difficulty: 'best',
    category: 'parkour',
    buildsStructure: 'void_victory_spires',
    hint: {
      en: 'East of Glitch Void Island (after #63) rise tiny black-and-gold platforms. Conquer this fierce parkour (ShiftLock recommended!) to touch the Black Obelisk!',
      ru: 'От восточного края Острова Бездны (после #63) вверх уходят чёрно-золотые мини-платформы. Пройди паркур до Чёрного Обелиска!',
    },
    lore: {
      en: 'Few reach the summit of The Black Obby — and you did.',
      ru: 'Не каждый дойдёт до вершины Чёрного Обби, но ты справился.',
    },
    timeEstimate: { en: '10 min', ru: '10 мин' },
  },
  {
    id: 96,
    title: { en: 'Halfway Legend', ru: 'Легенда Половины' },
    difficulty: 'best',
    category: 'meta',
    hint: {
      en: 'Prove your dedication: unlock any 50 secrets in Secret Universe!',
      ru: 'Докажи своё упорство: открой 50 любых секретов в Secret Universe!',
    },
    lore: {
      en: 'Halfway there! Fifty mysteries of the universe already shine in your Index.',
      ru: 'Экватор пройден! Половина тайн вселенной уже в твоём Индексе.',
    },
    timeEstimate: { en: '25 min', ru: '25 мин' },
  },
  {
    id: 97,
    title: { en: '90% Ascendant', ru: 'Почти Всемогущий' },
    difficulty: 'best',
    category: 'meta',
    hint: {
      en: 'Collect 90 out of 100 secrets — total mastery is within reach!',
      ru: 'Собери 90 секретов из 100 — до полного покорения вселенной остаётся совсем чуть-чуть!',
    },
    lore: {
      en: 'Ninety triumphs. The universe itself holds its breath.',
      ru: 'Девяносто побед. Сама вселенная затаила дыхание.',
    },
    timeEstimate: { en: '45 min', ru: '45 мин' },
  },
  {
    id: 98,
    title: { en: 'The Architect', ru: 'Секретный Архитектор' },
    difficulty: 'best',
    category: 'meta',
    hint: {
      en: 'UI Meta-ritual: 1) Open Index, select #1 "Welcome!", click its difficulty badge 3 times → 2) Open Pause → Settings, click the "SETTINGS" tab label 3 times → 3) Type /architect in chat!',
      ru: 'Мета-ритуал интерфейса: 1) В Index открой #1 «Welcome!» и кликни по значку сложности 3 раза → 2) В Паузе кликни по вкладке «НАСТРОЙКИ» 3 раза → 3) Введи /architect в чат!',
    },
    lore: {
      en: 'You peeked behind the UI curtain and shook hands with the Architect.',
      ru: 'Ты заглянул за кулисы самого интерфейса и пожал руку Архитектору.',
    },
    timeEstimate: { en: '8 min', ru: '8 мин' },
  },
  {
    id: 99,
    title: { en: 'Chronicle of Eternity', ru: 'Хроника Вечности' },
    difficulty: 'best',
    category: 'exploration',
    hint: {
      en: 'In one session collect 3 Ancient Relics (behind Volcano illusion wall, bottom of Forest well, distant cloud past Sky Island), stand before the Founder Statue in First Person, and type /eternity!',
      ru: 'За одну сессию собери 3 Древние Реликвии (за скрытой стеной Вулкана, на дне колодца Леса и на дальнем облаке за Небесным Островом), встань у Статуи Основателя в First Person и введи /eternity!',
    },
    lore: {
      en: 'Three relics merged in your hands, awakening the breath of eternity.',
      ru: 'Три реликвии соединились в руках искателя, открыв дыхание вечности.',
    },
    timeEstimate: { en: '15 min', ru: '15 мин' },
  },
  {
    id: 100,
    title: { en: 'SECRET UNIVERSE', ru: 'SECRET UNIVERSE' },
    difficulty: 'best',
    category: 'meta',
    buildsStructure: 'celestial_crown_temple',
    hint: {
      en: 'Unlock ALL other 99 secrets, then stand beneath the golden beam on Spawn Plaza and type /universe (or interact with the pedestal)!',
      ru: 'Найди ВСЕ остальные 99 секретов, затем встань под золотой луч на Площади Спавна и введи /universe (или активируй пьедестал)!',
    },
    lore: {
      en: '100 / 100. You uncovered every mystery and built the entire Secret Universe!',
      ru: '100 / 100. Ты раскрыл каждую тайну и построил всю Secret Universe!',
    },
    timeEstimate: { en: '60+ min', ru: '60+ мин' },
  },
];

export const SECRETS_BY_ID: Record<number, SecretDef> = Object.fromEntries(
  SECRETS.map((s) => [s.id, s])
);

export const SECRET_TO_STRUCTURE: Record<number, string> = Object.fromEntries(
  SECRETS.filter((s) => s.buildsStructure).map((s) => [s.id, s.buildsStructure!])
);
