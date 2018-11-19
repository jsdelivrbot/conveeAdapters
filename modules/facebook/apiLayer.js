var express = require("express");
var path = require('path')
var config = require(path.resolve('.', 'config.js'))
var request = require('request')
var facebookController=require(path.resolve('.','modules/facebook/controller.js'));
var router = express.Router();

var facebook_base_url = 'https://graph.facebook.com';
var facebook_version = 'v2.7'
var facebook_user_access_token=null

//comment this if webhook is already set
setupWebhook();


/**
 * we have already have method to handle input request by bot, so use facebookController.fbPostRequest
 */
router.post(config.ADAPTER.FACEBOOK.MESSENGER_WEBHOOK,facebookController.fbPostRequest);

router.get(config.ADAPTER.FACEBOOK.MESSENGER_WEBHOOK,facebookController.fbGetRequest);

//create an method which setup the webhook
// router.get(config.ADAPTER.FACEBOOK.MESSENGER_WEBHOOK, (req, res) => {

//     console.log("verifying webhook")
//     // Your verify token. Should be a random string.
//     let VERIFY_TOKEN = config.ADAPTER.FACEBOOK.MESSENGER_VERIFY_TOKEN;

//     // Parse the query params
//     let mode = req.query['hub.mode'];
//     let token = req.query['hub.verify_token'];
//     let challenge = req.query['hub.challenge'];

//     // Checks if a token and mode is in the query string of the request
//     if (mode && token) {

//         // Checks the mode and token sent is correct
//         if (mode === 'subscribe' && token === VERIFY_TOKEN) {

//             // Responds with the challenge token from the request
//             console.log('WEBHOOK VERIFIED');
//             res.status(200).send(challenge);

//         } else {
//             // Responds with '403 Forbidden' if verify tokens do not match
//             console.error('WEBHOOK VERIFICATION FAILED');
//             res.sendStatus(403);
//         }
//     }else{
//         console.error('WEBHOOK VERIFICATION FAILED');
//     }
// });





function setupWebhook() {

    //we need array of function to get the access token and then only we can use this method
    var arrFunction = {

        getUserAccessToken:function(){
            //var oAuthUrl = 'https://graph.facebook.com/v2.7/oauth/access_token' + '?client_id=' + this.config.applicationID + '&client_secret=' + this.config.appSecret + '&grant_type=client_credentials';
            var options = {
                method: 'GET',
                json: true,
                strictSSL : false,
                baseUrl: facebook_base_url,
                url: '/' + facebook_version + '/oauth/access_token?client_id=' + config.ADAPTER.FACEBOOK.MESSENGER_APP_ID +'&client_secret='+config.ADAPTER.FACEBOOK.MESSENGER_APP_SECRET+ '&grant_type=client_credentials',
            }
        
            request(options, function (err, res, body) {
                if (err) {
                    console.error(err);
                    return;
                } else {
                    if (body.error) {
                        console.error(body)
                    } else {
                        //console.log(body)
                        console.log("received access token:----"+body.access_token);
                        facebook_user_access_token=body.access_token;
                        arrFunction.setWebhook();
                    }
        
                }
        
            })
        },

        setWebhook:function(){
            var formData = {
                object: 'page',
                callback_url: config.CONVEE.BOT_HOST + config.ADAPTER.FACEBOOK.MESSENGER_WEBHOOK,
                verify_token: config.ADAPTER.FACEBOOK.MESSENGER_VERIFY_TOKEN,
                fields: ["message_deliveries","message_reads","messages","messaging_optins","messaging_postbacks","messaging_referrals"],
        
            }
            var options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                baseUrl: facebook_base_url,
                url: '/' + facebook_version + '/' + config.ADAPTER.FACEBOOK.MESSENGER_APP_ID + '/subscriptions?access_token='+facebook_user_access_token,
               body:JSON.stringify(formData)
            }

            console.log("url_body:"+JSON.stringify(options));
        
            request(options, function (err, res, body) {
                if (err) {
                    console.error(err);
                    return;
                } else {
                    if (body.error) {
                        console.error(body)
                    } else {
                        console.log(body)
                    }
        
                }
        
            })
        }

    }
    arrFunction.getUserAccessToken();
}

module.exports = router;