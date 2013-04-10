/*
 * CONFIG COLLECTION
 */
configDb = new Meteor.Collection('configDb');

configDb.initConfig = function(key){
  var config = configDb.findOne({key:key});
  if(!config){
    configDb.insert({
      key:key
    });
  }
};

configDb.getConfig = function(key){
  var config = configDb.findOne({key:key});
  return config ? config.value : null;
};

configDb.setConfig = function(key, value){
  configDb.initConfig(key);
  configDb.update({key:key},{key:key,value:value});
};



/*
 * VIDEO COLLECTION
 */
videos = new Meteor.Collection('videos');

videos.getLastVideosAdded = function(uId){
  var plIds = _.map(playlists.find({'followers':uId}).fetch(), function(pl){
    return pl._id;
  });
  return videos.find({playlist:{$in:plIds},owner:{$not:{$in:[uId]}}}, {sort:{createdAt:-1},limit:10});
};

videos.isOwner = function(video, user){
  if(!user) user = Meteor.user();
  return video
      && user
      && video.owner
      && user._id
      && video.owner === user._id;
};



/*
 * PLAYLIST COLLECTION
 */
playlists = new Meteor.Collection('playlists');

playlists.isOwner = function(playlist, user){
  if(!user) user = Meteor.user();
  return playlist
      && user
      && playlist.owner
      && user._id
      && playlist.owner === user._id;
};

playlists.canAccess = function(playlist, user){
  if(!user) user = Meteor.user();
  if(!user) return false;
  var pos = _.find(playlist.followers, function(u){
    return u === user._id;
  });
  return !_.isUndefined(pos);
};

playlists.canAddVideo = function(playlist, user){
  if(!user) user = Meteor.user();
  if(!user) return false;
  return playlists.isOwner(playlist, user) || playlist && playlist.privacy && playlist.privacy === 'public';
};

playlists.canRemoveVideo = function(playlist, video, user){
  if(!user) user = Meteor.user();
  if(!user) return false;
  return playlists.isOwner(playlist, user) || videos.isOwner(video, user);
};

playlists.updatePlaylistThumbnails = function(playlist){
  var v = videos.find({playlist:playlist}, {limit:4}).fetch()
    , thumbnails = []
    ;
  for(var i in v){
    thumbnails.push(v[i].data.thumbnail_url);
  }
  playlists.update({_id:playlist},{
    $set:{thumbnails:thumbnails}
  })
};

playlists.updateVideoCount = function(pl){
  playlists.update({_id:pl}, {
    $set:{
      nbVideos:videos.find({playlist:pl}).count()
    }
  });
};

