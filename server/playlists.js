
Meteor.publish('playlists', function(playlist){
  var query = {$or:[{owner:this.userId}]}
    , user = Meteor.users.findOne({_id:this.userId})
    ;
  if(playlist) query.$or.push({_id:playlist});
  if(user) query.$or.push({"canAccess._id" : user._id});
  return playlists.find(query);
});

function updatePlaylistThumbnails(playlist){
  var v = videos.find({playlist:playlist}, {limit:4}).fetch()
    , thumbnails = []
    ;
  for(var i in v){
    thumbnails.push(v[i].data.thumbnail_url);
  }
  playlists.update({_id:playlist},{
    $set:{thumbnails:thumbnails}
  })
}

function updateVideoCount(pl){
  playlists.update({_id:pl}, {
    $set:{
      nbVideos:videos.find({playlist:pl}).count()
    }
  });
}

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
      , public:         true
      , thumbnails:     []
      , nbVideos:       0
      });
    }
    return result;
  }
});
