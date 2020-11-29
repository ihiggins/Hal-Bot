const server = require("http").createServer();
const dba = require('./data/dba')

dba.connectDb()
    .then(() => console.log('Database Connected'))
    .then(() => {
      
      server.listen(3000, () => {
        
        const ioHandle = require("./connectors/ioHandle");
        const io = require("socket.io")(server);
        const app = require("./app");
        
        ioHandle.build_io(io);
        app.buildApp();
        
        console.log("Server listening on port: 3000");
      });
  })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });


