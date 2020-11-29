// const botHandle = require("./botHandle");

var build_io = io => {
  IO = io;
  IO.on("connection", socket => {
    IO.emit("queue_update", botHandle.get_queue());
    IO.emit("play_update", botHandle.get_song());
    playlists_update();
    console.log("a user connected");
  });
};

var queue_update = queue => {
  IO.sockets.emit("queue_update", queue);
};

var playlists_update = () => {

  botHandle.get_playlists()
  .then(results => {

    IO.sockets.emit("playlists_update", results)})
  .catch(err => console.log(err))

};

var play_update = song => {
  IO.sockets.emit("play_update", song);
};

module.exports = {
  queue_update,
  build_io,
  play_update,
  playlists_update
};
