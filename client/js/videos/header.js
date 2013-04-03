/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */
Meteor.autorun(function(){
  if(!Session.get('video-sort')){
    setSortBy('time-down');
  }
});

function setSortBy(sortBy){
  switch(sortBy){
    case 'time-down':
      Session.set('video-sort', [['createdAt','desc'], ['data.title', 'asc']]);
      Session.set('video-sort-by', sortBy)
      break;
    case 'time-up':
      Session.set('video-sort', [['createdAt','asc'], ['data.title', 'asc']]);
      Session.set('video-sort-by', sortBy)
      break;
    case 'like-down':
      Session.set('video-sort', [['nbLikes','desc'],['createdAt','asc'], ['data.title', 'asc']]);
      Session.set('video-sort-by', sortBy)
      break;
  }
}

// Set Template Helpers
Template.videosHeaderTemplate.helpers({
  rightTo: function(right, playlist, myUser, video){
    if(right === "isOwner") return playlists.isOwner(playlist, myUser);
    if(right === "canAccess") return playlists.canAccess(playlist, myUser);
    if(right === "canAddVideo") return playlists.canAddVideo(playlist, myUser);
    if(right === "canRemoveVideo") return playlists.canRemoveVideo(playlist, video, myUser);
    return false;
  }
, sortedBy: function(sortBy){
    return Session.get('video-sort-by') === sortBy;
  }
});

// Set Template Variables
Template.videosHeaderTemplate.playlist = function() {
  if(!Session.get('playlist')) return {};
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
Template.videosHeaderTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};

// Set Template Events
function setNewName(){
  var newName = $('#edit-playlist-name input').val();
  Meteor.call('updatePlaylistName', Session.get('playlist'), newName);
  $('#edit-playlist-name').hide();
  $('#playlist-name .playlistName').html(newName);
  $('#playlist-name').css({
    'visibility':'visible'
  });
}
Template.videosHeaderTemplate.events({
  'click .playlist-unfollow': function (event, template) {
    Meteor.call('unfollowPlaylist', event.currentTarget.getAttribute('playlist'));
    _gaq.push(['_trackEvent', 'playlist', 'unfollow']);
    return false;
  }
, 'mouseover .playlist-unfollow': function (event, template) {
    $(event.currentTarget)
      .removeClass('btn-primary')
      .addClass('btn-danger')
      .html('Unfollow')
      ;
  }
, 'mouseout .playlist-unfollow': function (event, template) {
    $(event.currentTarget)
      .addClass('btn-primary')
      .removeClass('btn-danger')
      .html('Following')
      ;
  }
, 'click .playlist-follow': function (event, template) {
    Meteor.call('followPlaylist', event.currentTarget.getAttribute('playlist'));
    _gaq.push(['_trackEvent', 'playlist', 'follow']);
    return false;
  }
, 'click .sort-by': function(event, template){
    var sortBy = event.currentTarget.getAttribute('data-sort-by');
    setSortBy(sortBy);
    _gaq.push(['_trackEvent', 'video', 'sort', sortBy]);
  }
, 'click .playlist-edit': function (event, template) {
    $('#edit-playlist-name').show();
    $('#edit-playlist-name input').focus();
    $('#playlist-name').css({
      'visibility':'hidden'
    });
    _gaq.push(['_trackEvent', 'playlist', 'rename']);
    return false;
  }
, 'click .cancel-playlist-name': function (event, template) {
    $('#edit-playlist-name').hide();
    $('#playlist-name').css({
      'visibility':'visible'
    });
    return false;
  }
, 'submit #edit-playlist-name': function (event, template) {
    setNewName();
    return false;
  }
, 'click .valid-playlist-name': function (event, template) {
    setNewName();
    return false;
  }
});

