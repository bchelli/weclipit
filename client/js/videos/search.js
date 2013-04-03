/*
 * videos.js
 *
 * Responsible for the fetching of the selected playlist's videos
 *     + the rendering of the videosTemplate
 */

// Set Template Helpers
Template.videosSearchTemplate.helpers({
  canAddVideo: function(){
    if(!Session.get('playlist')) return false;
    return playlists.canAddVideo(
      playlists.findOne({_id:Session.get('playlist')}, {reactive:false})
    , Meteor.user()
    );
  }
});

function isUrl(){
  var query = $('#search-field').val();
  if(query.toLowerCase().indexOf('http') === 0 && query.indexOf(' ') === -1){
    $('#search-form button').html('Add');
    return true;
  } else {
    $('#search-form button').html('Search');
    return false;
  }
}

Template.videosSearchTemplate.events({
  'submit #search-form': function(event, template){
    var query = $('#search-field').val();

    if(isUrl()){
      Meteor.call('addVideo', Session.get('playlist'), query);
      $('#search-field').val('');
    } else {
      $('#providers-tabs a').click(function (e) {
        e.preventDefault();
        $(this).hasClass('provider-tab') && $(this).tab('show');
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
              , id = url.replace('http://www.youtube.com/watch?v=', '').replace('https://www.youtube.com/watch?v=', '')
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
    }
    $('#search-field').focus();
    isUrl();
    return false;
  }
, 'keyup #search-field': isUrl
, 'click .video-to-add': function(event, template){
    var $el = $(event.currentTarget);
    $el
      .addClass('video-added')
      .removeClass('video-to-add')
      ;
    Meteor.call('addVideo', Session.get('playlist'), $el.attr('data-url'));
    return false;
  }
, 'click #close-inline-search': function(){
    $('#search-video-results').hide();
    return false;
  }
});

