var path = require('path');
var facebookController = require(path.resolve('.', 'modules/facebook/controller.js'));
//define event emitter
const EventEmitter = require('events');
var kvs = require(path.resolve('.', 'modules/database/kvs.js'));
var kvsTags = require(path.resolve('.', 'modules/database/tags.js'));
var stringUtils = require(path.resolve('.', 'modules/common/stringUtils.js'));
var defaultMessages = require(path.resolve('.', 'modules/common/defaultMessages.js'));
var config = require(path.resolve('.', 'config.js'));
var apiHelper = require(path.resolve('.', 'modules/common/apiHelper.js'));
var genericHelper = require(path.resolve('.', 'modules/common/genericHelper.js'));
var validationHelper = require(path.resolve('.', 'modules/common/validationHelper.js'));
var messageType = require(path.resolve('.', 'modules/common/messageType.js'));

class FaceBookEvent extends EventEmitter { }

const facebookEvent = new FaceBookEvent();

/**
 * This is a intent message, discard old flow and continue new intent flow
 */
facebookEvent.on("intent_message", function (envelope) {
    console.log("Intent message");
    clearUserData(envelope.sender_id);
    startBotFlow(envelope);
})

facebookEvent.on("text_message", function (envelope) {
    console.log("text message is received:" + envelope.message.text);
    if (stringUtils.checkIfExitMessage(envelope.message.text)) {
        exitConversation(envelope.sender_id);
    } else {
        //check if data already present in kvs
        if (!kvs.get(envelope.sender_id + kvsTags.TAG_ARRAY)) {
            //data is not present
            //process this message using Luis and botintentflow
            console.log("NO DATA IN CACHE")
            startBotFlow(envelope);
        } else {
            //data is already present
            console.log("DATA FOUND IN CACHE")
            continueBotFlow(envelope);
        }
    }

});

facebookEvent.on("attachment_message", function (sender_id, message) {
    console.log("attachment message is received");
});


function startBotFlow(envelope) {
    apiHelper.GetMessagesForIntent(config.CONVEE.BOT_ID, config.CONVEE.USER_ID, envelope.message.text, function (intentName, result, resultMenuTrigger) {
        if (result) {
            if (result.length === 0) {
                sendNoneIntentMessage(envelope.sender_id);
                return;
            }
            kvs.set(envelope.sender_id + kvsTags.TAG_INTENT, intentName);
            kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, result);
            kvs.set(envelope.sender_id + kvsTags.TAG_MENU, resultMenuTrigger);
            ManageFlows(envelope);
        }
        else {
            if (resultMenuTrigger) {
                SendMenuTrigger(envelope.sender_id, resultMenuTrigger);
            }
            else {
                console.log("no data for user input");
                facebookController.sendTextMessage(envelope.sender_id, defaultMessages.NOT_SURE, 0);
            }
        }
    });
}

function continueBotFlow(envelope) {
    var result_MessageArray = kvs.get(envelope.sender_id + kvsTags.TAG_ARRAY);
    var result_MenuTrigger = kvs.get(envelope.sender_id + kvsTags.TAG_MENU);
    CheckMessageSendByUser(envelope, result_MessageArray, function (ValdiationResponse) {
        console.log("CheckMessageSendByUser:ValdiationResposne\n" + JSON.stringify(ValdiationResponse));
        if (ValdiationResponse.StartMenuTrigger) {
            SendMenuTrigger(envelope.sender_id, result_MenuTrigger);
        }
        else if (ValdiationResponse.isValid === false) {
            facebookController.sendTextMessage(envelope.sender_id, ValdiationResponse.ReturnMessage);
        }
        else {
            kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, result_MessageArray);
            kvs.set(envelope.sender_id + kvsTags.TAG_MENU, result_MenuTrigger);
            ManageFlows(envelope);
        }
    })
}





function SendMenuTrigger(sender_id, resultMenuTrigger) {
    clearUserData(sender_id)
    facebookController.sendTextMessage(sender_id, resultMenuTrigger.MenuMessage);
}

