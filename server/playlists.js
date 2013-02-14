
Meteor.publish('playlists', function(){
  return playlists.find({});
});

Meteor.methods({
  removePlaylist : function(playlist){
    videos.remove({playlist:playlist})
    playlists.remove({_id:playlist})
  }
});
