// this is free and unencumbered software released into the public
// domain. refer to the attached UNLICENSE or http://unlicense.org/
//
// [![Build Status](
// https://travis-ci.org/Francesco149/ojsama.svg?branch=master)](
// https://travis-ci.org/Francesco149/ojsama)
//
// pure javascript implementation of
// https://github.com/Francesco149/oppai-ng intended to be easier
// to use and set up for js developers as well as more portable
// than straight up bindings at the cost of some performance
//
// installation:
// ----------------------------------------------------------------
// since this is a single-file library, you can just drop the file
// into your project:
// ```sh
// cd my/project
// curl https://waa.ai/ojsama > ojsama.js
// ```
//
// or include it directly in a html page:
// ```html
// <script type="text/javascript" src="ojsama.min.js"></script>
// ```
//
// it's also available as a npm package:
// ```sh
// npm install ojsama
// ```
//
// you can find full documentation of the code at
// http://hnng.moe/stuff/ojsama.html or simply read ojsama.js
//
// usage (nodejs):
// ----------------------------------------------------------------
// (change ./ojsama to ojsama if you installed through npm)
//
// ```js
// var readline = require("readline");
// var osu = require("./ojsama");
//
// var parser = new osu.parser();
// readline.createInterface({
//     input: process.stdin, terminal: falsei
// })
// .on("line", parser.feed_line.bind(parser))
// .on("close", function() {
//     console.log(osu.ppv2({map: parser.map}).toString());
// });
// ```
//
// ```sh
// $ curl https://osu.ppy.sh/osu/67079 | node minexample.js
// 133.24 pp (36.23 aim, 40.61 speed, 54.42 acc)
// ```
//
// advanced usage (nodejs with acc, mods, combo...):
// ----------------------------------------------------------------
// ```js
// var readline = require("readline");
// var osu = require("./ojsama");
//
// var mods = osu.MOD_CONSTANTS.none;
// var acc_percent;
// var combo;
// var nmiss;
//
// // get mods, acc, combo, misses from command line arguments
// // format: +HDDT 95% 300x 1m
// var argv = process.argv;
//
// for (var i = 2; i < argv.length; ++i)
// {
//     if (argv[i].startsWith("+")) {
//         mods = osu.MOD_CONSTANTS.from_string(argv[i].slice(1) || "");
//     }
//
//     else if (argv[i].endsWith("%")) {
//         acc_percent = parseFloat(argv[i]);
//     }
//
//     else if (argv[i].endsWith("x")) {
//         combo = parseInt(argv[i]);
//     }
//
//     else if (argv[i].endsWith("m")) {
//         nmiss = parseInt(argv[i]);
//     }
// }
//
// var parser = new osu.parser();
// readline.createInterface({
//   input: process.stdin, terminal: false
// })
// .on("line", parser.feed_line.bind(parser))
// .on("close", function() {
//     var map = parser.map;
//     console.log(map.toString());
//
//     if (mods) {
//         console.log("+" + osu.MOD_CONSTANTS.string(mods));
//     }
//
//     var stars = new osu.diff().calc({map: map, mods: mods});
//     console.log(stars.toString());
//
//     var pp = osu.ppv2({
//         stars: stars,
//         combo: combo,
//         nmiss: nmiss,
//         acc_percent: acc_percent,
//     });
//
//     var max_combo = map.max_combo();
//     combo = combo || max_combo;
//
//     console.log(pp.computed_accuracy.toString());
//     console.log(combo + "/" + max_combo + "x");
//
//     console.log(pp.toString());
// });
// ```
//
// ```sh
// $ curl https://osu.ppy.sh/osu/67079 | node example.js
// TERRA - Tenjou no Hoshi ~Reimeiki~ [BMax] mapped by ouranhshc
//
// AR5 OD8 CS4 HP8
// 262 circles, 69 sliders, 5 spinners
// 469 max combo
//
// 4.33 stars (2.09 aim, 2.19 speed)
// 100.00% 0x100 0x50 0xmiss
// 469/469x
// 133.24 pp (36.23 aim, 40.61 speed, 54.42 acc)
//
// $ curl https://osu.ppy.sh/osu/67079 \
// | node example.js +HDDT 98% 400x 1m
// ...
// +HDDT
// 6.13 stars (2.92 aim, 3.11 speed)
// 97.92% 9x100 0x50 1xmiss
// 400/469x
// 266.01 pp (99.70 aim, 101.68 speed, 60.41 acc)
// ```
//
// usage (in the browser)
// ----------------------------------------------------------------
// ```html
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <script type="text/javascript" src="ojsama.min.js"></script>
//   <script type="text/javascript">
//   function load_file()
//   {
//       var frame = document.getElementById("osufile");
//       var contents = frame.contentWindow
//           .document.body.childNodes[0].innerHTML;
//
//       var parser = new osu.parser().feed(contents);
//       console.log(parser.toString());
//
//       var str = parser.map.toString();
//       str += osu.ppv2({map: parser.map}).toString();
//
//       document.getElementById("result").innerHTML = str;
//   }
//   </script>
// </head>
// <body>
//   <iframe id="osufile" src="test.osu" onload="load_file();"
//     style="display: none;">
//   </iframe>
//   <blockquote><pre id="result">calculating...</pre></blockquote>
// </body>
// </html>
// ```
//
// (this example assumes you have a test.osu beatmap in the same
// directory)
//
// performance
// ----------------------------------------------------------------
// this is around 50-60% slower than the C implementation and uses
// ~10 times more memory.
// ```sh
// $ busybox time -v node --use_strict test.js
// ...
// User time (seconds): 16.58
// System time (seconds): 0.43
// Percent of CPU this job got: 101%
// Elapsed (wall clock) time (h:mm:ss or m:ss): 0m 16.70s
// ...
// Maximum resident set size (kbytes): 314080
// Minor (reclaiming a frame) page faults: 20928
// Voluntary context switches: 72138
// Involuntary context switches: 16689
// ```