/**
 * this function check the last message sent and next message to send
 * @param {*} envelope 
 *
 */
function ManageFlows(envelope) {
    console.log("ManageFlows");
    var MessageArray = kvs.get(envelope.sender_id + kvsTags.TAG_ARRAY);
    // var MenuTrigger=kvs.get(envelope.sender_id+kvsTags.TAG_MENU);
    genericHelper.filterArray(MessageArray, function (FilteredMessageArray) {

        if (FilteredMessageArray.length > 0) {
            console.log("FilteredMessageArray.length > 0")
            SendMessage(FilteredMessageArray[0].name, envelope, FilteredMessageArray, MessageArray);

            // UPDATE FLAG IN ARRAY
            FilteredMessageArray[0].isSent = 1;

            if (FilteredMessageArray[0].name === 'Json API' && genericHelper.checkIfAllAttribSent(FilteredMessageArray[0])) {
                return;
            }

            // UPDATE TO CONTEXT
            kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, FilteredMessageArray);
            if (FilteredMessageArray[0].name !== 'Prompts' && FilteredMessageArray[0].name !== 'Location' && FilteredMessageArray[0].name !== 'Json API') {
                setTimeout(function () {
                    console.log("RECURSION CALLED - " + FilteredMessageArray[0].name)
                    ManageFlows(envelope);
                }, 5000);
            }
        }
        else {
            console.log("FilteredMessageArray.length <= 0")
            console.log("clear cache called from:ManageFlows");
            clearUserData(envelope.sender_id);
        }
    });
}

function CheckMessageSendByUser(envelope, MessageArray, callback) {

    /*
     * CHECK IF MESSAGE SENT TO USER WAS OF TYPE PROMPTS, IF YES CHECK TEXT ENTERED BY USER 
     * RETURN "isValid" = "TRUE" IF OK ELSE  
     * RETURN "isValid" = "FALSE" AND WITH MESSAGE TO SEND TO USER "ReturnMessage"
     */

    var ResultResponse = {
        isValid: true,
        ReturnMessage: '',
        StartMenuTrigger: false,
        exitConversation: false
    }
    //console.log("Last message:"+JSON.stringify(MessageArray));
    genericHelper.getlastPromptSentToUser(MessageArray, function (SentMessage) {

        // console.log("999999 SentMessage - " + JSON.stringify(SentMessage))

        if (SentMessage) {
            console.log("Last message type is: " + SentMessage.name);
            if (SentMessage.name === 'Prompts') {
                ResultResponse = validationHelper.checkIfPromptInputIsCorrect(envelope.message.text, SentMessage, ResultResponse);
                //LOG ANSWER 
                if (ResultResponse.isValid) {
                    SentMessage.answer = envelope.message.text;
                    facebookController.sendTextMessage(envelope.sender_id, defaultMessages.PROMPT_ACKNOWLEDGED, 0);
                }
                if (ResultResponse.exitConversation) {
                    clearUserData(envelope.sender_id);
                    return;
                }

                callback(ResultResponse);

            } else if (SentMessage.name === 'Json API') {
                //if last message is a JSON API message
                // console.log('Last message is a JSON API message');
                bindParameterAnswerToJsonApi(envelope, SentMessage, function () {
                    callback(ResultResponse);
                });

            } else {
                // if last send message is of any other type
                // LAST SENT MESSAGE WAS NOT PROMPTS
                callback(ResultResponse);
            }

        }
        else {
            //NO LAST SENT MESSAGE FOUND, MAY BE FIRST MESSAGE
            console.info('NO LAST SENT MESSAGE FOUND, MAY BE FIRST MESSAGE');
            callback(ResultResponse);
        }
    });
}


