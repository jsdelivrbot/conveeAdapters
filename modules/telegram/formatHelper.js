var path = require('path');
var messageType = require(path.resolve('.', 'modules/common/messageType.js'));

function getChannelMessageType(message) {

    if (message.MessageMedia) {
        return messageType.ATTACHMENT;
    }

    if (message.text) {
        return messageType.TEXT;
    }
    return messageType.NONE;
}

/**
 * Create payload for carousel
 * @param {*} message message from bot intent flow
 */
function constructAndReturnTemplateFromMessage(message) {
    // console.log(JSON.stringify(message));


    var messageFormat = {
        attachment: {
            type: "template",
            payload: {}
        }
    }
    var template = {
        template_type: 'generic',
        elements: []
    }

    message.carousel.forEach(element => {

        var item = {
            title: element.title,
            subtitle: element.desc,
            item_url: element.linkUrl,
            image_url: element.imageUrl,
            buttons: []
        }


        //now for each item get the button data(these buttons will acts as a intent)
        element.buttons.forEach(buttonElement => {
            var buttonItem = {
                type: "postback",
                payload: buttonElement,
                title: buttonElement
            }
            item.buttons.push(buttonItem);

        });

        // item.buttons=element.intent.split('|');
        template.elements.push(item);

    });

    messageFormat.attachment.payload = template;
    return messageFormat;
}


function constructAndReturnButtonsFromMessage(intentName,data) {
    var buttons = [];
    //check if buttons have data, if not then use default data
    if(!data.buttonoptions||data.buttonoptions.length<=0){
   
        if(!intentName){
            intentName="Exit";
        }
        data.buttonoptions=[intentName]
    }

    data.buttonoptions.forEach(buttonElement => {
        var buttonItem = {
            text: buttonElement,
            callback_data: JSON.stringify({
                'type': messageType.INTENT_BUTTON,
                'text': buttonElement
            })
        }
        buttons.push(buttonItem);
    });

    var message = {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
            inline_keyboard: [buttons]
        })
    };

    return message;
}



function constructAndReturnConfirmPromptMessage(data){

    var buttons = [
        {
            text: "Yes",
            callback_data: JSON.stringify({
                'type': messageType.CONFIRM_PROMPT_BUTTON,
                'text': "Yes"
            })
        },

        {
            text: "No",
            callback_data: JSON.stringify({
                'type': messageType.CONFIRM_PROMPT_BUTTON,
                'text': "No"
            })
        }
    ];
   

    var message = {
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
            inline_keyboard: [buttons]
        })
    };

    return message;
 }

module.exports = {
    getChannelMessageType: getChannelMessageType,
    constructAndReturnTemplateFromMessage: constructAndReturnTemplateFromMessage,
    constructAndReturnButtonsFromMessage: constructAndReturnButtonsFromMessage,
    constructAndReturnConfirmPromptMessage:constructAndReturnConfirmPromptMessage
}