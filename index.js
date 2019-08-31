require('dotenv').config()
const { log, debug } = console

const { BOT_TOKEN } = process.env
const TelegramBot = require('node-telegram-bot-api')
const request = require('request')
const fs = require('fs')
const csv = require('csvtojson')

const bot = new TelegramBot(BOT_TOKEN, { polling: true })

const jsonData = []

/**
 * Get document from user
 */
bot.on('message', async (props) => {
  const { chat: { id: chatId }, document = null } = props;

  debug('Current user', props)

  if (!document) {
    return bot.sendMessage(chatId, 'Sorry this must be a file');
  }

  const { file_id, file_name } = document;
  let file;

  try {
    file = await bot.getFile(file_id)
  } catch (error) {
    log('bot.getFile: ', error)
    return bot.sendMessage(chatId, `Something is wrong with your file maybe its too large`);
  }

  if (file) {
    const { file_path } = file;
    const csvPath = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`

    csv()
      .fromStream(request.get(csvPath))
      .subscribe(
        onJsonReceived,
        onCsvError,
        () => onCsvCompleted(file_name)
      );
  }
})

const onJsonReceived = nextJsonData => {
  log('recieved', nextJsonData)
  jsonData.push(nextJsonData)
}
const onCsvError = err => log('onCsvError', err)
const onCsvCompleted = filename => log('onJsonReceived: ', jsonData, '\nfilename: ', filename)


// Insert the file
const writeFile = () => {
  fs.writeFile()
}
// Send the file
// Delete the file from the file system
