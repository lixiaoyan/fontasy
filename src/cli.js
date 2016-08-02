const fs = require("mz/fs");
const path = require("path");
const yargs = require("yargs");

const argv = yargs
  .usage("Usage: $0 --config <config>")
  .alias("config", "C")
  .nargs("config", 1)
  .describe("config", "Config file in JSON format.")
  .demand("config")
  .argv;

const Fontasy = require(".");

fs.readFile(argv.config).then(options => {
  options = JSON.parse(options);
  return fs.readdir(options.inputDir).then(files => {
    files = files
      .filter(file => path.extname(file) === ".svg")
      .map(file => path.join(options.inputDir, file));
    return Fontasy(files, options);
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
