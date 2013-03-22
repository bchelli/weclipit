var playlists = new Meteor.Collection('playlists');

var videos = new Meteor.Collection('videos');

var configDb = new Meteor.Collection('configDb');

videos.isOwner = function(video, user){
  if(!user) user = Meteor.user();
  return video
      && user
      && video.owner
      && user._id
      && video.owner === user._id;
}

playlists.isOwner = function(playlist, user){
  if(!user) user = Meteor.user();
  return playlist
      && user
      && playlist.owner
      && user._id
      && playlist.owner === user._id;
}

playlists.canAccess = function(playlist, user){
  if(!user) user = Meteor.user();
  var pos = _.find(playlist.canAccess, function(u){
    return u._id === user._id;
  });
  return !_.isUndefined(pos);
}

playlists.canAddVideo = function(playlist, user){
  if(!user) user = Meteor.user();
  return playlists.isOwner(playlist, user) || playlist && playlist.privacy && playlist.privacy === 'public';
}

playlists.canRemoveVideo = function(playlist, video, user){
  if(!user) user = Meteor.user();
  return playlists.isOwner(playlist, user) || videos.isOwner(video, user);
}
