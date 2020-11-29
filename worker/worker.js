var BehaviorSubject = require("rxjs").BehaviorSubject;
const ytdl = require("ytdl-core");

const Discord = require("discord.js");
const dbHandle = require("../data/dbHandle");
const messageHandler = require("./worker_message_handler");

class Worker {
  constructor(feed, client) {
    this.openConnection(feed);
    this.channel = client.channels.cache.get(feed.channel.id);
    this.client = client;
    this.currentSong = {};
    this.queue = new BehaviorSubject([]);
    this.queueDisplayId;

    this.queue.subscribe({
      next: async (queue) => {
        if (!this.queueDisplayId) {
          await this.channel.bulkDelete(100);
          let sent = await this.channel.send(await this.getQueue());
          this.queueDisplayId = sent.id;
        } else {
          this.displayQueue();
        }
        if (queue.length > 0) {
          this.playSong();
        }
      },
    });
    this.client.on("message", (message) => {
      if (message.author.bot) return;
      if (message.channel.name !== "bot-commands") return;

      messageHandler.process(this, message.content);
    });
  }

  openConnection(feed) {
    feed.member.voice.channel
      .join()
      .then((connection) => {
        this.connection = connection;
      })
      .catch((err) => console.log(err));
  }
  displayQueue = async () => {
    this.channel.messages.fetch(this.queueDisplayId).then(async (msg) => {
      msg.edit(await this.getQueue());
    });
  };
  getQueue = async () => {
    var output = " ";

    if (this.queue.value.length == 0) {
      output = "...";
    }

    for (var i = 0; i < this.queue.value.length; i++) {
      if (i == 0) {
        output = output.concat("\n", "**" + this.queue.value[i].name + "**");
      } else {
        output = output.concat("\n", this.queue.value[i].name);
      }
      if (i > 10) {
        break;
      }
    }
    const playlists = await getAllPlaylists();

    var playlistsOutput = "";
    for (var i = 0; i < playlists.length; i++) {
      playlistsOutput = playlistsOutput.concat(playlists[i].name, " | ");
      if (playlistsOutput.length > 1000) {
        break;
      }
    }

    const message = new Discord.MessageEmbed()
      .setColor("#95ff00")
      .setTitle("Hal-9000")
      .setDescription(
        "__**Playlists**__" + " ```\n" + playlistsOutput + "```  "
      )
      .addFields({ name: "__**QUEUE**__", value: output })
      .setFooter("Length: " + this.queue.value.length);

    return message;
  };
  pushToQueue = (playlist) => {
    var promise = parsePlaylist(playlist);
    promise.catch((error) => {
      return "Error";
    });

    return promise.then((result) => {
      this.queue.next(result);
      return `Pushed Playlist **${playlist}** Into Queue`;
    });
  };
  playSong = () => {
    var song = this.queue.value[0];

    const streamOptions = {
      seek: 0,
      volume: 1,
    };

    const stream = ytdl(song.url, {
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });

    this.dispatcher = this.connection.play(stream, streamOptions);

    this.dispatcher.on("finish", () => {
      this.queue.next(this.queue.value.slice(1));
    });
  };
  skip = (test) => {
    this.dispatcher.end();
  };
  clearQueue = () => {
    this.queue.next([]);
  };
  search = async (playlist, key) => {
    var hold = await searchSong(key);
    this.searchBuffer = [playlist, hold[1]];

    let sent = await this.channel.send(hold[0]);
    this.searchDisplayId = sent.id;
  };
  searchResponse = (pos) => {
    var url = "https://www.youtube.com/watch?v=" + this.searchBuffer[1][pos].id;
    this.addToPlaylist(this.searchBuffer[0], url);

    this.channel.messages.fetch(this.searchDisplayId).then(async (msg) => {
      msg.delete({ timeout: 100 });
    });
  };
  addToPlaylist = async (playlist, search) => {
    console.log('ran')
    try {
      var info = await getSongInfo(search);
      console.log('INFO' + info)
    } catch (err) {
      const message = new Discord.MessageEmbed()
      .setColor("#b300ff")
      .setTitle("INVALID")
      this.channel.send(message).then(async (msg) => {
        msg.delete({ timeout: 2000 });
      });
    }
    console.log('INFO' + info)
    dbHandle.insert_collection_into_documents(playlist, info);
    const message = new Discord.MessageEmbed()
    .setColor("#b300ff")
    .setTitle("ADDED")
    this.channel.send(message).then(async (msg) => {
      msg.delete({ timeout: 2000 });
    });
  };


}

// OUTSIDE CLASS
var getPlaylist = async (playlist) => {
  /* takes in (message) > discord client object + playlist name
        and returns the playlist document from the db  */
  try {
    var info = await dbHandle.get_documents(playlist);
  } catch (err) {
    console.log("Invalid");
    return;
  }
  return info;
};
var parsePlaylist = (playlist) => {
  var info = getPlaylist(playlist);
  return info.then((info) => {
    result = [];
    for (var i in info) {
      result.push(info[i]);
    }
    return result;
  });
  info.catch((error) => {});
};

var getAllPlaylists = async () => {
  try {
    var results = await dbHandle.get_collections();
  } catch (err) {
    return;
  }
  return results;
};

var searchSong = (content) => {
  const YouTube = require("youtube-sr");
  return YouTube.search(content, { limit: 10 })
    .then((data) => {
      var output = " ";
      for (var i = 0; i < data.length; i++) {
        output = output.concat("\n**" + i + ")** \u200B \u200B", data[i].title);
        if (output.length > 1600) {
          break;
        }
      }

      const message = new Discord.MessageEmbed()
        .setColor("#b300ff")
        .setTitle("SEARCH: " + content)
        .setFooter("Count: " + data.length)
        .setDescription(output);
      return [message, data];
    })
    .catch(console.error);
};

var getSongInfo = async(search) => {
  var info = await ytdl.getBasicInfo(search);
  console.log(info.videoDetails);
    var obj = {};
    obj.name = info.videoDetails.title;
    obj.author = info.videoDetails.ownerChannelName;
    obj.length = info.videoDetails.lengthSeconds;
    obj.url = search;
    console.log('OBJECT'+obj)
    return obj;

};


module.exports = { Worker };
