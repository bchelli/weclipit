
Meteor.publish('playlists', function(playlist){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(playlist) query.$or.push({_id:playlist});
  if(user) query.$or.push({"canAccess._id" : user._id});
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
, updatePlaylistName : function(playlist, name){
    var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
    if(pl){
      playlists.update({_id:playlist}, {$set:{name:name}});
    }
  }
, sharePlaylist : function(playlist, users){
    var pl = playlists.findOne({owner:Meteor.userId(),_id:playlist});
    if(pl){
      var u = Meteor.user();
      for(var i in users){
        Meteor.facebook.api(
          '/'+u.services.facebook.id+'/twentysixplays:share'
        , 'POST'
        , {'profile':users[i]}
        );
      }
    }
  }
, followPlaylist : function(playlist){
    var pl = playlists.findOne({_id:playlist});
    if(pl){
      var user = Meteor.user();
      if(user){
        playlists.update({_id:playlist}, {$addToSet: {canAccess:publicUserInfo(user)}});
      }
    }
  }
, removePlaylist : function(playlist){
    var pl = playlists.findOne({_id:playlist});
    if(pl){
      if(pl.owner===Meteor.userId()){
        videos.remove({playlist:pl._id})
        playlists.remove({_id:pl._id})
      } else {
        playlists.update({_id:playlist}, {
          $pull: {canAccess:{_id:Meteor.userId()}}
        });
      }
    }
  }
, createPlaylist : function(name){
    var userId = Meteor.userId()
      , user = publicUserInfo(Meteor.user())
      , result
      ;
    if(userId){
      result = playlists.insert({
        name:           name
      , owner:          userId
      , canAccess:      []
      , ownerData:      user
      , privacy:        'private'
      });
    }
    return result;
  }
});
