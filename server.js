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
    
    console.log("Received a message.");
    
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
      if(msg.text.toLowerCase().indexOf("flip") > -1 || msg.text.toLowerCase().indexOf("coin") > -1){
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


// //
// // # SimpleServer
// //
// // A simple chat server using Socket.IO, Express, and Async.
// //
// var http = require('http');
// var path = require('path');

// var async = require('async');
// var socketio = require('socket.io');
// var express = require('express');

// //
// // ## SimpleServer `SimpleServer(obj)`
// //
// // Creates a new instance of SimpleServer with the following options:
// //  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
// //
// var router = express();
// var server = http.createServer(router);
// var io = socketio.listen(server);

// router.use(express.static(path.resolve(__dirname, 'client')));
// var messages = [];
// var sockets = [];

// io.on('connection', function (socket) {
//     messages.forEach(function (data) {
//       socket.emit('message', data);
//     });

//     sockets.push(socket);

//     socket.on('disconnect', function () {
//       sockets.splice(sockets.indexOf(socket), 1);
//       updateRoster();
//     });

//     socket.on('message', function (msg) {
//       var text = String(msg || '');

//       if (!text)
//         return;

//       socket.get('name', function (err, name) {
//         var data = {
//           name: name,
//           text: text
//         };

//         broadcast('message', data);
//         messages.push(data);
//       });
//     });

//     socket.on('identify', function (name) {
//       socket.set('name', String(name || 'Anonymous'), function (err) {
//         updateRoster();
//       });
//     });
//   });

// function updateRoster() {
//   async.map(
//     sockets,
//     function (socket, callback) {
//       socket.get('name', callback);
//     },
//     function (err, names) {
//       broadcast('roster', names);
//     }
//   );
// }

// function broadcast(event, data) {
//   sockets.forEach(function (socket) {
//     socket.emit(event, data);
//   });
// }

// server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
//   var addr = server.address();
//   console.log("Chat server listening at", addr.address + ":" + addr.port);
// });
