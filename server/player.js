
Meteor.publish('player', function(playlist, video){
  return videos.findOne({_id:video,playlist:playlist});
});

Meteor.methods({
  playNext : function(playing){
    var v = videos.find({playlist:playing.playlist}).fetch()
      , videoFound = false
      , firstVideoId = ""
      ;

    for(var i in v){
      if(firstVideoId === "") firstVideoId = v[i]._id;                  // Save first ID in case of no next
      if(videoFound) return {playlist:playing.playlist,video:v[i]._id}; // is the next video
      if(v[i]._id === playing.video) videoFound = true;                 // video found => the next is the good one
    }

    return {playlist:playing.playlist,video:firstVideoId};
  }

, playPrevious : function(playing){
    var v = videos.find({playlist:playing.playlist}).fetch()
      , lastVideoId = v[v.length-1]._id
      ;

    for(var i in v){
      if(v[i]._id === playing.video) return {playlist:playing.playlist,video:lastVideoId};  // video found => the next is the good one
      lastVideoId = v[i]._id;
    }

    return {playlist:playing.playlist,video:firstVideoId};
  }
});