const ytdl = require("ytdl-core");
const dbHandle = require("../data/dbHandle");
//  const ioHandle = require("./ioHandle");

const Discord = require("discord.js");

var BehaviorSubject = require("rxjs").BehaviorSubject;

const streamOptions = {
  seek: 0,
  volume: 1,
};

class Dispatcher {
  constructor(client,connection) {
    this.connection = connection;
    this.client = client;
    this.queue = [];
    this.currentSong = {};
    this.dispatcher = "test";

    this.subject = new BehaviorSubject([]); // 0 is the initial value

    this.subject.subscribe({
      next: (queue) => {
        this.displayQueue()
        if(queue.length > 0){
          this.playSong();
        }            
      },
    });
    
  }

  displayQueue = async () => {
    var channel = await this.client.channels.cache.get("761759949561921536");
    channel.messages
      .fetch({ around: 769040623981821973, limit: 1 })
      .then((msg) => {
        const fetchedMsg = msg.first();
  
        fetchedMsg.edit(this.getQueue());
      });

  };

  getQueue = () => {
   
    if (this.subject.value.length == 0) {
      const message = new Discord.MessageEmbed()
      .setColor("#95ff00")
      .setTitle("QUEUE")
    return message;
     
    }
    var output = " ";
    for (var i = 0; i < this.subject.value.length; i++) {
      output = output.concat("\n", this.subject.value[i].name);
      if (output.length > 1600) {
        break;
      }
    }
    const message = new Discord.MessageEmbed()
      .setColor("#95ff00")
      .setTitle("QUEUE")
      .setFooter("Length: " + this.subject.value.length)
      .setDescription(output);
    return message;
  };
  
  printPlaylists = async (playlist) => {
    try {
      var colls = await getPlaylists(playlist);
    } catch (err) {
      return;
    }

    var output = "";
    for (var i = 0; i < colls.length; i++) {
      output = output.concat("\n", colls[i].name);
      if (output.length > 2000) {
        break;
      }
    }

    const message = new Discord.MessageEmbed()
      .setColor("#ff4000")
      .setTitle("PLAYLISTS")
      .setFooter("Count: " + colls.length)
      .setDescription(output);

    return message;
  };

  printPlaylist = async (playlist) => {
    try {
      var info = await getPlaylist(playlist);
    } catch (err) {
      console.log(err);
    }
    if (info.length == 0) {
      return "Playlist Empty.";
    }
    var output = "";
    for (var i = 0; i < info.length; i++) {
      output = output.concat("\n", info[i].name);
      if (output.length > 2000) {
        break;
      }
    }

    const message = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("PLAYLIST: " + playlist)
      .setFooter("Length: " + info.length)
      .setDescription(output);

    return message;
  };

  pushToQueue = (playlist) => {
    var promise = parsePlaylist(playlist);
    promise.catch((error) => {
      return "Error";
    });

    return promise.then((result) => {
      this.subject.next(result);
      //   ioHandle.queue_update(this.queue);
      return `Pushed Playlist **${playlist}** Into Queue`;
    });
  };

  shuffle = () => {
    var array = this.subject.value;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    this.subject.next(array)
    return "Shuffled";
  };

  playSong = () => {

    if (this.subject.value.length == 0) {
      return "QUEUE Empty.";
    }

    var song = this.subject.value[0];

    const stream = ytdl(song.url, {
      filter: "audioonly",
      highWaterMark: 1 << 25,
    });
    
    this.dispatcher = this.connection.play(stream, streamOptions);

    this.dispatcher.on("finish", () => {
      this.subject.next(this.subject.value.slice(1))
    });
    return "Playing:" + song.name;
  };

  skip = () => {
    this.dispatcher.end();
    return `skipped`;
  };
  addToQueue = async (search) => {
    /* adds (search) > url to the queue */
    try {
      var info = await getSongInfo(search);
      console.log(info);
    } catch (err) {
      console.log("Invalid");
      return;
    }
    // QUEUE.push(info);
    // ioHandle.queue_update(QUEUE);
  };

  addToPlaylist = async (playlist, search) => {
    /* takes in playlist and (search) > url and
            makes a request to the db */
    try {
      var info = await getSongInfo(search);
    } catch (err) {
      return "Invalid **URL**";
    }

    dbHandle.insert_collection_into_documents(playlist, info);
    this.addToQueue(search);
    return `ADDING TO: **${playlist}**.`;
  };

  delToPlaylist = async (playlist, search) => {
    /* takes in playlist and (search) > url and
            makes a request to the db */
    try {
      var info = await getSongInfo(search);
    } catch (err) {
      return "Invalid **URL**";
    }

    dbHandle.remove_collection_from_documents(playlist, info);

    return `DELETING FROM: **${playlist}**.`;
  };

  clearQueue = () => {
    this.subject.next([]);
    // ioHandle.queue_update(QUEUE);
    return "QUEUE Cleared";
  };

  searchSong(content) {
    const YouTube = require("youtube-sr");
    return YouTube.search(content.slice(7), { limit: 10 })
      .then((data) => {
        var output = " ";

        for (var i = 0; i < data.length; i++) {
          output = output.concat(
            "\n**" + i + ")** \u200B \u200B",
            data[i].title
          );
          if (output.length > 1600) {
            break;
          }
        }

        const message = new Discord.MessageEmbed()
          .setColor("#b300ff")
          .setTitle("SEARCH: " + content.slice(7))
          .setFooter("Count: " + data.length)
          .setDescription(output);

        return [message, data];
      })
      .catch(console.error);
  }
  addToQueue = async (search) => {
    /* adds (search) > url to the queue */
    try {
      var info = await getSongInfo(search);
      console.log(info);
    } catch (err) {
      console.log("Invalid");
      return;
    }
    this.queue.push(info);
    //   ioHandle.queue_update(QUEUE);
  };
}







var getSongInfo = (search) => {
  const promise = searchSong(search);
  promise.catch((error) => {});
  return promise.then((result) => {
    var obj = {};
    obj.name = result.title;
    obj.author = result.author.name;
    obj.length = result.player_response.videoDetails.lengthSeconds;
    obj.url = search;
    return obj;
  });
};
var searchSong = (search) => {
  return new Promise((resolve, reject) => {
    if (ytdl.validateURL(search)) {
      ytdl.getBasicInfo(search, (err, info) => {
        resolve(info);
      });
    } else {
      reject();
    }
  });
};
var getPlaylist = async (playlist) => {
  /* takes in (message) > discord client object + playlist name
      and returns the playlist document from the db  */
  try {
    var info = await dbHandle.get_documents(playlist);
  } catch (err) {
    console.log("Invalid");
    return;
  }
  console.log(info);
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


/* EXPORTED */
var shuffle = () => {
  shuffleArray(QUEUE);
  return "Shuffled";
};

var getPlaylists = async () => {
  try {
    var results = await dbHandle.get_collections();
  } catch (err) {
    return;
  }
  return results;
};

let instance = null;

createDispatcher = (client, connection) => {
  instance = new Dispatcher(client, connection);
};

getDispatcher = () => {
  if (!instance) {
    throw new Error("Call connect first!");
  }
  return instance;
};
module.exports = { createDispatcher, getDispatcher };