// # code documentation

// when used outside of node, a osu namespace will be exposed
// without polluting the global scope

let osu = {};

if (typeof exports !== 'undefined') {
  osu = exports;
}

(function () {
  osu.VERSION_MAJOR = 1;
  osu.VERSION_MINOR = 0;
  osu.VERSION_PATCH = 5;

  // internal utilities
  // ----------------------------------------------------------------

  // override console with nop when running in a browser

  let log = { warn: Function.prototype };

  if (typeof exports !== 'undefined') {
    log = console;
  }

  const array_toFixed = function (arr, n) {
    const res = new Array(arr.length);
    for (let i = 0; i < res.length; ++i) {
      res[i] = arr[i].toFixed(n);
    }
    return res;
  };

  // timing point
  // ----------------------------------------------------------------
  // defines parameters such as timing and sampleset for an interval.
  // for pp calculation we only need time and msPerBeat
  //
  // it can inherit from its preceeding point by having
  // change = false and setting msPerBeat to a negative value which
  // represents the bpm multiplier as ```-100 * bpm_multiplier```

  class Timing {
    constructor({ time = 0.0, msPerBeat = 600.0, change = true }) {
      this.time = time;
      this.msPerBeat = msPerBeat;
      this.change = change;
    }

    toString() {
      return JSON.stringify({
        time: this.time.toFixed(2),
        msPerBeat: this.msPerBeat.toFixed(2),
      });
    }
  }

  // hit objects
  // ----------------------------------------------------------------
  // partial structure of osu! hitobjects with just enough data for
  // pp calculation

  // bitmask constants for object types. note that the type can
  // contain other flags so you should always check type with
  // ```if (type & objectTypes.circle) { ... }```

  const objectTypes = {
    circle: 1 << 0,
    slider: 1 << 1,
    spinner: 1 << 3,
  };

  // all we need from circles is their position. all positions
  // stored in the objects are in playfield coordinates (512*384
  // rect)

  class Circle {
    constructor({ pos = [0, 0] }) {
      this.pos = pos;
    }

    toString() {
      return JSON.stringify({
        pos: this.pos.map(p => p.toFixed(2)),
      });
    }
  }

  // to calculate max combo we need to compute slider ticks
  //
  // the beatmap stores the distance travelled in one repetition and
  // the number of repetitions. this is enough to calculate distance
  // per tick using timing information and slider velocity.
  //
  // note that 1 repetition means no repeats (1 loop)

  class Slider {
    constructor({ pos = [0, 0], distance = 0.0, repetitions = 1 }) {
      this.pos = pos;
      this.distance = distance;
      this.repetitions = repetitions;
    }


    toString() {
      const { pos, distance, repetitions } = this;

      return JSON.stringify({
        pos: pos.map(p => p.toFixed(2)),
        distance: distance.toFixed(2),
        repetitions,
      });
    }
  }

  // generic hitobject
  //
  // the only common property is start time (in millisecond).
  // object-specific properties are stored in data, which can be
  // an instance of circle, slider, or null

  class HitObject {
    constructor({ time = 0.0, type = 0, data = null }) {
      this.time = time;
      this.type = type;
      this.data = data;
    }

    typeString() {
      // TODO
    }

    toString() {
      // TODO
    }
  }

  /*
  hitobject.prototype.typestr = function () {
    let res = '';
    if (this.type & objectTypes.circle) res += 'circle | ';
    if (this.type & objectTypes.slider) res += 'slider | ';
    if (this.type & objectTypes.spinner) res += 'spinner | ';
    return res.substring(0, Math.max(0, res.length - 3));
  };

  hitobject.prototype.toString = function () {
    return `{ time: ${this.time.toFixed(2)}, ` +
        `type: ${this.typestr()
        }${this.data ? `, ${this.data.toString()}` : ''
        } }`;
  };
  */

  // beatmap
  // ----------------------------------------------------------------

  // gamemode constants

  const modes = {
    std: 0,
  };

  // partial beatmap structure with just enough data for pp
  // calculation

  class Beatmap {
    constructor() {
      this.reset();
    }

    reset() {
      this.formatVersion = 1;

      this.mode = modes.std;

      this.title = '';
      this.titleUnicode = '';
      this.artist = '';
      this.artistUnicode = '';
      this.creator = '';
      this.version = '';

      this.cs = 5.0;
      this.ar = 5.0;
      this.od = 5.0;
      this.hp = 5.0;

      this.sv = 1.0;
      this.tickRate = 1.0;

      this.circleCount = 0;
      this.sliderCount = 0;
      this.spinnerCount = 0;

      this.objects = [];

      this.timingPoints = [];

      return this;
    }


    // max combo calculation
    //
    // this is given by circleCount + spinnerCount + sliderCount * 2
    // (heads and tails) + nsliderticks
    //
    // we approximate slider ticks by calculating the
    // playfield pixels per beat for the current section
    // and dividing the total distance travelled by
    // pixels per beat. this gives us the number of beats,
    // which multiplied by the tick rate gives use the
    // tick count.
    maxCombo() {
      let res = this.circleCount + this.spinnerCount;
      let tindex = -1;
      let tnext = Number.NEGATIVE_INFINITY;
      let pixelsPerBeat = 0.0;

      this.objects
        .filter(object => object.type & objectTypes.slider)
        .forEach((object) => {
        // keep track of the current timing point without
        // looping through all of them for every object

          while (object.time >= tnext) {
            ++tindex;

            if (this.timingPoints.length > tindex + 1) {
              tnext = this.timingPoints[tindex + 1].time;
            } else {
              tnext = Number.POSITIVE_INFINITY;
            }

            const t = this.timingPoints[tindex];

            let svMultiplier = 1.0;

            if (!t.change && t.msPerBeat < 0) {
              svMultiplier = -100.0 / t.msPerBeat;
            }

            // beatmaps older than format v8 don't apply
            // the bpm multiplier to slider ticks

            if (this.formatVersion < 8) {
              pixelsPerBeat = this.sv * 100.0;
            } else {
              pixelsPerBeat = this.sv * 100.0 * svMultiplier;
            }
          }

          const sl = object.data;

          const beatCount =
              (sl.distance * sl.repetitions) / pixelsPerBeat;

          // subtract an epsilon to prevent accidental
          // ceiling of whole values such as 2.00....1 -> 3 due
          // to rounding errors

          let ticks = Math.ceil((beatCount - 0.1) / sl.repetitions * this.tickRate) - 1;

          ticks *= sl.repetitions;
          ticks += sl.repetitions + 1;

          res += Math.max(0, ticks);
        });


      return res;
    }

    toString() {
      // TODO
    }
  }

  /*
  beatmap.prototype.toString = function () {
    let res = `${this.artist} - ${this.title} [`;

    if (this.titleUnicode || this.artistUnicode) {
      res += `(${this.artistUnicode} - ${
        this.titleUnicode})`;
    }

    res += `${this.version}] mapped by ${this.creator}\n`
        + '\n'
        + `AR${parseFloat(this.ar.toFixed(2))} `
        + `OD${parseFloat(this.od.toFixed(2))} `
        + `CS${parseFloat(this.cs.toFixed(2))} `
        + `HP${parseFloat(this.hp.toFixed(2))}\n${
          this.circleCount} circles, ${
          this.sliderCount} sliders, ${
          this.spinnerCount} spinners` + `\n${
        this.max_combo()} max combo` + '\n';

    return res;
  };
  */

  // beatmap parser
  // ----------------------------------------------------------------

  // this is supposed to be the format's magic string, however .osu
  // files with random spaces or a BOM before this have been found
  // in the wild so in practice we still have to trim the first line

  const OSU_MAGIC_REGEX = /^osu file format v(\d+)$/;

  // partial .osu file parser built around pp calculation


  Beatmap.parse = (file) => {
    const commentFilter = line => !!line.match(/^(\/\/|[ _])/);

    const lines = file.split('\n')
      // Filter out comments
      .filter(commentFilter)
      .map(line => line.trim())
      // Filter out empty lines
      .filter(line => line.length);

    const map = new Beatmap();

    const parseKeyValuePair = (line) => {
      const match = line.match(/^([^:]+)\s*:\s*(.+)$/);

      if (!match) return {};

      const [, key, value] = match;
      return { key, value };
    };

    const metaToPropMap = {
      Title: 'title',
      TitleUnicode: 'titleUnicode',
      Artist: 'artist',
      ArtistUnicode: 'artistUnicode',
      Creator: 'creator',
      Version: 'version',
      Mode: 'mode',
    };

    const parseMetadata = (line) => {
      const { key, value } = parseKeyValuePair(line);

      const prop = metaToPropMap[key];

      if (prop) {
        map[prop] = value;
      }
    };

    const diffToPropMap = {
      CircleSize: 'cs',
      OverallDifficulty: 'od',
      ApproachRate: 'ar',
      HPDrainRate: 'hp',
      SliderMultiplier: 'sv',
      SliderTickRate: 'tickRate',
    };

    const parseDifficulty = (line) => {
      const { key, value } = diffToPropMap(line);

      const prop = metaToPropMap[key];

      if (prop) {
        map[prop] = parseFloat(value);
      }
    };

    const parseTimingPoints = (line) => {
      const [time, msPerBeat, ...rest] = line.split(',').map(v => v.trim());

      const timing = new Timing({
        time: parseFloat(time),
        msPerBeat: parseFloat(msPerBeat),
      });

      if (rest.length >= 5) {
        timing.change = rest[4] !== '0';
      }

      map.timingPoints.push(timing);
    };

    const parseHitObjects = (line) => {
      const [posX, posY, time, type, ,,, repetitions, distance] = line.split(',');

      const obj = new HitObject({
        time: parseFloat(time),
        type: parseInt(type, 10),
      });

      const pos = [parseFloat(posX), parseFloat(posY)];

      if (obj.type & objectTypes.circle) {
        ++this.map.circleCount;
        obj.data = new Circle({ pos });
      } else if (obj.type & osu.objectTypes.spinner) {
        ++this.map.spinnerCount;
      } else if (obj.type & osu.objectTypes.slider) {
        ++this.map.sliderCount;
        obj.data = new Slider({
          pos,
          repetitions: parseInt(repetitions, 10),
          distance: parseFloat(distance),
        });
      }

      this.map.objects.push(obj);
    };

    const sectionParsers = {
      Metadata: parseMetadata,
      General: parseMetadata,
      Difficulty: parseDifficulty,
      TimingPoints: parseTimingPoints,
      HitObjects: parseHitObjects,
    };

    let currentSection;

    lines.forEach((line, index) => {
      if (index === 0) {
        const match = line.match(OSU_MAGIC_REGEX);
        if (match) {
          throw new SyntaxError('Invalid .osu file!');
        }

        [, map.formatVersion] = match;

        return;
      }

      const sectionMatch = line.match(/^\[([^\]]+)\]$/);

      if (sectionMatch) {
        [, currentSection] = sectionMatch;
        return;
      }

      (sectionParsers[currentSection] || (() => {}))(line);
    });
  };


  // difficulty calculation
  // ----------------------------------------------------------------

  // mods bitmask constants
  // NOTE: td is touch device, but it's also the value for the
  // legacy no video mod

  const MOD_CONSTANTS = {
    nomod: 0,
    nf: 1 << 0,
    ez: 1 << 1,
    td: 1 << 2,
    hd: 1 << 3,
    hr: 1 << 4,
    dt: 1 << 6,
    ht: 1 << 8,
    nc: 1 << 9,
    fl: 1 << 10,
    so: 1 << 12,
  };

  // construct the mods bitmask from a string such as "HDHR"

  MOD_CONSTANTS.from_string = function (str) {
    let mask = 0;
    str = str.toLowerCase();

    for (const property in MOD_CONSTANTS) {
      if (property.length != 2) {
        continue;
      }

      if (!MOD_CONSTANTS.hasOwnProperty(property)) {
        continue;
      }

      if (str.indexOf(property) >= 0) {
        mask |= MOD_CONSTANTS[property];
      }
    }

    return mask;
  };

  // convert mods bitmask into a string, such as "HDHR"

  MOD_CONSTANTS.string = function (mods) {
    let res = '';

    for (const property in MOD_CONSTANTS) {
      if (property.length != 2) {
        continue;
      }

      if (!MOD_CONSTANTS.hasOwnProperty(property)) {
        continue;
      }

      if (mods & MOD_CONSTANTS[property]) {
        res += property.toUpperCase();
      }
    }

    return res;
  };

  MOD_CONSTANTS.speedChanging = MOD_CONSTANTS.dt | MOD_CONSTANTS.ht | MOD_CONSTANTS.nc;
  MOD_CONSTANTS.mapChanging
    = MOD_CONSTANTS.hr | MOD_CONSTANTS.ez | MOD_CONSTANTS.speedChanging;

  // _(internal)_
  // osu!standard stats constants

  const OD0_MS = 79.5;
  const OD10_MS = 19.5;
  const AR0_MS = 1800.0;
  const AR5_MS = 1200.0;
  const AR10_MS = 450.0;

  const OD_MS_STEP = (OD0_MS - OD10_MS) / 10.0;
  const AR_MS_STEP1 = (AR0_MS - AR5_MS) / 5.0;
  const AR_MS_STEP2 = (AR5_MS - AR10_MS) / 5.0;

  // _(internal)_
  // utility functions to apply speed and flat multipliers to
  // stats where speed changes apply (ar and od)

  function modify_ar(base_ar, speed_mul, multiplier) {
    let ar = base_ar;
    ar *= multiplier;

    // convert AR into milliseconds window

    let arms = ar < 5.0 ?
      AR0_MS - AR_MS_STEP1 * ar
      : AR5_MS - AR_MS_STEP2 * (ar - 5.0);

    // stats must be capped to 0-10 before HT/DT which
    // brings them to a range of -4.42->11.08 for OD and
    // -5->11 for AR

    arms = Math.min(AR0_MS, Math.max(AR10_MS, arms));
    arms /= speed_mul;

    ar = arms > AR5_MS ?
      (AR0_MS - arms) / AR_MS_STEP1
      : 5.0 + (AR5_MS - arms) / AR_MS_STEP2;

    return ar;
  }

  function modify_od(base_od, speed_mul, multiplier) {
    let od = base_od;
    od *= multiplier;
    let odms = OD0_MS - Math.ceil(OD_MS_STEP * od);
    odms = Math.min(OD0_MS, Math.max(OD10_MS, odms));
    odms /= speed_mul;
    od = (OD0_MS - odms) / OD_MS_STEP;
    return od;
  }

  // stores osu!standard beatmap stats

  function std_beatmap_stats(values) {
    this.ar = values.ar;
    this.od = values.od;
    this.hp = values.hp;
    this.cs = values.cs;
    this.speed_mul = 1.0;

    // previously calculated mod combinations are cached in a map

    this._mods_cache = {};
  }

  // applies difficulty modifiers to a map's ar, od, cs, hp and
  // returns the modified stats and the speed multiplier.
  //
  // unspecified stats are ignored and not returned

  std_beatmap_stats.prototype.with_mods = function (mods) {
    if (this._mods_cache[mods]) {
      return this._mods_cache[mods];
    }

    const stats = this._mods_cache[mods]
        = new std_beatmap_stats(this);

    if (!(mods & MOD_CONSTANTS.mapChanging)) {
      return stats;
    }

    if (mods & (MOD_CONSTANTS.dt | MOD_CONSTANTS.nc)) { stats.speed_mul = 1.5; }

    if (mods & MOD_CONSTANTS.ht) { stats.speed_mul *= 0.75; }

    let od_ar_hp_multiplier = 1.0;
    if (mods & MOD_CONSTANTS.hr) od_ar_hp_multiplier = 1.4;
    if (mods & MOD_CONSTANTS.ez) od_ar_hp_multiplier *= 0.5;

    if (stats.ar) {
      stats.ar = modify_ar(
        stats.ar, stats.speed_mul,
        od_ar_hp_multiplier,
      );
    }

    if (stats.od) {
      stats.od = modify_od(
        stats.od, stats.speed_mul,
        od_ar_hp_multiplier,
      );
    }

    if (stats.cs) {
      if (mods & MOD_CONSTANTS.hr) stats.cs *= 1.3;
      if (mods & MOD_CONSTANTS.ez) stats.cs *= 0.5;
      stats.cs = Math.min(10.0, stats.cs);
    }

    if (stats.hp) {
      stats.hp *= od_ar_hp_multiplier;
      stats.hp = Math.min(10.0, stats.hp);
    }

    return stats;
  };

  // osu! standard hit object with difficulty calculation values
  // obj is the underlying hitobject

  function std_diff_hitobject(obj) {
    this.obj = obj;
    this.reset();
  }

  std_diff_hitobject.prototype.reset = function () {
    this.strains = [0.0, 0.0];
    this.normpos = [0.0, 0.0];
    this.is_single = false;
    return this;
  };

  std_diff_hitobject.prototype.toString = function () {
    return `{ strains: [${array_toFixed(this.strains, 2)
    }], normpos: [${array_toFixed(this.normpos, 2)
    }], is_single: ${this.is_single} }`;
  };

  // _(internal)_
  // 2D point operations

  function vec_sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function vec_mul(a, b) { return [a[0] * b[0], a[1] * b[1]]; }

  function vec_len(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  }

  // _(internal)_
  // difficulty calculation constants

  const DIFF_SPEED = 0;
  const DIFF_AIM = 1;
  const ALMOST_DIAMETER = 90.0;
  const STREAM_SPACING = 110.0;
  const SINGLE_SPACING = 125.0;
  const DECAY_BASE = [0.3, 0.15];
  const WEIGHT_SCALING = [1400.0, 26.25];
  const DECAY_WEIGHT = 0.9;
  const STRAIN_STEP = 400.0;
  const CIRCLESIZE_BUFF_THRESHOLD = 30.0;
  const STAR_SCALING_FACTOR = 0.0675;
  const PLAYFIELD_SIZE = [512.0, 384.0];
  const PLAYFIELD_CENTER = vec_mul(PLAYFIELD_SIZE, [0.5, 0.5]);
  const EXTREME_SCALING_FACTOR = 0.5;

  // osu!standard difficulty calculator
  //
  // does not account for sliders because slider calculations are
  // expensive and not worth the small accuracy increase

  function std_diff() {
    // difficulty hitobjects array

    this.objects = [];
    this.reset();

    // make some parameters persist so they can be
    // re-used in subsequent calls if no new value is specified

    this.map = null;
    this.mods = MOD_CONSTANTS.nomod;
    this.singletap_threshold = 125.0;
  }

  std_diff.prototype.reset = function () {
    // star rating

    this.total = 0.0;
    this.aim = 0.0;
    this.speed = 0.0;

    // number of notes that are seen as singletaps by the
    // difficulty calculator

    this.nsingles = 0;

    // number of notes that are faster than the interval given
    // in calc(). these singletap statistic are not required in
    // star rating, but they are a free byproduct of the
    // calculation which could be useful

    this.nsingles_threshold = 0;
  };

  // calculate difficulty and return current instance, which
  // contains the results
  //
  // params:
  // * map: the beatmap we want to calculate difficulty for. if
  //   unspecified, it will default to the last map used
  //   in previous calls.
  // * mods: mods bitmask, defaults to MOD_CONSTANTS.nomod
  // * singletap_threshold: interval threshold in milliseconds
  //   for singletaps. defaults to 240 bpm 1/2 singletaps
  //   ```(60000 / 240) / 2``` .
  //   see nsingles_threshold

  std_diff.prototype.calc = function (params) {
    const map = this.map = params.map || this.map;
    if (!map) {
      throw new TypeError('no map given');
    }

    const mods = this.mods = params.mods || this.mods;
    var singletap_threshold = this.singletap_threshold
        = params.singletap_threshold || singletap_threshold;

    // apply mods to the beatmap's stats

    const stats =
        new std_beatmap_stats({ cs: map.cs })
          .with_mods(mods);

    const speed_mul = stats.speed_mul;
    this._init_objects(this.objects, map, stats.cs);

    this.speed = this._calc_individual(DIFF_SPEED, this.objects, speed_mul);

    this.aim = this._calc_individual(DIFF_AIM, this.objects, speed_mul);

    this.speed = Math.sqrt(this.speed) * STAR_SCALING_FACTOR;
    this.aim = Math.sqrt(this.aim) * STAR_SCALING_FACTOR;
    if (mods & MOD_CONSTANTS.td) {
      this.aim = Math.pow(this.aim, 0.8);
    }

    // total stars mixes speed and aim in such a way that
    // heavily aim or speed focused maps get a bonus

    this.total = this.aim + this.speed
        + Math.abs(this.speed - this.aim)
        * EXTREME_SCALING_FACTOR;

    // singletap stats

    this.nsingles = 0;
    this.nsingles_threshold = 0;

    for (let i = 1; i < this.objects.length; ++i) {
      const obj = this.objects[i].obj;
      const prev = this.objects[i - 1].obj;

      if (this.objects[i].is_single) {
        ++this.nsingles;
      }

      if (!(obj.type & (objectTypes.circle | objectTypes.slider))) {
        continue;
      }

      const interval = (obj.time - prev.time) / speed_mul;

      if (interval >= singletap_threshold) {
        ++this.nsingles_threshold;
      }
    }

    return this;
  };

  std_diff.prototype.toString = function () {
    return `${this.total.toFixed(2)} stars (${this.aim.toFixed(2)
    } aim, ${this.speed.toFixed(2)} speed)`;
  };

  // _(internal)_
  // calculate spacing weight for a difficulty type

  std_diff.prototype._spacing_weight = function (type, distance) {
    switch (type) {
      case DIFF_AIM:
        return Math.pow(distance, 0.99);

      case DIFF_SPEED:
        if (distance > SINGLE_SPACING) {
          return 2.5;
        } else if (distance > STREAM_SPACING) {
          return 1.6 + 0.9 * (distance - STREAM_SPACING)
                / (SINGLE_SPACING - STREAM_SPACING);
        } else if (distance > ALMOST_DIAMETER) {
          return 1.2 + 0.4 * (distance - ALMOST_DIAMETER)
                / (STREAM_SPACING - ALMOST_DIAMETER);
        } else if (distance > ALMOST_DIAMETER / 2.0) {
          return 0.95 + 0.25
                * (distance - ALMOST_DIAMETER / 2.0)
                / (ALMOST_DIAMETER / 2.0);
        }

        return 0.95;
    }

    throw {
      name: 'NotImplementedError',
      message: 'this difficulty type does not exist',
    };
  };

  // _(internal)_
  // calculate a single strain and store it in the diffobj

  std_diff.prototype._calc_strain = function (
    type, diffobj,
    prev_diffobj, speed_mul,
  ) {
    const obj = diffobj.obj;
    const prev_obj = prev_diffobj.obj;

    let value = 0.0;
    const time_elapsed = (obj.time - prev_obj.time) / speed_mul;
    const decay = Math.pow(
      DECAY_BASE[type],
      time_elapsed / 1000.0,
    );

    if ((obj.type & (objectTypes.slider | objectTypes.circle)) != 0) {
      const distance = vec_len(vec_sub(diffobj.normpos, prev_diffobj.normpos));

      if (type == DIFF_SPEED) {
        diffobj.is_single = distance > SINGLE_SPACING;
      }

      value = this._spacing_weight(type, distance);
      value *= WEIGHT_SCALING[type];
    }

    value /= Math.max(time_elapsed, 50.0);

    diffobj.strains[type]
        = prev_diffobj.strains[type] * decay + value;
  };

  // _(internal)_
  // calculate a specific type of difficulty
  //
  // the map is analyzed in chunks of STRAIN_STEP duration.
  // for each chunk the highest hitobject strains are added to
  // a list which is then collapsed into a weighted sum, much
  // like scores are weighted on a user's profile.
  //
  // for subsequent chunks, the initial max strain is calculated
  // by decaying the previous hitobject's strain until the
  // beginning of the new chunk

  std_diff.prototype._calc_individual = function (
    type, diffobjs,
    speed_mul,
  ) {
    const strains = [];
    const strain_step = STRAIN_STEP * speed_mul;
    let interval_end = strain_step;
    let max_strain = 0.0;
    let i;

    for (i = 0; i < diffobjs.length; ++i) {
      if (i > 0) {
        this._calc_strain(
          type, diffobjs[i], diffobjs[i - 1],
          speed_mul,
        );
      }

      while (diffobjs[i].obj.time > interval_end) {
        strains.push(max_strain);

        if (i > 0) {
          const decay = Math.pow(
            DECAY_BASE[type],
            (interval_end - diffobjs[i - 1].obj.time)
                        / 1000.0,
          );

          max_strain = diffobjs[i - 1].strains[type]
                    * decay;
        } else {
          max_strain = 0.0;
        }

        interval_end += strain_step;
      }

      max_strain
            = Math.max(max_strain, diffobjs[i].strains[type]);
    }

    let weight = 1.0;
    let difficulty = 0.0;

    strains.sort((a, b) => b - a);

    for (i = 0; i < strains.length; ++i) {
      difficulty += strains[i] * weight;
      weight *= DECAY_WEIGHT;
    }

    return difficulty;
  };

  // _(internal)_
  // positions are normalized on circle radius so that we can
  // calc as if everything was the same circlesize.
  //
  // this creates a scaling vector that normalizes positions

  std_diff.prototype._normalizer_vector = function (circlesize) {
    const radius = (PLAYFIELD_SIZE[0] / 16.0)
        * (1.0 - 0.7 * (circlesize - 5.0) / 5.0);

    let scaling_factor = 52.0 / radius;

    // high circlesize (small circles) bonus

    if (radius < CIRCLESIZE_BUFF_THRESHOLD) {
      scaling_factor *= 1.0
            + Math.min(CIRCLESIZE_BUFF_THRESHOLD - radius, 5.0)
            / 50.0;
    }

    return [scaling_factor, scaling_factor];
  };

  // _(internal)_
  // initialize diffobjs (or reset if already initialized) and
  // populate it with the normalized position of the map's
  // objects

  std_diff.prototype._init_objects = function (
    diffobjs, map,
    circlesize,
  ) {
    if (diffobjs.length != map.objects.length) {
      diffobjs.length = map.objects.length;
    }

    const scaling_vec = this._normalizer_vector(circlesize);
    const normalized_center
        = vec_mul(PLAYFIELD_CENTER, scaling_vec);

    for (let i = 0; i < diffobjs.length; ++i) {
      if (!diffobjs[i]) {
        diffobjs[i] =
                new std_diff_hitobject(map.objects[i]);
      } else {
        diffobjs[i].reset();
      }

      const obj = diffobjs[i].obj;

      if (obj.type & objectTypes.spinner) {
        diffobjs[i].normpos = normalized_center.slice();
        continue;
      }

      var pos;

      if (obj.type & (objectTypes.slider | objectTypes.circle)) {
        pos = obj.data.pos;
      } else {
        log.warn(
          'unknown object type ',
          obj.type.toString(16),
        );

        pos = [0.0, 0.0];
      }

      diffobjs[i].normpos = vec_mul(pos, scaling_vec);
    }
  };

  // generic difficulty calculator that creates and uses
  // mode-specific calculators based on the map's mode field

  function diff() {
    // calculators for different modes are cached for reuse within
    // this instance

    this.calculators = [];
    this.map = null;
  }

  // figures out what difficulty calculator to use based on the
  // beatmap's gamemode and calls it with params
  //
  // if no map is specified in params, the last map used in
  // previous calls will be used. this simplifies subsequent
  // calls for the same beatmap
  //
  // see gamemode-specific calculators above for params
  //
  // returns the chosen gamemode-specific difficulty calculator

  diff.prototype.calc = function (params) {
    let calculator = null;
    const map = this.map = params.map || this.map;
    if (!map) {
      throw new TypeError('no map given');
    }

    if (!this.calculators[map.mode]) {
      switch (map.mode) {
        case modes.std:
          calculator = new std_diff();
          break;

        default:
          throw {
            name: 'NotImplementedError',
            message: 'this gamemode is not yet supported',
          };
      }

      this.calculators[map.mode] = calculator;
    } else {
      calculator = this.calculators[map.mode];
    }

    return calculator.calc(params);
  };

  // pp calculation
  // ----------------------------------------------------------------

  // osu!standard accuracy calculator
  //
  // if percent and nobjects are specified, n300, n100 and n50 will
  // be automatically calculated to be the closest to the given
  // acc percent

  function std_accuracy(values) {
    this.nmiss = values.nmiss || 0;

    if (values.n300 === undefined) {
      this.n300 = -1;
    } else {
      this.n300 = values.n300;
    }

    this.n100 = values.n100 || 0;
    this.n50 = values.n50 || 0;

    if (values.percent) {
      const nobjects = values.nobjects;
      if (nobjects === undefined) {
        throw new TypeError('nobjects is required when specifying percent');
      }

      this.nmiss = Math.min(nobjects, this.nmiss);
      const max300 = nobjects - this.nmiss;

      const maxacc = new std_accuracy({
        n300: max300, n100: 0, n50: 0, nmiss: this.nmiss,
      }).value() * 100.0;

      let acc_percent = values.percent;
      acc_percent = Math.max(0.0, Math.min(maxacc, acc_percent));

      // just some black magic maths from wolfram alpha

      this.n100 = Math.round(-3.0 *
            ((acc_percent * 0.01 - 1.0) * nobjects + this.nmiss) *
            0.5);

      if (this.n100 > max300) {
        // acc lower than all 100s, use 50s

        this.n100 = 0;

        this.n50 = Math.round(-6.0 *
                ((acc_percent * 0.01 - 1.0) * nobjects +
                    this.nmiss) * 0.5);

        this.n50 = Math.min(max300, this.n50);
      }

      this.n300 = nobjects - this.n100 - this.n50 - this.nmiss;
    }
  }

  // computes the accuracy value (0.0-1.0)
  //
  // if n300 was specified in the constructor, nobjects is not
  // required and will be automatically computed

  std_accuracy.prototype.value = function (nobjects) {
    let n300 = this.n300;

    if (n300 < 0) {
      if (!nobjects) {
        throw new TypeError('either n300 or nobjects must be specified');
      }

      n300 = nobjects - this.n100 - this.n50 - this.nmiss;
    } else {
      nobjects = n300 + this.n100 + this.n50
            + this.nmiss;
    }

    const res
        = (n300 * 300.0 + this.n100 * 100.0 + this.n50 * 50.0)
        / (nobjects * 300.0);

    return Math.max(0, Math.min(res, 1.0));
  };

  std_accuracy.prototype.toString = function () {
    return `${(this.value() * 100.0).toFixed(2)}% ${
      this.n100}x100 ${this.n50}x50 ${
      this.nmiss}xmiss`;
  };

  // osu! standard ppv2 calculator

  function std_ppv2() {
    this.aim = 0.0;
    this.speed = 0.0;
    this.acc = 0.0;

    // accuracy used in the last calc() call

    this.computed_accuracy = null;
  }

  // metaparams:
  // map, stars, acc_percent
  //
  // params:
  // aim_stars, speed_stars, max_combo, sliderCount, circleCount,
  // nobjects, base_ar = 5, base_od = 5, mode = modes.std,
  // mods = MOD_CONSTANTS.nomod, combo = max_combo - nmiss,
  // n300 = nobjects - n100 - n50 - nmiss, n100 = 0, n50 = 0,
  // nmiss = 0, score_version = 1
  //
  // if stars is defined, map and mods are obtained from stars as
  // well as aim_stars and speed_stars
  //
  // if map is defined, max_combo, sliderCount, circleCount, nobjects,
  // base_ar, base_od will be obtained from this beatmap
  //
  // if map is defined and stars is not defined, a new difficulty
  // calculator will be created on the fly to compute stars for map
  //
  // if acc_percent is defined, n300, n100, n50 will be automatically
  // calculated to be as close as possible to this value

  std_ppv2.prototype.calc = function (params) {
    // parameters handling

    let stars = params.stars;
    let map = params.map;
    let max_combo,
      sliderCount,
      circleCount,
      nobjects,
      base_ar,
      base_od;
    let mods;
    let aim_stars,
      speed_stars;

    if (stars) {
      map = stars.map;
    }

    if (map) {
      max_combo = map.max_combo();
      sliderCount = map.sliderCount;
      circleCount = map.circleCount;
      nobjects = map.objects.length;
      base_ar = map.ar;
      base_od = map.od;

      if (!stars) {
        stars = new std_diff().calc(params);
      }
    } else {
      max_combo = params.max_combo;
      if (!max_combo || max_combo < 0) {
        throw new TypeError('max_combo must be > 0');
      }

      sliderCount = params.sliderCount;
      circleCount = params.circleCount;
      nobjects = params.nobjects;
      if (!sliderCount || !circleCount || !nobjects) {
        throw new TypeError('sliderCount, circleCount, nobjects are required');
      }
      if (nobjects < sliderCount + circleCount) {
        throw new TypeError('nobjects must be >= sliderCount + circleCount');
      }

      base_ar = params.base_ar;
      if (base_ar === undefined) base_ar = 5;
      base_od = params.base_od;
      if (base_od === undefined) base_od = 5;
    }

    if (stars) {
      mods = stars.mods;
      aim_stars = stars.aim;
      speed_stars = stars.speed;
    } else {
      mods = params.mods || MOD_CONSTANTS.nomod;
      aim_stars = params.aim_stars;
      speed_stars = params.speed_stars;
    }

    if (aim_stars === undefined || speed_stars === undefined) {
      throw new TypeError('aim and speed stars required');
    }

    const nmiss = params.nmiss || 0;
    let n50 = params.n50 || 0;
    let n100 = params.n100 || 0;

    let n300 = params.n300;
    if (n300 === undefined) { n300 = nobjects - n100 - n50 - nmiss; }

    let combo = params.combo;
    if (combo === undefined) combo = max_combo - nmiss;

    const score_version = params.score_version || 1;

    // common values used in all pp calculations

    const nobjects_over_2k = nobjects / 2000.0;

    let length_bonus = 0.95 + 0.4 *
        Math.min(1.0, nobjects_over_2k);

    if (nobjects > 2000) {
      length_bonus += Math.log10(nobjects_over_2k) * 0.5;
    }

    const miss_penality = Math.pow(0.97, nmiss);
    const combo_break = Math.pow(combo, 0.8) /
        Math.pow(max_combo, 0.8);

    const mapstats
        = new std_beatmap_stats({ ar: base_ar, od: base_od })
          .with_mods(mods);

    this.computed_accuracy = new std_accuracy({
      percent: params.acc_percent,
      nobjects,
      n300,
      n100,
      n50,
      nmiss,
    });

    n300 = this.computed_accuracy.n300;
    n100 = this.computed_accuracy.n100;
    n50 = this.computed_accuracy.n50;

    const accuracy = this.computed_accuracy.value();

    // high/low ar bonus

    let ar_bonus = 1.0;

    if (mapstats.ar > 10.33) {
      ar_bonus += 0.45 * (mapstats.ar - 10.33);
    } else if (mapstats.ar < 8.0) {
      let low_ar_bonus = 0.01 * (8.0 - mapstats.ar);

      if (mods & MOD_CONSTANTS.hd) {
        low_ar_bonus *= 2.0;
      }

      ar_bonus += low_ar_bonus;
    }

    // aim pp

    let aim = this._base(aim_stars);
    aim *= length_bonus;
    aim *= miss_penality;
    aim *= combo_break;
    aim *= ar_bonus;

    if (mods & MOD_CONSTANTS.hd) aim *= 1.18;
    if (mods & MOD_CONSTANTS.fl) aim *= 1.45 * length_bonus;

    const acc_bonus = 0.5 + accuracy / 2.0;
    const od_bonus =
        0.98 + (mapstats.od * mapstats.od) / 2500.0;

    aim *= acc_bonus;
    aim *= od_bonus;

    this.aim = aim;

    // speed pp

    let speed = this._base(speed_stars);
    speed *= length_bonus;
    speed *= miss_penality;
    speed *= combo_break;
    speed *= acc_bonus;
    speed *= od_bonus;

    this.speed = speed;

    // accuracy pp
    //
    // scorev1 ignores sliders and spinners since they are free
    // 300s

    let real_acc = accuracy;

    switch (score_version) {
      case 1:
        var spinnerCount = nobjects - sliderCount - circleCount;

        real_acc = new std_accuracy({
          n300: Math.max(0, n300 - sliderCount - spinnerCount),
          n100,
          n50,
          nmiss,
        }).value();

        real_acc = Math.max(0.0, real_acc);
        break;

      case 2:
        circleCount = nobjects;
        break;

      default:
        throw new {
          name: 'NotImplementedError',
          message: `unsupported scorev${score_version}`,
        }();
    }

    let acc = Math.pow(1.52163, mapstats.od) *
        Math.pow(real_acc, 24.0) * 2.83;

    acc *= Math.min(1.15, Math.pow(circleCount / 1000.0, 0.3));

    if (mods & MOD_CONSTANTS.hd) acc *= 1.02;
    if (mods & MOD_CONSTANTS.fl) acc *= 1.02;

    this.acc = acc;

    // total pp

    let final_multiplier = 1.12;

    if (mods & MOD_CONSTANTS.nf) final_multiplier *= 0.90;
    if (mods & MOD_CONSTANTS.so) final_multiplier *= 0.95;

    this.total = Math.pow(
      Math.pow(aim, 1.1) + Math.pow(speed, 1.1) +
        Math.pow(acc, 1.1),
      1.0 / 1.1,
    ) * final_multiplier;

    return this;
  };

  std_ppv2.prototype.toString = function () {
    return `${this.total.toFixed(2)} pp (${this.aim.toFixed(2)
    } aim, ${this.speed.toFixed(2)} speed, ${
      this.acc.toFixed(2)} acc)`;
  };

  // _(internal)_ base pp value for stars
  std_ppv2.prototype._base = function (stars) {
    return Math.pow(5.0 * Math.max(1.0, stars / 0.0675) - 4.0, 3.0) / 100000.0;
  };

  // generic pp calc function that figures out what calculator to use
  // based on the params' mode and passes through params and
  // return value for calc()

  function ppv2(params) {
    let mode;

    if (params.map) {
      mode = params.map.mode;
    } else {
      mode = params.mode || modes.std;
    }

    switch (mode) {
      case modes.std:
        return new std_ppv2().calc(params);
    }

    throw {
      name: 'NotImplementedError',
      message: 'this gamemode is not yet supported',
    };
  }

  // exports
  // ----------------------------------------------------------------

  osu.timing = timing;
  osu.objectTypes = objectTypes;
  osu.circle = circle;
  osu.slider = slider;
  osu.hitobject = hitobject;
  osu.modes = modes;
  osu.beatmap = beatmap;
  osu.parser = parser;
  osu.MOD_CONSTANTS = MOD_CONSTANTS;
  osu.std_beatmap_stats = std_beatmap_stats;
  osu.std_diff_hitobject = std_diff_hitobject;
  osu.std_diff = std_diff;
  osu.diff = diff;
  osu.std_accuracy = std_accuracy;
  osu.std_ppv2 = std_ppv2;
  osu.ppv2 = ppv2;
}());
