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
Template.videosListTemplate.helpers({
  isPlaying: function () {
    var pl = Session.get("playing");
    return pl && this._id === pl.video;
  }
, rightTo: function(right, playlist, myUser, video){
    if(right === "canAccess") return playlists.canAccess(playlist, myUser);
    if(right === "canAddVideo") return playlists.canAddVideo(playlist, myUser);
    if(right === "canRemoveVideo") return playlists.canRemoveVideo(playlist, video, myUser);
    return false;
  }
, liked: function(){
    return this.likes && _.contains(this.likes, Meteor.userId()) ? 'icon-star' : 'icon-star-empty';
  }
, sortedBy: function(sortBy){
    return Session.get('video-sort-by') === sortBy;
  }
, formatTime: function(time){
    var delta = (new Date()).getTime() - time;
    if(_.isNaN(delta)) return '?';
    if(delta >= 1000*60*60*24*365) return Math.floor(delta / (1000*60*60*24*365))+' year(s)';
    if(delta >= 1000*60*60*24*30) return Math.floor(delta / (1000*60*60*24*30))+' month(s)';
    if(delta >= 1000*60*60*24) return Math.floor(delta / (1000*60*60*24))+' day(s)';
    if(delta >= 1000*60*60) return Math.floor(delta / (1000*60*60))+' hour(s)';
    return Math.floor(delta / (1000*60))+' minute(s)';
  }
});

// Set Template Variables
Template.videosListTemplate.videos = function() {
  if(!Session.get('playlist')) return {};
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl}, {sort:Session.get('video-sort')});
};
Template.videosListTemplate.playlist = function() {
  if(!Session.get('playlist')) return {};
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
Template.videosListTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};

// Set Template Events
Template.videosListTemplate.events({
  'click .video-playlist': function (event, template) {
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click .video-playlist a': function (event, template) {
    event.stopPropagation();
  }
, 'click #add-video-from-url': function (event, template) {
    $('#add-video-url').val('');
    $('#add-video-modal')
      .on('shown', function(){
        $('#add-video-url').focus();
      })
      .modal();
    return false;
  }
, 'click .add-video-from-search': function (event, template) {
    $('#search-video-query').val('');
    $('#search-video-provider').val(event.currentTarget.getAttribute('data-provider'));
    $('#search-video-result').html('');
    $('#search-video-modal')
      .on('shown', function(){
        $('#search-video-query').focus();
      })
      .modal();
    return false;
  }
, 'click .remove-video': function (event, template) {
    $('#remove-video-submit').attr('video', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal')
      .on('shown', function(){
        $('#remove-video-submit').focus();
      })
      .modal();
    return false;
  }
, 'click .like-video': function (event, template) {
    var videoId = event.currentTarget.getAttribute('video')
      , status = !videos.findOne({_id:videoId}).likes || !_.contains(videos.findOne({_id:videoId}).likes, Meteor.userId())
      ;
    Meteor.call('likeVideo', videoId, status);
    return false;
  }
, 'click .sort-by': function(event, template){
    setSortBy(event.currentTarget.getAttribute('data-sort-by'));
  }
});

