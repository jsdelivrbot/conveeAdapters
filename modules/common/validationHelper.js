var validator = require('validator');

module.exports = {
  checkIfPromptInputIsCorrect: checkIfPromptInputIsCorrect,

};

function checkIfPromptInputIsCorrect(text, SentMessage, ResultResponse) {

  /*
   * CHECK IF MESSAGE SENT TO USER WAS OF TYPE PROMPTS, IF YES CHECK TEXT ENTERED BY USER 
   * RETURN "isValid" = "TRUE" IF OK ELSE  
   * RETURN "isValid" = "FALSE" AND WITH MESSAGE TO SEND TO USER "ReturnMessage"
   */
  switch (SentMessage.entityType) {
    case '@sys.date':
      {
        //  moment(event.text, moment.ISO_8601, true).isValid(); // true
        var moment = require('moment');
        var date = moment(text);
        ResultResponse.isValid = date.isValid();
        if (!ResultResponse.isValid)
          ResultResponse.ReturnMessage = "Please enter valid date";
      }
      break;
    case '@sys.number':
      {
        if (isNaN(text)) {
          ResultResponse.isValid = false;
          ResultResponse.ReturnMessage = "Please enter valid number";
        }
        else {
          ResultResponse.isValid = true;
        }
      }
      break;
    case '@sys.email':
      {
        if (validator.isEmail(text)) {
          ResultResponse.isValid = true;
        }
        else {
          ResultResponse.isValid = false;
          ResultResponse.ReturnMessage = "Please enter valid email";
        }

      }
      break;
    case '@sys.duration':
      {
        ResultResponse.isValid = true;
        ResultResponse.ReturnMessage = "Please enter valid duration";
      }
      break;
    case '@sys.string':
      {
        ResultResponse.isValid = true;
        ResultResponse.ReturnMessage = "";
      }
      break;
    case '@sys.percentage':
      {
        var text = text;
        //remove unwanted keywards,expressions,symbols
        text = text.replace('%', '');
        text = text.replace('percentage', '');
        text = text.replace('percentile', '');

        if (parseInt(text) <= 0 || parseInt(text) > 100) {
          ResultResponse.isValid = false;
          ResultResponse.ReturnMessage = "Please enter valid percentage";
        }
        else {
          ResultResponse.isValid = true;
        }
      }
      break;
    case '@sys.age':
      {
        if (parseInt(text) >= 120) {
          ResultResponse.isValid = false;
          ResultResponse.ReturnMessage = "Please enter valid age";
        }
        else {
          ResultResponse.isValid = true;
        }
      }
      break;
    case '@sys.confirm':
      {
        if (
          text.toLowerCase() === 'yes' || text.toLowerCase() === 'yup' ||
          text.toLowerCase() === 'yea' || text.toLowerCase() === 'y' ||
          text.toLowerCase() === '1' || text.toLowerCase() === 'no' ||
          text.toLowerCase() === 'nope' || text.toLowerCase() === 'na' ||
          text.toLowerCase() === 'n' || text.toLowerCase() === '0') {

          // SET VALID FLAG
          ResultResponse.isValid = true;
          if (
            text.toLowerCase() === 'yes' || text.toLowerCase() === 'yup' ||
            text.toLowerCase() === 'yea' || text.toLowerCase() === 'y' ||
            text.toLowerCase() === '1') {

            // SET IF WE NEED MENU TRIGGER
            ResultResponse.StartMenuTrigger = false;
            ResultResponse.ReturnMessage = "Please enter valid age";
          }
          else {
            // SET IF WE NEED MENU TRIGGER
            //user has confirmed 'No' as an answer, so exit current conversation

            ResultResponse.exitConversation=true;
            ResultResponse.StartMenuTrigger = false;
          }
        }
        else {
          ResultResponse.ReturnMessage = "Please type 'yes' or 'no'";
          ResultResponse.isValid = false;
          //ResultResponse.ReturnMessage = SentMessage.data + ", Please enter valid option Yes or No?";
          ResultResponse.StartMenuTrigger = false;

        }
      }
      break;
    default:
      console.log("Entity type not found..");
  }

  return ResultResponse;
}