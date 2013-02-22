/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

// Auto subscribe videos from the selected playlist
Meteor.autorun(function () {
  var pl = Session.get('playlist');
  Meteor.subscribe('playlists', pl);
  if (pl) {
    Meteor.subscribe('videos', pl);
    Meteor.subscribe('userData');
  }
});

(function(){
  var $window = $(window);
  var resizeWindow = function(){
    var $shUsers = $('.shared-users')
      , shUsersPos = $shUsers.position()
      ;
    if($shUsers && shUsersPos){
      var h = $shUsers.height()
        , t = shUsersPos.top
        ;
      $('img', $shUsers).each(function(pos, el){
        var $el = $(el)
          , pos = $el.position()
          ;
        if(pos.top-t < h){
          $el.attr('src', $el.attr('data-src'));
        }
      });
    }
  };
  var resizeTO;
  var onResize = function(){
    clearTimeout(resizeTO);
    resizeTO = setTimeout(resizeWindow, 100);
  };
  Template.videosTemplate.rendered = function() {
    $window.bind('resize', onResize);
    resizeWindow();
  };
  
  Template.videosTemplate.destroyed = function() {
    $window.unbind('resize', onResize);
  }
})();

// Set Template Helpers
Template.videosTemplate.helpers({
  isPlaying: function () {
    var pl = Session.get("playing");
    return (pl && this._id === pl.video) ? 'icon-play' : '';
  }
, isMine: function () {
    return this.owner === Meteor.userId();
  }
, rightTo: function(right, playlist, myUser, videoOwner){
    var fbId = myUser && myUser.services && myUser.services.facebook && myUser.services.facebook.id ? myUser.services.facebook.id : 0
      , result = playlist.owner === myUser._id
      ;
    if(!result && playlist[right] && playlist[right].indexOf) result = playlist[right].indexOf(fbId)!==-1;
    if(!result && videoOwner) result = videoOwner === myUser._id;
    return result;
  }
});

// Set Template Variables
Template.videosTemplate.videos = function() {
  var pl = Session.get('playlist');
  if (!pl) return {};
  return videos.find({playlist:pl});
};
Template.videosTemplate.playlist = function() {
  var pl = playlists.findOne({_id:Session.get('playlist')});
  if(pl) pl.canAccess = _.shuffle(pl.canAccess || []);
  return pl || {};
};
Template.videosTemplate.myUser = function() {
  var u = Meteor.users.findOne({_id:Meteor.userId()});
  return u || {};
};
Template.videosTemplate.isPlaylistSelected = function() {
  return !!Session.get('playlist');
};
Template.videosTemplate.filterFriends = function(text){
  text = text.toLowerCase();
  _.each(Template.videosTemplate.friends, function(friend, index){
    if(text === '' || friend.name.toLowerCase().indexOf(text)!==-1){
      $('#friend-'+index).show();
    } else {
      $('#friend-'+index).hide();
    }
  });
}

// Set Template Events
Template.videosTemplate.events({
  'click .video': function (event, template) {
    videosRouter.setVideo(event.currentTarget.getAttribute('playlist'), event.currentTarget.getAttribute('video'));
    return false;
  }
, 'click #add-video': function (event, template) {
    $('#add-video-url').val('');
    $('#add-video-modal')
      .on('shown', function(){
        $('#add-video-url').focus();
      })
      .modal();
    return false;
  }
, 'submit #add-video-modal form': function (event, template) {
    Meteor.call('addVideo', Session.get('playlist'), $('#add-video-url').val(), function(){
      $('#add-video-modal').modal('hide');
    });
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
, 'click #remove-video-submit': function (event, template) {
    Meteor.call('removeVideo', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal').modal('hide');
  }
, 'click .playlist-remove': function (event, template) {
    $('#remove-playlist-modal')
      .on('shown', function(){
        $('#remove-playlist-submit').focus();
      })
      .modal();
    $('#remove-playlist-submit').attr('playlist', event.currentTarget.getAttribute('playlist'));
    return false;
  }
, 'click #remove-playlist-submit': function (event, template) {
    Meteor.call('removePlaylist', event.currentTarget.getAttribute('playlist'));
    $('#remove-playlist-modal').modal('hide');
  }
, 'click .playlist-share': function (event, template) {
    var $list = $('#share-users-list')
      , playlist = event.currentTarget.getAttribute('playlist')
      ;
    $('#filter-share-users-list').val('');
    $list.html('<h1 class="loading">LOADING . . .</h1>');
    Meteor.call('getPlaylistFriendsSharing', playlist, function(err, res){
      Template.videosTemplate.friends = res;
      var result = ''
        , $list = $('#share-users-list')
        ;
      _.each(Template.videosTemplate.friends, function(friend, index){
        result += '<tr id="friend-'+index+'">'
                + '  <td class="span1" style="text-align:center">'
                + '    <input type="checkbox" id="friend-'+index+'-canAccess" class="friend-canAccess" '+(friend.canAccess?'checked ':'')+' />'
                + '  </td>'
                + '  <td class="span1 friendToogle" data-index="'+index+'"><img src="http://graph.facebook.com/'+friend.id+'/picture" /></td>'
                + '  <td class="friendToogle" data-index="'+index+'">'
                + '    '+friend.name
                + '  </td>'
                + '</tr>';
      });
      $list.html('<table class="table table-striped table-condensed">'+result+'</table>');
      Template.videosTemplate.filterFriends('');
    });
    $('#share-playlist-modal')
      .attr('playlist', playlist)
      .modal();
    return false;
  }
, 'keyup #filter-share-users-list': function (event, template) {
    Template.videosTemplate.filterFriends($('#filter-share-users-list').val());
  }
, 'click #share-playlist-select-all': function (event, template) {
    $('.friend-canAccess').prop('checked', true);
    return false;
  }
, 'click #share-playlist-select-none': function (event, template) {
    $('.friend-canAccess').prop('checked', false);
    return false;
  }
, 'click #share-playlist-submit': function (event, template) {
    var changes = [];
    _.each(Template.videosTemplate.friends, function(friend, index){
      if($('#friend-'+index+'-canAccess').is(':checked')!=friend.canAccess){
        changes.push({id:friend.id,status:!friend.canAccess});
      }
    });
    if(changes.length>0) {
      Meteor.call('sharePlaylist', $('#share-playlist-modal').attr('playlist'), changes);
    }
    $('#share-playlist-modal').modal('hide');
  }
, 'click .friendToogle': function (event, template) {
    var index = $(event.currentTarget).attr('data-index')
      , $checkbox = $('#friend-'+index+'-canAccess')
      ;
    $checkbox.prop('checked', !$checkbox.is(':checked'));
    return false;
  }
});

// Create a router for playlists
var VideosRouter = Backbone.Router.extend({
  routes: {
    "playlist/:playlist/video/:video": "openVideo"
  },
  openVideo: function (playlist, video) {
    Session.set('page', 'playlist');
    Session.set("playing", {video:video,playlist:playlist});
    if(!Session.set("playlist")){
      Session.set("playlist", playlist);
    }
  },
  setVideo: function (playlist, video) {
    this.navigate('playlist/'+playlist+'/video/'+video, true);
  }
});

// instantiate router
var videosRouter = new VideosRouter;
