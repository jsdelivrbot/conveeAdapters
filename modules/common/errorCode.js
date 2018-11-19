
//follow hotel room numbering standards for error codes

module.exports ={

    API_INVALID_RESPONSE:{
        code:101,
        message:"Invalid response",
        bot_message:"Sorry, unable to process your request",
        description:"This error usually occures when the format of output is not a valid json"
    },

    API_EMPTY_RESPONSE:{
        code:102,
        message:"Empty response",
        bot_message:"We don't found any information regarding this",
        description:"It means that api has no data and returns empty response"
    },

    API_UNKNOWN_EXCEPTION:{
        code:102,
        message:"Unknown exception",
        bot_message:"Sorry, Unable to complete your request.\n Please try again",
        description:"Some unknown error is occured which is not known to system"
    }

}