function bindParameterAnswerToJsonApi(envelope, SentMessage, callback) {
    //check the last asked question
    //if the issent=1 of last question, it means the current answer is belong to this question
    var binded = false;
    console.log("Last sent Message:" + JSON.stringify(SentMessage));
    var each = require('sync-each');
    each(SentMessage.attribute,
        function (element, next) {
            if (!binded) {
                if (element.isSent === 0) {
                    //bind this answer to the question
                    element.answer = envelope.message.text;
                    console.log("\n Question:" + element.question + "\n Answer:" + envelope.message.text)
                    element.isSent = 1;
                    binded = true;
                    next(null, element);
                } else {
                    next(null, element);
                }
            } else {
                next(null, element)
            }
        },
        function (err, transformedItems) {
            console.log("transformedItems:" + JSON.stringify(transformedItems));
            SentMessage.attribute = transformedItems;
            // console.log("bindParameterAnswerToJsonApi##" + "DB set:" + event.user.id + 'MessageArray' + "::::" + [SentMessage]);
            kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, [SentMessage])
            //Success callback
            callback();
        }
    );

}


function SendMessage(type, envelope, FilteredMessageArray, MainMessageArray, resultMenuTrigger) {
    console.log("SendFBMessages")
    //var DurationTime = parseInt(FilteredMessageArray[0].duration) * 1000;
    var DurationTime = genericHelper.getLastSentMsgDuration(MainMessageArray);
    console.error("DurationTime:" + DurationTime);
    //console.log("Type of receive message is: "+type);
    switch (type) {

        case messageType.TEXT:
            {
                facebookController.sendTextMessage(envelope.sender_id, FilteredMessageArray[0].data, DurationTime);
            }
            break;
        case messageType.PROMPT:
            {
                if (FilteredMessageArray[0].entityType === '@sys.confirm'||FilteredMessageArray[0].entityType === '@sys.choice') {
                    facebookController.sendConfirmPrompt(envelope.sender_id, FilteredMessageArray[0], DurationTime);
                }
                else {
                    facebookController.sendTextMessage(envelope.sender_id, FilteredMessageArray[0].data, DurationTime);
                }
            }
            break;
        case messageType.BUTTON:
            {
                facebookController.sendButtonMessage(envelope.sender_id, kvs.get(envelope.sender_id + kvsTags.TAG_INTENT), FilteredMessageArray[0], DurationTime);
            }
            break;
        case messageType.IMAGE:
            {
                facebookController.sendImageMessage(envelope.sender_id, FilteredMessageArray[0].data, DurationTime);
            }
            break;

        case messageType.AUDIO:
            {
                facebookController.sendAudioMessage(envelope.sender_id, FilteredMessageArray[0].data, DurationTime);
            }
            break;
        case messageType.VIDEO:
            {
                facebookController.sendVideoMessage(envelope.sender_id, FilteredMessageArray[0].data, DurationTime);
            }
            break;

        case messageType.LOCATION:
            {
                bp.messenger.sendText(envelope.user.id, "Please click this button to give me your location",
                    CreateLocationQuestion())
                    .then(() => {
                        console.log("LOCATION ASKED");
                    })

            }
            break;
        case messageType.ACCESS:
            {
                var FaceAccessURL = "https://www.facebook.com/v2.11/dialog/oauth?response_type=token&display=popup" +
                    "&client_id=" + process.env.MESSENGER_APP_ID +
                    "&redirect_uri=" + process.env.SERVER_URL + "/FBcaller.html&state=" + envelope.user.id +
                    "&scope=email,user_about_me,user_birthday,user_education_history,user_friends,user_hometown,user_likes,user_location,user_relationships,user_status,user_videos,user_website,user_work_history,user_actions.books,user_actions.music,user_actions.video,user_actions.fitness,user_actions.news"

                bp.messenger.sendTemplate(envelope.user.id, {
                    template_type: 'generic',
                    elements: [{
                        title: "Click to share some basic info with us",
                        item_url: FaceAccessURL,
                        image_url: "https://130e178e8f8ba617604b-8aedd782b7d22cfe0d1146da69a52436.ssl.cf1.rackcdn.com/8-tips-on-cyber-threat-info-sharing-showcase_image-4-a-7520.jpg"

                    }]
                });
            }
            break;

        case messageType.JSON_API:
            console.log("Json API")
            //send response to fb
            // console.log("Array of message : " + JSON.stringify(FilteredMessageArray));
            var item = FilteredMessageArray[0];
            //check if request has parameters
            if (item.attribute && item.attribute.length > 0) {
                //parameters are associated with this url
                for (var i = 0; i < item.attribute.length; i++) {
                    var attribute = item.attribute[i];
                    if (attribute.isSent === 0) {
                        console.log("" + attribute.question);
                        facebookController.sendTextMessage(envelope.sender_id, attribute.question, 0);
                        break;
                    }
                    //check if this is a last index
                    if (i === item.attribute.length - 1) {
                        //we have got all the parameters value from user
                        console.log("we have got all the parameters value from user");
                        sendJSONAPIResponse(envelope.sender_id, item, function (result) {
                            //mark this message as sent,save in db
                            FilteredMessageArray[0].answer_sent = 1;
                            kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, FilteredMessageArray);
                            ManageFlows(envelope);
                        });
                    }

                }

            } else {
                // no parameters are associated with this url, directly call this api
                console.log("no parameters are associated with this url, directly call this api")
                sendJSONAPIResponse(envelope.sender_id, item, function (result) {
                    //mark this message as sent,save in db
                    FilteredMessageArray[0].answer_sent = 1;
                    kvs.set(envelope.sender_id + kvsTags.TAG_ARRAY, FilteredMessageArray);
                    ManageFlows(envelope);
                });
            }
            break;

        case messageType.CAROUSEL:
            facebookController.sendTemplateMessage(envelope.sender_id, kvs.get(envelope.sender_id + kvsTags.TAG_INTENT), FilteredMessageArray[0], 0);
            break;
    }

}


