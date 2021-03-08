const dba = require("./dba");
db = dba.getDb();

exports.get_collections = () => {
  return db
    .listCollections()
    .toArray()
    .then((colls) => {
      return colls;
    })
    .catch((err) => console.error(`Failed to find documents: ${err}`));
};

exports.get_documents = (playlist) => {
  return db
    .collection(playlist)
    .find()
    .toArray()
    .then((items) => {
      console.log(`Found ${items.length} documents.`);
      return items;
    })
    .catch((err) => console.error(`Failed to find documents: ${err}`));
};

exports.create_documents = (playlist, songInfo) => {
  const options = {
    upsert: true,
  };

  db.collection(playlist).updateOne(
    songInfo,
    {
      $setOnInsert: songInfo,
    },
    options,
    (err, result) => {
      console.log("Updated the document");
      if (err) {
        console.log(err);
      }
    }
  );
};

exports.delete_document = (playlist, songInfo) => {
  db.collection(playlist).deleteOne(songInfo, (err, result) => {
    console.log("Removed the document");
  });
};

exports.create_collection = (target) => {
  db.createCollection(target, function (err, res) {
    if (err) throw err;
    console.log("Collection created!");
  });
};
exports.delete_collection = (target) => {
  db.collection(target).drop(function (err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
  });
};
