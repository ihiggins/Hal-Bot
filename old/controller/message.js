var searchBuffer = null;


handleClientMessage = (client) => {

  client.on("message", message => {

    // if (message.author.bot) return;
    // if(message.channel.name !== 'bot-commands') return;
    

    if (client.voice.connections.size) {
      Promise.resolve(messageSwitch(message.content)).then(
        function(value) {
          message.channel.send(value).then(msg => {
            msg.delete({ timeout: 2000 })
          })
          .catch(console.error);
        }
      );
    } 
    // else if (message.content === "join") {
    //   if (message.member.voice.channel) {
    //     message.member.voice.channel
    //       .join()
    //       .then(connection => {
    //           Connection = connection;
              
    //           var Dispatcher = require('../service/dispatcher');
    //           Dispatcher.createDispatcher(client ,connection)

    //           message.channel.send('I have successfully connected to the channel!').then(msg => {
    //             msg.delete({ timeout: 2000 })
    //           })
    //           .catch(console.error);


    //       })
    //       .catch(err => console.log(err));
    //   } else {

    //     message.channel.send("I'm sorry Dave I'm afraid I can't do that").then(msg => {
    //       msg.delete({ timeout: 100 })
    //     })
    //   }
    // }

    // message.channel.messages.fetch({around: 769025323610013696, limit: 1}).then(msg => {
    //     const fetchedMsg = msg.first();
    //     fetchedMsg.edit('embed');
    // });

    

  });


}

var messageSwitch = async (content) =>{
    
    var Disp = require('../service/dispatcher');
    Dispatcher = Disp.getDispatcher();

    var temp = content.split(" ");

    if (0 <= temp[0] && temp[0] <= 9){
      var url = 'https://www.youtube.com/watch?v='+ searchBuffer[1][temp[0]].id
      return Dispatcher.addToPlaylist(searchBuffer[0], url)
    }
    else{

     searchBuffer = null;
     switch (temp[0]) {

        case 'search':
            var hold = await Dispatcher.searchSong(content);          
            searchBuffer=[temp[1],hold[1]]
            return hold[0]
        case 'skip':
            return Dispatcher.skip()
        case 'push':
            return Dispatcher.pushToQueue(temp[1])   
        case 'clear':
            return Dispatcher.clearQueue();      
        case 'add':
            return Dispatcher.addToPlaylist(temp[1], temp[2]);  
        case 'del':
            return Dispatcher.delToPlaylist(temp[1], temp[2]); 
        case 'shuffle':
            return Dispatcher.shuffle();   
        case 'leave':
            return Connection.disconnect();
        case 'help':
            return help;
        default:
            return 'Unknown Command'
      }
    }
}
var help = `

== Commands ==

search [playlist] [term]
push [playlist]
skip 
add [playlist] [url]
del [playlist] [url]
shuffle 
leave
clear
`


module.exports = {handleClientMessage}