function sendJSONAPIResponse(sender_id, item, responseCallback) {
    apiHelper.constructJSONAPIRequestAndGetResponse(item, (err, response) => {
        if (err) {
            console.log("finalAnswer:" + response);
            facebookController.sendTextMessage(sender_id, response, 0);
            responseCallback(response);
        } else {
            // var finalAnswer = item.answer.replace(/(@@\S+)/gi, response);
            console.log("finalAnswer:" + response);
            // if length of the message is more than 639, send message in chunks
            var msgChunk = response.match(/.{1,639}/g);

            var each = require('sync-each');
            each(msgChunk,
                function (chunk, next) {

                    setTimeout(function () {
                        facebookController.sendTextMessage(sender_id, chunk, 0);
                        next(null, chunk);
                    }, 1000);

                },

                function (err, transformedItems) {
                    console.log("all chunck messages sent");
                    responseCallback(response);
                }

            );


        }
    });
}




function sendDelayedMessage(sender_id, message, delay) {
    setTimeout(function () {
        facebookController.sendTextMessage(sender_id, message);
    }, delay);
}


/**
 * cleared all the local data of user
 * @param {*} sender_id 
 */
function clearUserData(sender_id) {
    kvs.remove(sender_id + kvsTags.TAG_INTENT);
    kvs.remove(sender_id + kvsTags.TAG_ARRAY);
    kvs.remove(sender_id + kvsTags.TAG_MENU);
    console.log("user data is cleared");
}


/**
 * Use this method when luis found no intent match
 * @param {*} sender_id 
 */
function sendNoneIntentMessage(sender_id) {
    clearUserData(sender_id);
    facebookController.sendTextMessage(sender_id, defaultMessages.NONE_INTENT_MESSAGE, 1000);
}

/**
 * Use this method when user is stuck or want to start over the conversation
 * @param {*} sender_id 
 */
function exitConversation(sender_id) {
    clearUserData(sender_id);
    facebookController.sendTextMessage(sender_id, defaultMessages.EXIT, 1000);
}

module.exports = facebookEvent;