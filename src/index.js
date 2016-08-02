const fs = require("mz/fs");
const path = require("path");
const streamToPromise = require("stream-to-promise");
const mkdirp = require("mkdirp");
const svgicons2svgfont = require("svgicons2svgfont");
const svg2ttf = require("svg2ttf");
const ttf2eot = require("ttf2eot");
const ttf2woff = require("ttf2woff");
const ttf2woff2 = require("ttf2woff2");

function createOutputDir(options) {
  return new Promise((resolve, reject) => {
    mkdirp(options.outputDir, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function toSvgFont(files, options) {
  const stream = svgicons2svgfont(Object.assign({}, options));
  const promise = streamToPromise(stream);
  files.sort().forEach(file => {
    const name = path.basename(file, ".svg");
    const glyph = fs.createReadStream(file);
    glyph.metadata = {
      name,
      unicode: [name]
    };
    stream.write(glyph);
  });
  stream.end();
  return promise.then(data => data.toString());
}

const defaultOptions = {
  outputDir: "./output",
  fontName: "iconfont",
  fontId: undefined,
  fontStyle: '',
  fontWeight: '',
  fixedWidth: false,
  centerHorizontally: false,
  fontHeight: undefined,
  round: undefined,
  descent: undefined,
  ascent: undefined,
  metadata: "Created by Fontasy.",
  log: () => {},
};

module.exports = function(files, options) {
  options = Object.assign({}, defaultOptions, options);
  const baseName = path.join(options.outputDir, options.fontName);
  return Promise.resolve()
    .then(() => toSvgFont(files, options))
    .then(svg => {
      const fonts = {};
      fonts.svg = svg;
      fonts.ttf = new Buffer(svg2ttf(fonts.svg).buffer);
      fonts.eot = new Buffer(ttf2eot(new Uint8Array(fonts.ttf)).buffer);
      fonts.woff = new Buffer(ttf2woff(new Uint8Array(fonts.ttf), options).buffer);
      fonts.woff2 = ttf2woff2(fonts.ttf);
      return fonts;
    })
    .then(fonts => {
      return createOutputDir(options).then(() => {
        return Promise.all([
          fs.writeFile(baseName + ".svg", fonts.svg),
          fs.writeFile(baseName + ".ttf", fonts.ttf, "binary"),
          fs.writeFile(baseName + ".eot", fonts.eot, "binary"),
          fs.writeFile(baseName + ".woff", fonts.woff, "binary"),
          fs.writeFile(baseName + ".woff2", fonts.woff2, "binary"),
        ]);
      });
    });
};
