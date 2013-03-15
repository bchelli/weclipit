/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

// Set Template Events
Template.videosTemplate.events({
  'click #remove-playlist-submit': function (event, template) {
    Meteor.call('removePlaylist', event.currentTarget.getAttribute('playlist'));
    $('#remove-playlist-modal').modal('hide');
    homeRouter.openHome();
    return false;
  }
, 'submit #search-video-modal form': function (event, template) {
    var query = $('#search-video-query').val();
    $('#search-video-result').html('Loading');
    Meteor.call('searchYoutubeVideos', query, function(err, videosYoutube){
      var result = '';
      for(var i=0,l=videosYoutube.length;i<l;i++){
        var url = videosYoutube[i].link[0].href.replace('&feature=youtube_gdata', '')
          , id = url.replace('https://www.youtube.com/watch?v=', '')
          , inPlaylist = !!videos.findOne({'provider':'youtube','providerId':id})
          ;
        result += '<tr class="video not-playing '+(inPlaylist?'video-added':'video-to-add')+'" data-url="'+url+'">'
                + '  <td class="videos-preview"><div class="img-container"><img src="'+videosYoutube[i].media$group.media$thumbnail[0].url+'" /></div></td>'
                + '  <td class="videos-description">'
                + '    <div class="video-description-title">'+videosYoutube[i].title.$t+'</div>'
                + '    <div class="video-description-origin">by '+videosYoutube[i].author[0].name.$t+'</div>'
                + '  </td>'
                + '  <td class="videos-added-by">'+formatTime(videosYoutube[i].media$group.yt$duration.seconds)+'</td>'
                + '</tr>'
                ;
      }
      result = '<table class="table table-condensed videos-list"><tbody>'+result+'</tbody></table>';
      $('#search-video-result').html(result);
    });
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
    Session.set('page', 'playlist');
    Session.set("playing", {video:video,playlist:playlist,date:(new Date()).getTime()});
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
