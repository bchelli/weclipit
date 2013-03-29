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
    if(right === "isOwner") return playlists.isOwner(playlist, myUser);
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
    _gaq.push(['_trackEvent', 'video', 'search', 'url']);
    return false;
  }
, 'click .add-video-from-search': function (event, template) {
    var provider = event.currentTarget.getAttribute('data-provider');
    $('#search-video-query').val('');
    $('#search-video-provider').val(provider);
    $('#search-video-result').html('');
    $('#search-video-modal')
      .on('shown', function(){
        $('#search-video-query').focus();
      })
      .modal();
    _gaq.push(['_trackEvent', 'video', 'search', provider]);
    return false;
  }
, 'click .remove-video': function (event, template) {
    $('#remove-video-submit').attr('video', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal')
      .on('shown', function(){
        $('#remove-video-submit').focus();
      })
      .modal();
    _gaq.push(['_trackEvent', 'video', 'remove']);
    return false;
  }
, 'click .like-video': function (event, template) {
    var videoId = event.currentTarget.getAttribute('video')
      , status = !videos.findOne({_id:videoId}).likes || !_.contains(videos.findOne({_id:videoId}).likes, Meteor.userId())
      ;
    Meteor.call('likeVideo', videoId, status);
    _gaq.push(['_trackEvent', 'video', 'like']);
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
, 'click .open-user': function (event, template) {
    var $target=$(event.currentTarget);
    usersRouter.openUser($target.attr('data-user-id'));
    return false;
  }
, 'submit #search-form': function(event, template){
    var query = $('#search-field').val()
      ;
    $('#providers-tabs a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    });
    $('#search-video-results').show();

    function displaySearchResults(videos, target){
      var result = '';
      for(var i=0,l=videos.length;i<l;i++){
        result += '<tr class="video not-playing '+(videos[i].inPlaylist?'video-added':'video-to-add')+'" data-url="'+videos[i].url+'">'
                + '  <td class="videos-preview"><div class="img-container"><img src="'+videos[i].thumbnail+'" /></div></td>'
                + '  <td class="videos-description">'
                + '    <div class="video-description-title">'+videos[i].title+'</div>'
                + '    <div class="video-description-origin">'+(videos[i].author===''?'':'by '+videos[i].author)+'</div>'
                + '  </td>'
                + '  <td class="videos-added-by">'+formatTime(videos[i].duration)+'</td>'
                + '</tr>'
                ;
      }
      if(result === '') result = 'No video match your search';
      else result = '<table class="table table-condensed videos-list"><tbody>'+result+'</tbody></table>';
      $(target).html(result);
    }

    $('#search-video-result-vimeo').html('Loading');
    $('#search-video-result-youtube').html('Loading');
    $('#search-video-result-dailymotion').html('Loading');
    Meteor.call('searchDailymotionVideos', query, function(err, videosDailymotion){
      var videosResult = [];
      if(!err){
        for(var i=0,l=videosDailymotion.length;i<l;i++){
          videosResult.push({
            url:        videosDailymotion[i].url
          , inPlaylist: !!videos.findOne({'provider':'dailymotion','providerId':videosDailymotion[i].id})
          , thumbnail:  videosDailymotion[i].thumbnail_url
          , title:      videosDailymotion[i].title
          , duration:   videosDailymotion[i].duration
          , author:     videosDailymotion[i].owner_fullname
          });
        }
      }
      displaySearchResults(videosResult, '#search-video-result-dailymotion');
    });
    Meteor.call('searchYoutubeVideos', query, function(err, videosYoutube){
      var videosResult = [];
      if(!err){
        for(var i=0,l=videosYoutube.length;i<l;i++){
          var url = videosYoutube[i].link[0].href.replace('&feature=youtube_gdata', '')
            , id = url.replace('http://www.youtube.com/watch?v=', '')
            ;
          videosResult.push({
            url:        url
          , inPlaylist: !!videos.findOne({'provider':'youtube','providerId':id})
          , thumbnail:  videosYoutube[i].media$group.media$thumbnail[0].url
          , title:      videosYoutube[i].title.$t
          , duration:   videosYoutube[i].media$group.yt$duration.seconds
          , author:     videosYoutube[i].author[0].name.$t
          });
        }
      }
      displaySearchResults(videosResult, '#search-video-result-youtube');
    });
    Meteor.call('searchVimeoVideos', query, function(err, videosVimeo){
      var videosResult = [];
      if(!err){
        for(var i=0,l=videosVimeo.length;i<l;i++){
          videosResult.push({
            url:        'http://vimeo.com/'+videosVimeo[i].id
          , inPlaylist: !!videos.findOne({'provider':'vimeo','providerId':videosVimeo[i].id})
          , thumbnail:  videosVimeo[i].thumbnails.thumbnail[0]._content
          , title:      videosVimeo[i].title
          , duration:   videosVimeo[i].duration
          , author:     videosVimeo[i].owner.display_name
          });
        }
      }
      displaySearchResults(videosResult, '#search-video-result-vimeo');
    });
    $('#search-video-query').focus();
    return false;
  }
, 'click .video-to-add': function(event, template){
    var $el = $(event.currentTarget);
    $('#search-field').val('');
    Meteor.call('addVideo', Session.get('playlist'), $el.attr('data-url'));
    return false;
  }
});

