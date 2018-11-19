var request = require("request");
var path = require('path');
var customJsonParser = require(path.resolve('.', 'modules/common/customJsonParser.js'));
var errorCode = require(path.resolve('.', 'modules/common/errorCode.js'));
var config = require(path.resolve('.', 'config.js'));
module.exports = {
    GetMessagesForIntent: GetMessagesForIntent,
    saveLocationData: saveLocationData,
    constructJSONAPIRequestAndGetResponse: constructJSONAPIRequestAndGetResponse
};


function saveLocationData(PlatformUserId, LocationData) {

    var LocationPostURL = process.env.SERVER_URL + '/home/saveLocationData';
    var LocationBody =
    {
        id: PlatformUserId,
        locationData: LocationData
    }

    console.error("LocationPostURL - " + LocationPostURL);
    console.error(LocationBody);
    request({
        url: LocationPostURL,
        method: 'POST',
        body: LocationBody,
        json: true
    }, function (err, res) {
        if (err) {
            console.error("Error in saveLocationData CALL - " + err);
        } else {
        }
    })

}

function GetMessagesForIntent(botId, userId, message, callback) {
    var chatLogUrl = config.CONVEE.SERVER_URL + '/home/getMessagesForIntentV2';
    var logBody =
    {
        BotId: botId,
        userID: userId,
        message: message,
        isLuisCall: 0
    }

    console.error("chatLogUrl - " + chatLogUrl);
    console.error(JSON.stringify(logBody));
    request({
        url: chatLogUrl,
        method: 'POST',
        body: logBody,
        json: true
    }, function (err, res) {
        try {
            if (err) {
                console.error("Error in GET MESSAGE CALL - " + err);
            } else {
                console.log(JSON.stringify(res.body));
                if (res.body && res.body.result && res.body.result.BotIntentFlow) {
                    res.body.result.BotIntentFlow.forEach(function (element, index) {
                        // if (index > 0) {
                        //     if (element.duration === undefined) {
                        //         element.duration = res.body.result.BotIntentFlow[index - 1].duration;
                        //     }
                        //     else {
                        //         element.duration = parseInt(element.duration) + parseInt(res.body.result.BotIntentFlow[index - 1].duration);
                        //     }
                        //     console.log(element.duration);
                        // }

                        if (index == 0) {
                            element.duration = 0;
                        } else {
                            if (element.duration === undefined) {
                                element.duration = res.body.result.BotIntentFlow[index - 1].duration;
                            }
                            else {
                                element.duration = parseInt(element.duration) + parseInt(res.body.result.BotIntentFlow[index - 1].duration);
                            }
                            console.log(element.duration);

                        }

                    }, this);

                    callback(res.body.result.IntentName, res.body.result.BotIntentFlow, res.body.result.menutrigger);
                }
                else {
                    console.error("GetMessagesForIntent  -- NO DATA FROM API FOR MEESAGE ARRAY");
                    callback(null, null, null);
                }
            }
        } catch (exception) {
            console.error(exception);
            callback(null, null, null);
        }
    })
}


/**
 * Construct an request from Json API message and parse the response
 * @param {} message  Json API message from botIntentFlow
 * @param {*} callback 
 */
function constructJSONAPIRequestAndGetResponse(message, callback) {

    //  console.log("constructJSONAPIRequestAndGetResponse");
    try {
        //url extract
        var url = message.endpoint_url;
        var requestBody = {};

        if (message.attribute.length > 0) {
            if (message.api_type === 'GET') {
                //query string
                url = url + "?";
                message.attribute.forEach(attribute => {
                    //get values for all the parameters
                    url = url + attribute.key + "=" + attribute.answer + "&&";
                })
                //trim extra characters in url
                url = url.trimRight('&&')
            } else {
                message.attribute.forEach(attribute => {
                    //get values for all the parameters
                    requestBody[attribute.key] = attribute.answer;

                })
                console.log("body:" + JSON.stringify(requestBody));
            }
        }

        console.log("data url:" + url);
        //construct url request
        var content_type;
        //set the content type
        if (url.indexOf('weather') >= 0) {
            content_type = 'application/javascript'
        } else {
            content_type = 'application/json'
        }

        var axios = require('axios');
        var options = {
            method: message.api_type,
            url: url,
            data: requestBody,
            headers: {
                "Content-Type": content_type
            }
        }

        console.log("request options:" + JSON.stringify(options));
        axios(options)
            .then(function (axios_response) {
                console.log("returned response is :" + JSON.stringify(axios_response.data));
                if (axios_response.data) {
                    //we need custom parser to parse the response
                    message.data = axios_response.data;
                    customJsonParser.parseJsonApiResponse(message, function (response) {
                        callback(false, response)
                    });

                }
                else {
                    callback(true, errorCode.API_EMPTY_RESPONSE.bot_message);
                }
            })
            .catch(function (error) {
                console.error(error);
                callback(true, errorCode.API_INVALID_RESPONSE.bot_message);
            });

    } catch (error) {
        console.error(JSON.stringify("catch:" + error));
        callback(true, errorCode.API_UNKNOWN_EXCEPTION.bot_message);
    }

}


