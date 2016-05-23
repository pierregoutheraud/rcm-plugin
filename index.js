var http = require('request');
var fs = require('fs');
var path = require('path')

function FetchScriptPlugin(options) {
  // Setup the plugin instance with options...
}

function writeFile(folder, name, componentName, extension, code, callback) {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder)
  var fileName = componentName + extension
  var filePath = path.join(folder, fileName)
  console.log('Creating '+filePath+'...')
  fs.writeFile(filePath, code, function(err) {
    if (err) return console.log(err);
    console.log('Done.');
    callback(fileName, filePath)
  })
}

FetchScriptPlugin.prototype.apply = function(compiler) {

  compiler.plugin('normal-module-factory', function(nmf) {
    nmf.plugin('before-resolve', function(data, cb) {

      var request = data.request
      var matches = request.match(/^rcm\/(.*)$/)

      if (matches && matches[1]) {

        var name = matches[1]
        var url = `http://localhost:10000/api/export/${name}`
        console.log(url);

        console.log('Downloading component ' + name + '...');
        http(url, function (error, response, body) {
          console.log('Download complete.');
          var json = JSON.parse(body)
          var folderPath = path.join(data.context, json.componentName)
          writeFile(folderPath, json.name, json.componentName, '.jsx', json.js, function(jsxFileName, jsxFilePath) {
            writeFile(folderPath, json.name, json.componentName, '.scss', json.scss, function(scssFileName, scssFilePath) {
              var newRequest = './' + path.join(json.componentName, jsxFileName)
              data.request = newRequest
              data.dependency.request = newRequest
              data.dependency.userRequest = newRequest
              cb(null, data)
            })
          })

        })

      } else {
        cb(null, data)
      }
    })
  })

  compiler.plugin('done', function() {
    console.log('Fetch script done!');
  });

};

module.exports = FetchScriptPlugin;
