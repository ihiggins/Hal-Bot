const Discord = require("discord.js");
const client = new Discord.Client();
const { Worker } = require("./worker/workerV2.js");

var workerPool = {};

var buildApp = () => {
  client.login("NTI5MDYxMTU4OTYzOTA0NTE0.XClEmQ.fdN3wcKd5Cpd63G33rLn1a51ju4");
  client.on("ready", () => {
    console.log(`Connected to Discord API as: ${client.user.tag}!`);
  });

  client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.name !== "bot-commands") return;

    if (
      message.content === "join" &&
      message.guild.voiceConnection == undefined
    ) {
      var channel = message.member.voice.channel;
      var channelRefText = client.channels.cache.get(message.channel.id);
      
      //check if in worker pool here >>>>>>>>>>>>>>>>>>>>>>>>>>>>

      workerPool[message.channel.id] = new Worker(channel, channelRefText);
    } else if (message.content === "leave") {
      workerPool[message.channel.id].end();
      delete workerPool[message.channel.id];
    } else if (message.content === "pool") {
      console.log(Object.keys(workerPool));
    } else {
      process(message.content, message.channel.id);
    }
    message.delete({ timeout: 500 }).catch((err) => {});
  });
};

module.exports = { buildApp };

var process = async (message, id) => {
  var temp = message.split(" ");


    switch (temp[0]) {
      case "create":
        return workerPool[id].createPlaylist(temp[1]);
      case "delete":
        return workerPool[id].deletePlaylist(temp[1]);
      default:
        return workerPool[id].search(message);
    }
  
};
