var path = require('path');
//var kvs = require(path.resolve('.','modules/database/kvs.js'));
const Bot = require('messenger-bot')
var config = require(path.resolve('.', 'config.js'))
var formatHelper = require(path.resolve('.', 'modules/facebook/formatHelper.js'))
var messageType = require(path.resolve('.', 'modules/common/messageType.js'));



let bot = new Bot({
  token: config.ADAPTER.FACEBOOK.MESSENGER_ACCESS_TOKEN,
  verify: config.ADAPTER.FACEBOOK.MESSENGER_VERIFY_TOKEN,
  app_secret: config.ADAPTER.FACEBOOK.MESSENGER_APP_SECRET
})

bot.on('error', (err) => {
  console.log(err.message)
})

/**
 * Triggered when a message or quick reply is sent to the bot.
 */
bot.on('message', (payload, reply, actions) => {

  //send typing to user
  actions.markRead();
  actions.setTyping(true);

  // console.log("Received message:" + JSON.stringify(payload.message));
  //now we have recieved message, classify this messages

  var envelope = {
    "sender_id": payload.sender.id,
    "message": payload.message,
  };

  //get type of the facebook message
  var conversation = require(path.resolve('.', 'modules/facebook/conversation.js'));//dont do this globally as it will create circular dependency and export wont work
  var type = formatHelper.getChannelMessageType(payload.message);
  if (type === messageType.TEXT) {
    conversation.emit("text_message", envelope);
  } else {
    //send default message to user
    conversation.emit("attachment_message", envelope);
  }

})

/**
 * Triggered when a postback is triggered by the sender in Messenger. 
 * */
bot.on('postback', (payload, reply, actions) => {
  //send typing to user
  actions.markRead();
  actions.setTyping(true);
  //reply({ text: 'You have clicked the button' }, (err, info) => { })
  var conversation = require(path.resolve('.', 'modules/facebook/conversation.js'));//dont do this globally as it will create circular dependency and export wont work
  var envelope = {
    "sender_id": payload.sender.id,
    "message": { text: payload.postback.title }
  };
  conversation.emit("intent_message", envelope);

})

var fbGetRequest = function (req, res) {
  console.log("Verifying token....");
  return bot._verify(req, res)
}

var fbPostRequest = function (req, res) {
  //console.log("fbPostRequest");
  try {
    bot._handleMessage(req.body)
  } catch (e) { console.error(e) }
  res.end(JSON.stringify({ status: 'ok' }))
}

var sendTextMessage = function (sender_id, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, { text: message });
//test message delay
   // bot.sendMessage(sender_id, { text: require('moment')().toString()});
  }, delay);
}

/**Type of attachment, may be image, audio, video, file or template. For assets, max file size is 25MB.*/
function sendAudioMessage(sender_id, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnAttachmentFromMessage('audio', message));
  }, delay);

}

function sendVideoMessage(sender_id, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnAttachmentFromMessage('video', message));
  }, delay);

}

function sendImageMessage(sender_id, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnAttachmentFromMessage('image', message));
  }, delay);

}

function sendConfirmPrompt(sender_id, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnConfirmPromptMessage(message));
  }, delay);
}

function sendButtonMessage(sender_id, intentName, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnButtonsFromMessage(intentName, message));
  }, delay);
}


function sendTemplateMessage(sender_id,intentName, message, delay) {
  setTimeout(function () {
    bot.sendMessage(sender_id, formatHelper.constructAndReturnTemplateFromMessage(intentName,message));
  }, delay);

}

var test = function () {
  console.log("Testing is done..!!");
}

module.exports = {
  fbPostRequest: fbPostRequest,
  fbGetRequest: fbGetRequest,
  sendTextMessage: sendTextMessage,
  sendButtonMessage: sendButtonMessage,
  sendTemplateMessage: sendTemplateMessage,
  sendImageMessage: sendImageMessage,
  sendAudioMessage: sendAudioMessage,
  sendVideoMessage: sendVideoMessage,
  sendConfirmPrompt: sendConfirmPrompt,
  test: test
}

