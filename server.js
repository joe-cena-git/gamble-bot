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
      if(msg.text.indexOf("flip") > -1 || msg.text.indexOf("coin") > -1){
        if(usersMentioned[2] !== undefined){
          channel.send("<@" + sender.id + "> is flipping a coin, <@" + usersMentioned[2] + ">: call heads or tails!");
          
          //add this game to the active games list, so that when we receive a response from a caller we can finish the game
          activeGames.push({
            challenger: sender.id,
            caller: usersMentioned[2]
          });
          
        } else {
          channel.send("Didn't quite understand. Try `@gamble-bot: flip a coin against @slackbot`.");
        }
      }
    } else {
      console.log(usersMentioned[1] + " isn't me!");
    }
    
  }
  
  
  // var receiver = msg._client.self.name;
  
  // console.log();
  
  // // if(msg.text !== undefined){
  // //   if(msg.text.indexOf(slack.self.name) > -1){
  // //     channel.send("I was just mentioned.");
  // //   }
  // //   //console.log(msg.text.indexOf(slack.self.name));
  // // }
  
  // if(receiver === slack.self.name){
  //   console.log(msg);
    
  //   //channel.send("I noticed that I was just mentioned.");
  // }
  
  //channel.send("I received @" + user.name + "'s message in the Cloud9 Node server: `" + msg.text + "`");
});

slack.on('error', function(err){
  console.error("Error: ", err);
});

slack.login();


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
