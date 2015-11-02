var Slack = require('slack-client');

var slackToken = 'xoxb-13702579492-EBTrIDavIVmMhYcKoCmbBegm'; // Add a bot at https://my.slack.com/services/new/bot and copy the token here.
var autoReconnect = true; // Automatically reconnect after an error response from Slack.
var autoMark = true; // Automatically mark each message as read after it is processed.

var slack = new Slack(slackToken, autoReconnect, autoMark);

var activeGames = [];

slack.on('open', function(){
  console.log("Connected to " + slack.team.name + " as " + slack.self.name + ".");
});

slack.on('message', function(msg){
  var channel = slack.getChannelGroupOrDMByID(msg.channel);
  var sender = slack.getUserByID(msg.user);
  
  var usersMentioned = [];
  
  if(msg.text !== undefined){
    
    //the following block of logic gets a list of user ids mentioned in the message  
    if(msg.text.indexOf("<@") > -1){
      var messageSegments = msg.text.split("<@");
      for(var s = 0; s < messageSegments.length; s++){
          // get the mentioned user id, isolated from the surrounding text
          var userId = messageSegments[s].substr(0, 9);
          usersMentioned[s] = userId;
      }
    }

    //if the first user mentioned was this bot, we take action
    if(usersMentioned[1] === slack.self.id){
      
      //if the text contains "roll", "die", or "dice", we'll send a random dice result back
      if(msg.text.toLowerCase().indexOf("roll") > -1 || msg.text.toLowerCase().indexOf("dice") > -1 || msg.text.toLowerCase().indexOf("die") > -1){
        console.log("<@" + sender.id + "> (@" + sender.name + ") rolled the dice!");
        channel.send(rollDice(2));
      } 
      else //we only want to handle one game at a time
      if(msg.text.toLowerCase().indexOf("flip") > -1 || msg.text.toLowerCase().indexOf("coin") > -1){
        // if "coin" or "flip" were mentioned, we're starting a coin flip game
        if(usersMentioned[2] !== undefined){
          channel.send("<@" + sender.id + "> is flipping a coin, <@" + usersMentioned[2] + ">: call heads or tails!");
          console.log("<@" + sender.id + "> challenged <@" + usersMentioned[2] + ">.");
          
          //add this game to the active games list, so that when we receive a response from a caller we can finish the game
          activeGames.push({
            challenger: sender.id,
            caller: usersMentioned[2]
          });
          
        } else {
          channel.send("Didn't quite understand. Try `@gamble-bot: flip a coin against @slackbot`.");
          console.log("Received invalid input, offered suggested syntax.");
        }
      }
    }
    
    //if the sender of the message is in the list of active games, we can check for a heads/tails response
    for(var e = 0; e < activeGames.length; e++){
      if(activeGames[e].caller === sender.id){
        var thisGame = activeGames[e];
        if(msg.text.toLowerCase().indexOf("heads") > -1 && msg.text.toLowerCase().indexOf("tails") < 0){
          if(flippedCoinWasHeads()){
            channel.send("It's heads! <@" + thisGame.caller + "> beats <@" + thisGame.challenger + ">!");
            console.log("Heads, <@" + thisGame.caller + "> beats <@" + thisGame.challenger + ">.");
          } else {
            channel.send("It's tails! <@" + thisGame.challenger + "> beats <@" + thisGame.caller + ">!");
            console.log("Tails, <@" + thisGame.challenger + "> beats <@" + thisGame.caller + ">.");
          }
          activeGames = activeGames.splice(e, 1); //remove the current game from active games list
        } else if(msg.text.toLowerCase().indexOf("tails") > -1  && msg.text.toLowerCase().indexOf("heads") < 0){
          if(flippedCoinWasHeads()){
            channel.send("It's heads! <@" + thisGame.challenger + "> beats <@" + thisGame.caller + ">!");
            console.log("Heads, <@" + thisGame.challenger + "> beats <@" + thisGame.caller + ">.");
          } else {
            channel.send("It's tails! <@" + thisGame.caller + "> beats <@" + thisGame.challenger + ">!");
            console.log("Tails, <@" + thisGame.caller + "> beats <@" + thisGame.challenger + ">.");
          }
          activeGames = activeGames.splice(e, 1); //remove the current game from active games list
        }
      }
    }
    
  }
});

slack.on('error', function(err){
  console.error("Error: ", err);
});

slack.login();

function flippedCoinWasHeads(){
  return (Math.floor(Math.random() * 2) == 0);
}

function rollDice(howMany){
  var resultString = "";
  for(var i=0; i<howMany; i++){
    var rand = Math.floor(Math.random() * 6) + 1;
    switch(rand){
      case 1:
        resultString += ":one:";
        break;
      case 2:
        resultString += ":two:";
        break;
      case 3:
        resultString += ":three:";
        break;
      case 4:
        resultString += ":four:";
        break;
      case 5:
        resultString += ":five:";
        break;
      case 6:
        resultString += ":six:";
        break;
    }
  }
  return resultString;
}