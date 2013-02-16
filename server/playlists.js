
Meteor.publish('playlists', function(userId){
  return playlists.find({owner:userId});
});

Meteor.methods({
  removePlaylist : function(playlist){
    var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
    if(pl){
      videos.remove({playlist:pl._id})
      playlists.remove({_id:pl._id})
    }
  }
, createPlaylist : function(name){
    var userId = Meteor.userId();
    if(userId){
      playlists.insert({
        name:name
      , owner:userId
      });
    }
  }
});
