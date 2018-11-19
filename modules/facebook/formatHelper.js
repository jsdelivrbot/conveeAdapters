var path = require('path');
var messageType = require(path.resolve('.', 'modules/common/messageType.js'));
var kvs = require(path.resolve('.', 'modules/database/kvs.js'));

function getChannelMessageType(message) {

    if (message.attachments) {
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
function constructAndReturnTemplateFromMessage(intentName,message) {
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
        //check if buttons have data, if not then use default data
        if(!element.buttons||element.buttons.length<=0){
       
            if(!intentName){
                intentName="Exit";
            }
            element.buttons=[intentName]
        }
    

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

function constructAndReturnAttachmentFromMessage(type, data) {
    var message = {
        attachment: {
            "type": type,
            payload: {
                url: data,
                is_reusable: true
            }
        }
    }
    return message;
}

function constructAndReturnButtonsFromMessage(intentName, data) {

    //check if buttons have data, if not then use default data
    if (!data.buttonoptions || data.buttonoptions.length <= 0) {

        if (!intentName) {
            intentName = "Exit";
        }
        data.buttonoptions = [intentName]
    }

    //return quick reply buttons
    var message = {
        text: data.data,
        quick_replies: []
    }


    data.buttonoptions.forEach(buttonElement => {
        var buttonItem = {
            content_type: "text",
            title: buttonElement,
            payload: buttonElement,
        }
        message.quick_replies.push(buttonItem);
    });



    // return normal buttons
    // var message = {
    //     attachment: {
    //         type: "template",
    //         payload: {
    //             template_type: "button",
    //             text: data.data,
    //             buttons: []
    //         }
    //     }
    // }

    // data.buttonoptions.forEach(buttonElement => {
    //     var buttonItem = {
    //         type: "postback",
    //         payload: buttonElement,
    //         title: buttonElement
    //     }
    //     message.attachment.payload.buttons.push(buttonItem);
    // });
    return message;
}


function constructAndReturnConfirmPromptMessage(data) {

    var message = {
        text: data.data,
        quick_replies: [
            {
                content_type: "text",
                title: "Yes",
                payload: "",

            },
            {
                content_type: "text",
                title: "No",
                payload: ""

            }
        ]
    }

    return message;
}

module.exports = {
    getChannelMessageType: getChannelMessageType,
    constructAndReturnTemplateFromMessage: constructAndReturnTemplateFromMessage,
    constructAndReturnAttachmentFromMessage: constructAndReturnAttachmentFromMessage,
    constructAndReturnButtonsFromMessage: constructAndReturnButtonsFromMessage,
    constructAndReturnConfirmPromptMessage: constructAndReturnConfirmPromptMessage
}