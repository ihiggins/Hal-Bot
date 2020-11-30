const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
var options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let db = null;

connectDb = () =>
  new Promise((resolve, reject) => {
    MongoClient.connect(url, options, (err, client) => {
      if (err) {
        reject(err);
        return;
      }
      db = client.db("db");
      resolve(db);
    });
  });

getDb = () => {
  if (!db) {
    throw new Error("Call connect first!");
  }
  return db;
};

module.exports = { connectDb, getDb };
