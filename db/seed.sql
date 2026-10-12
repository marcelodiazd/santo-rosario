-- Santo Rosario seed data. Prayer text and order follow
-- https://www.elsantorosario.es/como-rezar-el-rosario/ (Radio María España).
-- Edit this file to fix wording; scripts/build-db.mjs rebuilds public/rosario.sqlite.

-- Prayers
INSERT INTO prayers (id, title, body) VALUES
('senal', 'Señal de la Cruz',
'Por la señal de la Santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro.
En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.'),

('contricion', 'Acto de contrición',
'Señor mío Jesucristo, Dios y hombre verdadero, Creador, Padre y Redentor mío. Por ser Tú quien eres, Bondad infinita, y porque te amo sobre todas las cosas, me pesa de todo corazón haberte ofendido. También me pesa porque puedes castigarme con las penas del infierno. Ayudado de tu divina gracia, propongo firmemente nunca más pecar, confesarme y cumplir la penitencia que me fuere impuesta. Amén.'),

('invocaciones', 'Invocaciones iniciales',
'Señor, ábreme los labios.
R/ Y mi boca proclamará tu alabanza.

Dios mío, ven en mi auxilio.
R/ Señor, date prisa en socorrerme.

Gloria al Padre, y al Hijo, y al Espíritu Santo.
R/ Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.'),

('credo', 'Credo',
'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.'),

('padrenuestro', 'Padrenuestro',
'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo.
Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.'),

('avemaria', 'Avemaría',
'Dios te salve, María, llena eres de gracia; el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.
Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.'),

('gloria', 'Gloria',
'Gloria al Padre, y al Hijo, y al Espíritu Santo.
Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.'),

('maria_madre', 'María, Madre de gracia',
'María, Madre de gracia, Madre de misericordia,
defiéndenos de nuestros enemigos y ampáranos ahora y en la hora de nuestra muerte. Amén.'),

('oh_jesus', 'Oh, Jesús mío',
'Oh Jesús mío, perdónanos, líbranos del fuego del infierno, lleva a todas las almas al cielo, especialmente a las más necesitadas.'),

('letanias', 'Letanías de la Santísima Virgen',
'Señor, ten piedad. | Señor, ten piedad.
Cristo, ten piedad. | Cristo, ten piedad.
Señor, ten piedad. | Señor, ten piedad.
Cristo, óyenos. | Cristo, óyenos.
Cristo, escúchanos. | Cristo, escúchanos.

Dios, Padre celestial, | ten misericordia de nosotros.
Dios Hijo, Redentor del mundo, | ten misericordia de nosotros.
Dios Espíritu Santo, | ten misericordia de nosotros.
Trinidad Santa, un solo Dios, | ten misericordia de nosotros.

Santa María, | ruega por nosotros.
Santa Madre de Dios, | ruega por nosotros.
Santa Virgen de las vírgenes, | ruega por nosotros.
Madre de Cristo, | ruega por nosotros.
Madre de la Iglesia, | ruega por nosotros.
Madre de la misericordia, | ruega por nosotros.
Madre de la divina gracia, | ruega por nosotros.
Madre de la esperanza, | ruega por nosotros.
Madre purísima, | ruega por nosotros.
Madre castísima, | ruega por nosotros.
Madre siempre virgen, | ruega por nosotros.
Madre inmaculada, | ruega por nosotros.
Madre amable, | ruega por nosotros.
Madre admirable, | ruega por nosotros.
Madre del buen consejo, | ruega por nosotros.
Madre del Creador, | ruega por nosotros.
Madre del Salvador, | ruega por nosotros.
Virgen prudentísima, | ruega por nosotros.
Virgen digna de veneración, | ruega por nosotros.
Virgen digna de alabanza, | ruega por nosotros.
Virgen poderosa, | ruega por nosotros.
Virgen clemente, | ruega por nosotros.
Virgen fiel, | ruega por nosotros.
Espejo de justicia, | ruega por nosotros.
Trono de la sabiduría, | ruega por nosotros.
Causa de nuestra alegría, | ruega por nosotros.
Vaso espiritual, | ruega por nosotros.
Vaso digno de honor, | ruega por nosotros.
Vaso insigne de devoción, | ruega por nosotros.
Rosa mística, | ruega por nosotros.
Torre de David, | ruega por nosotros.
Torre de marfil, | ruega por nosotros.
Casa de oro, | ruega por nosotros.
Arca de la Alianza, | ruega por nosotros.
Puerta del cielo, | ruega por nosotros.
Estrella de la mañana, | ruega por nosotros.
Salud de los enfermos, | ruega por nosotros.
Refugio de los pecadores, | ruega por nosotros.
Consuelo de los migrantes, | ruega por nosotros.
Consoladora de los afligidos, | ruega por nosotros.
Auxilio de los cristianos, | ruega por nosotros.
Reina de los Ángeles, | ruega por nosotros.
Reina de los Patriarcas, | ruega por nosotros.
Reina de los Profetas, | ruega por nosotros.
Reina de los Apóstoles, | ruega por nosotros.
Reina de los Mártires, | ruega por nosotros.
Reina de los Confesores, | ruega por nosotros.
Reina de las Vírgenes, | ruega por nosotros.
Reina de todos los Santos, | ruega por nosotros.
Reina concebida sin pecado original, | ruega por nosotros.
Reina asunta a los Cielos, | ruega por nosotros.
Reina del Santo Rosario, | ruega por nosotros.
Reina de la familia, | ruega por nosotros.
Reina de la paz, | ruega por nosotros.'),

('cordero', 'Cordero de Dios',
'Cordero de Dios, que quitas el pecado del mundo. | Perdónanos, Señor.
Cordero de Dios, que quitas el pecado del mundo. | Escúchanos, Señor.
Cordero de Dios, que quitas el pecado del mundo. | Ten piedad de nosotros.

Ruega por nosotros, Santa Madre de Dios.
R/ Para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.'),

('oracion', 'Oración',
'Te pedimos, Señor, nos concedas a nosotros, tus siervos, gozar de perpetua salud de alma y cuerpo, y por la gloriosa intercesión de la bienaventurada siempre Virgen María, seamos librados de las tristezas presentes y gocemos de la eterna alegría. Por Jesucristo, nuestro Señor. Amén.'),

('salve', 'Salve',
'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A Ti llamamos los desterrados hijos de Eva; a Ti suspiramos, gimiendo y llorando, en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María!

Ruega por nosotros, Santa Madre de Dios.
R/ Para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.'),

('jaculatoria', 'Jaculatoria final',
'Ave María Purísima.
R/ Sin pecado concebida.');

-- Prayers said in two halves when praying in a group: the leader says the
-- first line and everyone answers from response_line. Read-aloud uses this to
-- leave a pause for the response.
UPDATE prayers SET response_line = 2 WHERE id IN ('padrenuestro', 'avemaria', 'gloria');

-- Mysteries. Weekdays use Date.getDay(): 0 = domingo ... 6 = sábado.
INSERT INTO mystery_sets (id, name, weekdays, sort_order) VALUES
('gozosos',   'Misterios gozosos',   '1,6', 1),
('dolorosos', 'Misterios dolorosos', '2,5', 2),
('gloriosos', 'Misterios gloriosos', '0,3', 3),
('luminosos', 'Misterios luminosos', '4',   4);

INSERT INTO mysteries (set_id, number, title) VALUES
('gozosos', 1, 'La Encarnación del Hijo de Dios'),
('gozosos', 2, 'La Visitación de Nuestra Señora a su prima santa Isabel'),
('gozosos', 3, 'El Nacimiento del Hijo de Dios'),
('gozosos', 4, 'La Presentación de Jesús en el templo'),
('gozosos', 5, 'El Niño Jesús perdido y hallado en el templo'),
('dolorosos', 1, 'La Oración de Jesús en el huerto'),
('dolorosos', 2, 'La Flagelación del Señor'),
('dolorosos', 3, 'La Coronación de espinas'),
('dolorosos', 4, 'Jesús con la Cruz a cuestas, camino del Calvario'),
('dolorosos', 5, 'La Crucifixión y Muerte de nuestro Señor'),
('gloriosos', 1, 'La Resurrección del Hijo de Dios'),
('gloriosos', 2, 'La Ascensión del Señor a los Cielos'),
('gloriosos', 3, 'La Venida del Espíritu Santo sobre los Apóstoles'),
('gloriosos', 4, 'La Asunción de Nuestra Señora a los Cielos'),
('gloriosos', 5, 'La Coronación de la Santísima Virgen como Reina de Cielos y Tierra'),
('luminosos', 1, 'El Bautismo de Jesús en el Jordán'),
('luminosos', 2, 'La autorrevelación de Jesús en las bodas de Caná'),
('luminosos', 3, 'El anuncio del Reino de Dios invitando a la conversión'),
('luminosos', 4, 'La Transfiguración'),
('luminosos', 5, 'La Institución de la Eucaristía');

-- Opening on the crucifix (always)
INSERT INTO steps (seq, position, title, prayer_ids, optional, note) VALUES
(10, 'cross', 'Señal de la Cruz',       'senal',        0, NULL),
(20, 'cross', 'Acto de contrición',     'contricion',   0, NULL),
(30, 'cross', 'Invocaciones iniciales', 'invocaciones', 0, NULL),
-- Traditional opening on the pendant (optional = 1)
(40, 'cross',  'Credo',        'credo',        1, NULL),
(41, 'pl1',    'Padrenuestro', 'padrenuestro', 1, NULL),
(42, 'ps1',    'Avemaría',     'avemaria',     1, 'Por la virtud de la fe'),
(43, 'ps2',    'Avemaría',     'avemaria',     1, 'Por la virtud de la esperanza'),
(44, 'ps3',    'Avemaría',     'avemaria',     1, 'Por la virtud de la caridad'),
(45, 'pchain', 'Gloria',       'gloria',       1, NULL);

-- Five decades: seq 100-111, 200-211, ... 500-511
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 5),
               b(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM b WHERE i < 10)
INSERT INTO steps (seq, position, title, prayer_ids, decade, ave_number)
SELECT n * 100,
       CASE WHEN n = 1 THEN 'pl2' ELSE 'L' || n END,
       CASE n WHEN 1 THEN 'Primer misterio' WHEN 2 THEN 'Segundo misterio'
              WHEN 3 THEN 'Tercer misterio' WHEN 4 THEN 'Cuarto misterio'
              ELSE 'Quinto misterio' END,
       'padrenuestro', n, NULL
FROM d
UNION ALL
SELECT n * 100 + i, 'd' || n || 'b' || i, i || '.ª Avemaría', 'avemaria', n, i
FROM d, b
UNION ALL
SELECT n * 100 + 11, 'd' || n || 'c', 'Gloria y jaculatorias',
       'gloria,maria_madre,oh_jesus', n, NULL
FROM d;

-- Closing on the medal (always)
INSERT INTO steps (seq, position, title, prayer_ids, note) VALUES
(600, 'medal', 'Letanías lauretanas', 'letanias', NULL),
(610, 'medal', 'Cordero de Dios', 'cordero', NULL),
(620, 'medal', 'Oración', 'oracion', NULL),
(630, 'medal', 'Por las intenciones del Santo Padre', 'padrenuestro,avemaria,gloria',
      'Un Padrenuestro, un Avemaría y un Gloria por el Papa'),
(640, 'medal', 'Salve', 'salve', NULL),
(650, 'medal', 'Jaculatoria final', 'jaculatoria', NULL);
