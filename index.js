require('dotenv').config()
const { log, debug } = console

const { BOT_TOKEN, ADMIN_CHAT_ID } = process.env
const TelegramBot = require('node-telegram-bot-api')
const request = require('request')
const fs = require('fs')
const csv = require('csvtojson')

const bot = new TelegramBot(BOT_TOKEN, { polling: true })

/**
 * Get document from user
 * Convert to json
 * Send to user
 * Delete json from file system
 */
bot.on('message', async (props) => {
  const { chat: { id: chatId, first_name, username }, document = null } = props;

  bot.sendMessage(ADMIN_CHAT_ID, `${first_name} is using your bot. Contact: @${username || "nousername"}`)

  if (!document) {
    return bot.sendMessage(chatId, 'Sorry you must send a file');
  }

  const { file_id, file_name } = document;
  const fileName = `files/${file_name.replace('.csv', '.json')}`
  const jsonData = [];
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

    const profile = { chatId, fileName }

    csv()
      .fromStream(request.get(csvPath))
      .subscribe(
        nextJsonData => jsonData.push(nextJsonData),
        onCsvError,
        () => onCsvCompleted(jsonData, profile)
      );
  }
})

const onCsvError = err => log('onCsvError', err)
const onCsvCompleted = (jsonData, profile) => writeJsonDataIntoFile(jsonData, profile)
const writeJsonDataIntoFile = (jsonData, { fileName, chatId }) => {
  fs.writeFile(fileName, JSON.stringify(jsonData), async err => {
    if (err) {
      return log('Error while inserting', err)
    }

    await bot.sendDocument(chatId, fileName);

    return fs.unlinkSync(fileName);
  })
}
