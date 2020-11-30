const Discord = require("discord.js");
const client = new Discord.Client();
const { Worker } = require("./worker/worker.js");

var buildApp = () => {

  client.login("NTI5MDYxMTU4OTYzOTA0NTE0.XClEmQ.0tDuprzQ6vyOXYPoF-qWolLUdq0");
  
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
      var worker = new Worker(message, client);
    }
    message.delete({ timeout: 500 }).catch((err) => {});
  });
};

module.exports = { buildApp };
