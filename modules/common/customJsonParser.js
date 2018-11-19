
var each = require('sync-each');
var jp = require('jsonpath');


module.exports = {
  parseJsonApiResponse: parseJsonApiResponse
};

function parseJsonApiResponse(message,callback){
  var userAnswer=message.answer;
  var answer_attributes = message.answer_attributes;
  var json = message.data;
  parseJsonAndReturnResult(answer_attributes, json,userAnswer,function(allAttributeAnswer){
   // console.log("parseJsonApiResponse");
    callback(allAttributeAnswer);
  });
}


function parseJsonAndReturnResult(answer_attributes,json,userAnswer,callback) {
  //assume that key is of type {name,path,value}
  //traverse through each element of an array
  each(answer_attributes,

    function (element, next) {
      var keyWithValue = getValueForAnswerAttribute(element,json);
      next(null, keyWithValue);
    },

    function (err, transformedItems) {
      //console.log("parseJsonAndReturnResult");
      //replace actual key with the key:value
      transformedItems.forEach(element => {
        userAnswer=userAnswer.replace( element.key,/*element.key +" : "+ */element.value+"\n");
      });
      callback(userAnswer)
    }

  );

}


function getValueForAnswerAttribute(key, json) {

  var finalString = "";
  var answer = [];
  answer = jp.query(json, key.path);
  if (answer && answer.length > 0) {
    //we got value for the path
    //now we have array of values convert this into the single string
    answer.forEach(element => {
      finalString = finalString + element + "\n"
    });

  } else {
    //we dont get value for the path

  }
  //assign value to the key
  key.value = finalString;
  return key;
}


