const BehaviorSubject = require("rxjs").BehaviorSubject;
const dbHandle = require("../data/dbHandle");
const Discord = require("discord.js");
const ytdl = require("ytdl-core");

class Worker {
  constructor(channel, channelRefText) {
    this.channel = channel;
    this.channelRefText = channelRefText;

    this.connection = null;
    this.openConnection(channel);

    this.currentSong = {};
    this.currentPlaylist = "Queue";
    this.queue = new BehaviorSubject([]);
    this.playlists;

    this.displayPlaylistsId = null;
    this.queueDisplayId;
    this.displaySearchId;

    this.pMessage;
    this.qMessage;
    this.sMessage;

    this.searchBuffer;
    this.initDisplay();

    this.queue.subscribe({
      next: async (queue) => {
        if (this.qMessage != null) {
          var output = " ";

          if (this.queue.value.length == 0) {
            output = "...";
          }

          for (var i = 0; i < this.queue.value.length; i++) {
            if (i == 0) {
              output = output.concat("\n" + this.queue.value[i].name + "\n");
            } else {
              output = output.concat("\n", this.queue.value[i].name);
            }
            if (i > 10) {
              break;
            }
          }

          const receivedEmbed = this.qMessage.embeds[0];
          const exampleEmbed = new Discord.MessageEmbed(receivedEmbed)
            .setDescription(
              "__**Queue: " +
                this.currentPlaylist +
                "**__" +
                " ```" +
                output +
                "```  "
            )
            .setFooter("Length: " + this.queue.value.length);

          this.qMessage.edit(exampleEmbed);
        }

        if (queue.length > 0) {
          this.playSong();
        }
      },
    });
  }

  openConnection(channel) {
    channel
      .join()
      .then((connection) => {
        this.connection = connection;
      })
      .catch((err) => console.log("err"));
  }

  async initDisplay() {
    try {
      await this.channelRefText.bulkDelete(100);
    } catch (err) {}

    await this.channelRefText
      .send(await this.getPlaylists())
      .then(async (embedMessage) => {
        this.pMessage = embedMessage;
        let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
        for (var i = 0; i < this.playlists.length; i++) {
          await embedMessage.react(emojis[i]);
        }

        const filter = (reaction, user) => reaction.emoji.name != null;
        const collector = embedMessage.createReactionCollector(filter);

        collector.on("collect", (collected, user) => {
          switch (collected.emoji.name) {
            case "1️⃣":
              this.pushToQueue(this.playlists[0].name);
              break;
            case "2️⃣":
              this.pushToQueue(this.playlists[1].name);
              break;
            case "3️⃣":
              this.pushToQueue(this.playlists[2].name);
              break;
            case "4️⃣":
              this.pushToQueue(this.playlists[3].name);
              break;
            case "5️⃣":
              this.pushToQueue(this.playlists[4].name);
              break;
            case "6️⃣":
              this.pushToQueue(this.playlists[5].name);
              break;
          }
          collected.users.remove(user.id);
        });
      })
      .catch(console.error);

    await this.channelRefText
      .send(await this.getQueue())
      .then(async (embedMessage) => {
        this.qMessage = embedMessage;
        await embedMessage.react("⏭️");
        await embedMessage.react("🔀");
        await embedMessage.react("🗑️");

        const filter = (reaction, user) => reaction.emoji.name != null;
        const collector = embedMessage.createReactionCollector(filter);
        collector.on("collect", (collected, user) => {
          switch (collected.emoji.name) {
            case "⏭️":
              this.skip();
              break;
            case "🔀":
              this.shuffle();
              break;
            case "🗑️":
              this.deleteSong();
              break;
          }

          collected.users.remove(user.id);
        });
      })
      .catch(console.error);

    await this.channelRefText
      .send(await this.getSearch())
      .then(async (embedMessage) => {
        this.sMessage = embedMessage;
        let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
        for (var i = 0; i < 5; i++) {
          await embedMessage.react(emojis[i]);
        }

        const filter = (reaction, user) => reaction.emoji.name != null;
        const collector = embedMessage.createReactionCollector(filter);

        collector.on("collect", (collected, user) => {
          if (this.searchBuffer) {
            switch (collected.emoji.name) {
              case "1️⃣":
                this.searchResponse(0);
                break;
              case "2️⃣":
                this.searchResponse(1);
                break;
              case "3️⃣":
                this.searchResponse(2);
                break;
              case "4️⃣":
                this.searchResponse(3);
                break;
              case "5️⃣":
                this.searchResponse(4);
                break;
            }
          }
          collected.users.remove(user.id);
        });
      })
      .catch(console.error);
  }

  end() {
    // this.channelRefText.messages.fetchMessage(this.displayPlaylistsId).then(msg => msg.delete());
    // this.channelRefText.messages.fetchMessage(this.queueDisplayId).then(msg => msg.delete());

    this.queue.unsubscribe();
    this.connection.disconnect();
  }

