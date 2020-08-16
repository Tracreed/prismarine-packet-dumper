const fs = require('fs')
const fsP = fs.promises
const path = require('path')
const mineflayer = require('mineflayer')

const PACKET_DIRECTORY = path.resolve('packets')

/** Packet logger using mineflayer */
class MineflayerLog {
  /**
   * The constructor
   * @param {object} opts
   * @param {string} opts.version Target minecraft version
   * @param {string} opts.outputDirectory Directory to write packets to
   */
  constructor (opts) {
    this.version = opts.version
    this.outputDirectory = opts.outputDirectory
    this.bot = null
    this.kindCounter = {}
    this.kindPromise = {}
    this.maxPerKind = opts.maxPerKind || 5
  }

  start (host, port, username = 'nmptestbot') {
    this.bot = mineflayer.createBot({
      host,
      port,
      username,
      version: this.version
    })
    this.setupPacketLog(this.bot._client)
  }

  setupPacketLog (client) {
    client.on('packet', async (data, meta, buffer) => {
      if (meta.state !== 'play') return
      if (this.kindCounter[meta.name] === undefined) {
        this.kindCounter[meta.name] = 0
        this.kindPromise[meta.name] = fsP.mkdir(path.join(PACKET_DIRECTORY, 'from-server', meta.name))
      }
      if (this.kindCounter[meta.name] >= this.maxPerKind) {
        return
      }
      this.kindCounter[meta.name] += 1
      const n = this.kindCounter[meta.name]

      await this.kindPromise[meta.name]
      await fsP.writeFile(path.join(PACKET_DIRECTORY, 'from-server', meta.name, '' + n + '.raw'), buffer)
      await fsP.writeFile(path.join(PACKET_DIRECTORY, 'from-server', meta.name, '' + n + '.parsed'), JSON.stringify(data, null, 2))
    })
  }
}

module.exports = MineflayerLog