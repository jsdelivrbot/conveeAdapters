function checkIfExitMessage(message) {
    var exitArray = ["startover","start over","reset","restart","quit","exit"];
    if (exitArray.indexOf(message.toLowerCase().trim()) >= 0) {
        return true;
    }
    return false;
}

module.exports={

    checkIfExitMessage:checkIfExitMessage

}