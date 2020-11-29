
var process = async (that, message) =>{

    var temp = message.split(" ");

    
    if (0 <= parseInt(temp[0]) && parseInt(temp[0]) <= 9){
        
        that.searchResponse(temp[0]);
    }
    else{

     searchBuffer = null;
     switch (temp[0]) {
        case 'search':
            return that.search(temp[1],temp[2])
        case 'skip':
            return that.skip()
        case 'push':
            return that.pushToQueue(temp[1])  
        case 'clear':
            return that.clearQueue();      
        case 'add':
            return that.addToPlaylist(temp[1], temp[2]);  
        case 'del':
            return that.delToPlaylist(temp[1], temp[2]); 
        case 'shuffle':
            return that.shuffle();   
        case 'leave':
            return Connection.disconnect();
        case 'help':
            return;
        default:
            return 'Unknown Command'
      }
    }
}



module.exports = { process }