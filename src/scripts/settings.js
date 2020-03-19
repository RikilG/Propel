const fs = require('fs')

let rawdata = fs.readFileSync(process.cwd() + '/database/userPrefs.json')
let prefs = JSON.parse(rawdata)

console.log(prefs)