  getPlaylists = async () => {
    const playlists = await getAllPlaylists();
    this.playlists = playlists;

    var playlistsOutput = "";
    for (var i = 0; i < playlists.length; i++) {
      playlistsOutput = playlistsOutput.concat(playlists[i].name, " | ");
      if (playlistsOutput.length > 1000) {
        break;
      }
    }
    const message = new Discord.MessageEmbed()
      .setColor("#ff0037")
      .setDescription(
        "__**Playlists**__" + " ```\n" + playlistsOutput + "```  "
      );
    return message;
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
    const message = new Discord.MessageEmbed()
      .setColor("#95ff00")
      .setDescription("__**Queue**__" + " ```\n" + output + "```  ")
      .setFooter("Length: " + this.queue.value.length);
    return message;
  };

  getSearch = async () => {
    const message = new Discord.MessageEmbed()
      .setColor("#0062ff")
      .setDescription("__**Search**__" + " ```\nSearch for something; ```  ");
    return message;
  };

  pushToQueue = (playlist) => {
    this.currentPlaylist = playlist;
    var promise = parsePlaylist(playlist);
    return promise
      .then((result) => {
        this.queue.next(result);
      })
      .catch((err) => console.log(err));
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
  skip = () => {
    this.dispatcher.end();
  };
  clearQueue = () => {
    this.queue.next([]);
    try {
      this.dispatcher.end();
    } catch {
      console.log("no Dispatcher");
    }
  };
  search = async (key) => {
    var hold = await searchSong(key);
    this.searchBuffer = hold[1];
    const receivedEmbed = this.sMessage.embeds[0];
    const exampleEmbed = new Discord.MessageEmbed(receivedEmbed).setDescription(
      "__**Search**__" + " ```\n" + hold[0] + "```  "
    );

    this.sMessage.edit(exampleEmbed);
  };
  searchResponse = (pos) => {
    var url = "https://www.youtube.com/watch?v=" + this.searchBuffer[pos].id;
    this.addToPlaylist(this.currentPlaylist, url);
  };
  addToPlaylist = async (playlist, search) => {
    try {
      var info = await getSongInfo(search);
    } catch (err) {}

    if (this.currentPlaylist !== "Queue") {
      dbHandle.create_documents(playlist, info);
    }
    var temp = this.queue.value;
    temp.push(info);
    this.queue.next(temp);

    const receivedEmbed = this.sMessage.embeds[0];
    const exampleEmbed = new Discord.MessageEmbed(receivedEmbed).setDescription(
      "__**Search**__" + " ```\n for something```  "
    );

    this.sMessage.edit(exampleEmbed);
    this.searchBuffer = null;
  };
  shuffle = () => {
    var array = this.queue.value;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    this.queue.next(array);
  };

  async createPlaylist(target) {
    await dbHandle.create_collection(target);
    this.initDisplay();
  }

  async deletePlaylist(target) {
    await dbHandle.delete_collection(target);
    this.clearQueue();
    this.initDisplay();
  }

  deleteSong() {
    dbHandle.delete_document(this.currentPlaylist, this.currentSong);
    this.skip();
  }
  async updatePlaylists() {
    const playlists = await getAllPlaylists();
    this.playlists = playlists;

    var playlistsOutput = "";
    for (var i = 0; i < playlists.length; i++) {
      playlistsOutput = playlistsOutput.concat(playlists[i].name, " | ");
      if (playlistsOutput.length > 1000) {
        break;
      }
    }

    const receivedEmbed = this.qMessage.embeds[0];
    const exampleEmbed = new Discord.MessageEmbed(receivedEmbed)
      .setDescription(
        "__**Playlists**__" + " ```\n" + playlistsOutput + "```  "
      )
      .setFooter("Length: " + this.queue.value.length);

    this.pMessage.edit(exampleEmbed);
  }
}

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
  return info
    .then((info) => {
      result = [];
      for (var i in info) {
        result.push(info[i]);
      }
      return result;
    })
    .catch((err) => console.log(err));
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
  return YouTube.search(content, { limit: 5 })
    .then((data) => {
      var output = " ";
      for (var i = 0; i < data.length; i++) {
        output = output.concat("\n", data[i].title);
        if (output.length > 1600) {
          break;
        }
      }

      return [output, data];
    })
    .catch((err) => console.log(err));
};

var getSongInfo = async (search) => {
  var info = await ytdl.getBasicInfo(search);

  var obj = {};
  obj.name = info.videoDetails.title;
  obj.author = info.videoDetails.ownerChannelName;
  obj.length = info.videoDetails.lengthSeconds;
  obj.url = search;

  return obj;
};

module.exports = { Worker };
