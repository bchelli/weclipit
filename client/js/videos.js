/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

Deps.autorun(function () {
  var pl = Session.get('playlist');
  var playing = Session.get('playing');
  var pls = [];
  if(pl) pls.push(pl);
  if(playing && playing.playlist && playing.playlist!=pl) pls.push(playing.playlist);
  Meteor.subscribe('videos', pls.join(','));
});

Template.videosTemplate.helpers({
  isPlaylistPage:function(){
    return Session.get('page') === 'playlist';
  }
});

Template.videosTemplate.rendered = function(){
  setNicescroll("#video-right-container,#video-left-container");
  Deps.autorun(function(){
    Session.get('playing');
    Session.get('playlist');
    setNicescroll("#video-right-container,#video-left-container");
  });
};

// Set Template Events
Template.videosTemplate.events({
  'click #remove-playlist-submit': function (event, template) {
    var pl = event.currentTarget.getAttribute('playlist');
    Meteor.call('removePlaylist', pl);
    $('#remove-playlist-modal').modal('hide');
    var playing = Session.get('playing');
    if(playing && playing.playlist && playing.playlist===pl) Session.set('playing', null);
    if(playing && playing.playlist && playing.playlist!==pl) playlistsRouter.setPlaylist(playing.playlist);
    else homeRouter.goToPage('home');
    return false;
  }
, 'submit #search-video-modal form': function (event, template) {

    function displaySearchResults(videos){
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
      result = '<table class="table table-condensed videos-list"><tbody>'+result+'</tbody></table>';
      $('#search-video-result').html(result);
    }

    var query = $('#search-video-query').val()
      , provider = $('#search-video-provider').val()
      ;
    $('#search-video-result').html('Loading');
    switch(provider){
      case 'dailymotion':
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
          displaySearchResults(videosResult);
        });
        break;
      case 'youtube':
        Meteor.call('searchYoutubeVideos', query, function(err, videosYoutube){
          var videosResult = [];
          if(!err){
            for(var i=0,l=videosYoutube.length;i<l;i++){
              var url = videosYoutube[i].link[0].href.replace('&feature=youtube_gdata', '')
                , id = url.replace('https://www.youtube.com/watch?v=', '')
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
          displaySearchResults(videosResult);
        });
        break;
      case 'vimeo':
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
          displaySearchResults(videosResult);
        });
        break;
    }
    $('#search-video-query').focus();
    return false;
  }
, 'click .video-to-add': function(event, template){
    var $el = $(event.currentTarget);
    $el
      .removeClass('video-to-add')
      .addClass('video-added')
      ;
    Meteor.call('addVideo', Session.get('playlist'), $el.attr('data-url'));
    return false;
  }
, 'submit #add-video-modal form': function (event, template) {
    $('#add-video-btn').button('loading');
    Meteor.call('addVideo', Session.get('playlist'), $('#add-video-url').val(), function(){
      $('#add-video-btn').button('reset');
      $('#add-video-modal').modal('hide');
    });
    return false;
  }
, 'click #remove-video-submit': function (event, template) {
    Meteor.call('removeVideo', event.currentTarget.getAttribute('video'));
    $('#remove-video-modal').modal('hide');
    return false;
  }
});

// Create a router for playlists
var VideosRouter = Backbone.Router.extend({
  routes: {
    "playlist/:playlist/video/:video": "openVideo"
  },
  openVideo: function (playlist, video) {
    this.setVideo(playlist, video);
    Session.set("playing", {video:video,playlist:playlist,date:(new Date()).getTime()});
    if(!Session.get('page')
        || Session.get('page') === '' 
        || Session.get('page') === 'playlist' && !Session.get("playlist")){
      Session.set('page', 'playlist');
      Session.set("playlist", playlist);
    }
  },
  setVideo: function (playlist, video) {
    this.navigate('playlist/'+playlist+'/video/'+video, true);
  }
});

// instantiate router
var videosRouter = new VideosRouter;
