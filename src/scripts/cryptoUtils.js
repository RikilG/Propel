let crypto
try {
    crypto = require('crypto')
} catch(err) {
    console.log("No crypto module found. using plain text instead!")
    notify("No crypto module found. crypto functions disabled")
    crypto = false
}
const randInitVec = Buffer.allocUnsafe(16)
const iv = crypto.createHash("sha256").update("ProPl").digest()
iv.copy(randInitVec)

function encrypt(content, pass) {
    if (crypto == false) return content
    const key = crypto.createHash("sha256").update(pass).digest()
    const cipher = crypto.createCipheriv("aes-256-cbc", key, randInitVec)
    let data = cipher.update(content, "binary", "hex") + cipher.final("hex")
    return data.toString()
}

function decrypt(content, pass) {
    if (crypto == false) return content
    const key = crypto.createHash("sha256").update(pass).digest()
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, randInitVec)
    let msg = []
    let data = decipher.update(content, "hex", "binary") + decipher.final("binary")
    return data.toString()
}

function hash(text) {
    if (crypto == false) throw "Cannot create hash without crypto lib"
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex').toString()
}

function verifyHash(vhash, text) {
    if (crypto == false) throw "Cannot create hash without crypto lib"
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex').toString() === vhash
}

exports.encrypt = encrypt
exports.decrypt = decrypt
exports.hash = hash
exports.verifyHash = verifyHash