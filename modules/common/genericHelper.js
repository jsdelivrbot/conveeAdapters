
function checkifNoOrYes(text, callback) {

  var yes = ['yes', 'yup', 'yea', 'y', '1'];
  var no = ['nein', 'no', 'nope', '0', 'n'];

  var Result = {
    IsYes: false,
    IsNo: false
  }
  console.log("checkifNoOrYes----------------------" + text);
  yes.forEach(function (element) {
    if (element.toLocaleLowerCase() === text.toLocaleLowerCase() && Result.IsYes == false) {
      Result.IsYes == true;
      callback(Result);
    }
  }, this);

  if (Result.IsYes === false)
    no.forEach(function (element) {
      if (element.toLocaleLowerCase() === text.toLocaleLowerCase() && Result.IsNo == false) {
        Result.IsNo == true;
        callback(Result);
      }
    }, this);
}


function filterArray(ArrayToFilter, callback) {

  var ResultArray = [];
  if (ArrayToFilter && ArrayToFilter.length) {
    ArrayToFilter.forEach(function (element) {
      if (element.name === 'Json API' && element.answer_sent != 1) {
        ResultArray.push(element);
      }
      else if (element.isSent === 0) {
        ResultArray.push(element);
      }
    }, this);
  }
  callback(ResultArray);
}


function checkIfAllAttribSent(message) {

  //check if all attribure are set
  var allAttribSent = true;
  if (message.attribute && message.attribute.length > 0) {
    for (var i = 0; i < message.attribute.length; i++) {
      if (message.attribute[i].isSent === 0) {
        allAttribSent = false;
      }
    }

  }
  console.log("checkIfAllAttribSent:" + allAttribSent);
  return allAttribSent;

}

function getlastPromptSentToUser(ArrayToFilter, callback) {

  var ResultArray = [];

  if (ArrayToFilter && ArrayToFilter.length) {
    ArrayToFilter.forEach(function (element) {
      if (element.isSent === 1) {
        ResultArray.push(element);
      }
    }, this);
  }
  callback(ResultArray[0]);
}

function simpleStringify(object) {
  var simpleObject = {};
  for (var prop in object) {
    if (!object.hasOwnProperty(prop)) {
      continue;
    }
    if (typeof (object[prop]) == 'object') {
      continue;
    }
    if (typeof (object[prop]) == 'function') {
      continue;
    }
    simpleObject[prop] = object[prop];
  }
  return JSON.stringify(simpleObject); // returns cleaned up JSON
};

function getLastSentMsgDuration(arrMsg) {

  var duration = 0;
  try {
    if (arrMsg && arrMsg.length) {
      for (let index = 0; index < arrMsg.length; index++) {
        var currentMsg = arrMsg[index];
        if (currentMsg.isSent === 0) {
          //if this is not a first message
          if (index != 0) {
            duration = 0;
            var lastMsg = arrMsg[index - 1];
            console.error(lastMsg.duration);
            duration = parseInt(lastMsg.duration) * 1000;
          }
          break;
        }
      }
    }
  } catch (e) { console.error(e) }

  return duration;
}


module.exports = {
  simpleStringify: simpleStringify,
  filterArray: filterArray,
  getlastPromptSentToUser: getlastPromptSentToUser,
  checkifNoOrYes: checkifNoOrYes,
  checkIfAllAttribSent: checkIfAllAttribSent,
  getLastSentMsgDuration: getLastSentMsgDuration
};