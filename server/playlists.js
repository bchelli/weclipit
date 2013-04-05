
Meteor.publish('playlists', function(playlist){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(playlist) query.$or.push({_id:playlist});
  if(user) query.$or.push({"followers" : user._id});
  return playlists.find(query);
});

Meteor.methods({
  setPrivacy : function(playlist, privacy){
    if(['public','private'].indexOf(privacy)!==-1){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        playlists.update({_id:playlist}, {$set:{privacy:privacy}});
      }
    }
  }
, setPublic : function(playlist, public){
    if([true,false].indexOf(public)!==-1){
      var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
      if(pl){
        playlists.update({_id:playlist}, {$set:{public:public}});
      }
    }
  }
, updatePlaylistName : function(playlist, name){
    var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
    if(pl){
      playlists.update({_id:playlist}, {$set:{name:name}});
    }
  }
, followPlaylist : function(playlist){
    var pl = playlists.findOne({_id:playlist});
    if(pl){
      var uId = Meteor.userId();
      if(uId){
        playlists.update({_id:playlist}, {$addToSet: {followers:uId}});
      }
    }
  }
, unfollowPlaylist : function(playlist){
    var pl = playlists.findOne({_id:playlist});
    if(pl){
      if(pl.owner!==Meteor.userId()){
        playlists.update({_id:playlist}, {
          $pull: {followers:Meteor.userId()}
        });
      }
    }
  }
, removePlaylist : function(playlist){
    var pl = playlists.findOne({_id:playlist});
    if(pl){
      if(pl.owner===Meteor.userId()){
        videos.remove({playlist:pl._id})
        playlists.remove({_id:pl._id})
      }
    }
  }
, createPlaylist : function(name){
    var userId = Meteor.userId()
      , result
      ;
    if(userId){
      result = playlists.insert({
        name:           name
      , owner:          userId
      , followers:      []
      , privacy:        'private'
      , public:         true
      , thumbnails:     []
      , nbVideos:       0
      });
    }
    return result;
  }
});
