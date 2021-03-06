
var Fiber = Npm.require('fibers');

function videosInPlaylist(playlist){
  return videos.find({playlist:playlist});
}

Meteor.publish('playlist-videos', videosInPlaylist);
Meteor.publish('playing-videos', videosInPlaylist);

Meteor.publish('getLastVideosAdded', function(){
  return videos.getLastVideosAdded(this.userId);
});

Meteor.methods({
  importYoutubePlaylist: function(playlist, youtubePlaylistId){
    if(!Meteor.userId()) return;
    var fiber = Fiber.current;
    Meteor.http.get('http://www.youtube.com/playlist?list='+encodeURIComponent(youtubePlaylistId), function(err, res){
      if(!err){
        var regExp = new RegExp('href="/watch?[^"]+list='+encodeURIComponent(youtubePlaylistId)+'[^"]*"', 'g')
          , extractVideo = new RegExp('v=([^&]+)')
          , list = res.content.match(regExp)
          ;
        for(var i=0,l=list.length;i<l;i++){
          var vid = list[i].match(extractVideo);
          if(vid && vid[1]) {
            Meteor.call('addVideo', playlist, 'http://www.youtube.com/watch?'+vid[0]);
          }
        }
      }
      fiber.run();
    });
    Fiber.yield();
  }
, importSoundcloudPlaylist: function(playlist, soundcloudPlaylist){
    if(!Meteor.userId()) return;
    switch(soundcloudPlaylist.type){
      case 'playlists':
        var fiber = Fiber.current;
        Meteor.http.get('https://api.soundcloud.com/playlists/'+encodeURIComponent(soundcloudPlaylist.id)+'.json?consumer_key=apigee&limit=2000', function(err, res){
          if(!err && res && res.data && res.data.tracks){
            for(var i=0,l=res.data.tracks.length;i<l;i++){
              Meteor.call('addVideo', playlist, res.data.tracks[i].permalink_url);
            }
          }
          fiber.run();
        });
        Fiber.yield();
        break;
      case 'users':
        var fiber = Fiber.current;
        Meteor.http.get('https://api.soundcloud.com/users/'+encodeURIComponent(soundcloudPlaylist.id)+'/tracks.json?consumer_key=apigee&limit=2000', function(err, res){
          if(!err && res && res.data){
            for(var i=0,l=res.data.length;i<l;i++){
              Meteor.call('addVideo', playlist, res.data[i].permalink_url);
            }
          }
          fiber.run();
        });
        Fiber.yield();
        break;
    }
  }
, searchDailymotionVideos: function(query){
    if(!Meteor.userId()) return;
    var fiber = Fiber.current
      , videosDailymotion = []
      ;
    Meteor.http.get('https://api.dailymotion.com/videos?search='+encodeURIComponent(query)+'&fields=duration,id,title,thumbnail_url,owner_fullname,url&sort=relevance&limit=25', function(err, res){
      if(!err){
        videosDailymotion = res && res.data && res.data.list ? res.data.list : [];
      }
      fiber.run();
    });
    Fiber.yield();
    return videosDailymotion;
  }
, searchVimeoVideos: function(query){
    if(!Meteor.userId()) return;
    var fiber = Fiber.current
      , videosVimeo = []
      ;
    var r = new Meteor.OAuthRequest({
      options:{
        clientId:       '72d14f2545ea06a976c21c5cbbadbf5e2846742b'
      , clientSecret:   '6a31f40a6fe6db9dbbd0ac31f2111f4d4e3a5604'
      , token:          'e95de822abd7785017852ec9985e700e'
      , tokenSecret:    '08a9b7db4c0503468481750cda7324c1bf056321'
      }
    , method:       'GET'
    , url:          'http://vimeo.com/api/rest/v2'
    , query:{
        format:           'json'
      , method:           'vimeo.videos.search'
      , per_page:         25
      , query:            query
      , embed_privacy:    'anywhere'
      , full_response:    true
      }
    });
    
    r.call(function(err, result){
      if(!err){
        videosVimeo = result && result.videos && result.videos.video ? result.videos.video : [];
      }
      fiber.run();
    });
    Fiber.yield();
    return videosVimeo;
  }
, searchYoutubeVideos: function(query){
    if(!Meteor.userId()) return;
    var fiber = Fiber.current
      , videosYoutube = []
      ;
    Meteor.http.get('http://gdata.youtube.com/feeds/api/videos?q='+encodeURIComponent(query)+'&alt=json', function(err, res){
      if(!err){
        videosYoutube = res && res.data && res.data.feed && res.data.feed.entry ? res.data.feed.entry : [];
      }
      fiber.run();
    });
    Fiber.yield();
    return videosYoutube;
  }
, addVideo : function(playlist, url){
    if(!Meteor.userId()) return;
    var pl = playlists.findOne({_id:playlist})
      , regExpVimeo = /http(s)?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/
      , regExpYoutube = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
      , regExpYoutubePlaylist = /youtu.+list=([^&]+)/
      , regExpDailymotion = /dailymotion[^\/]+\/video\/([^_]+)/
      , regExpSoundcloud = /soundcloud/
      , provider
      , providerId
      , oEmbedUrl
      , match
      ;

    if(!playlists.canAddVideo(pl)) return;

    if(match = url.match(regExpVimeo)){
      // is vimeo
      provider = 'vimeo';
      oEmbedUrl = 'http://vimeo.com/api/oembed.json?url='+encodeURIComponent(url)
      providerId = match[3];
    } else if(match = url.match(regExpDailymotion)){
      // is dailymotion
      provider = 'dailymotion';
      oEmbedUrl = 'http://www.dailymotion.com/services/oembed?format=json&url='+encodeURIComponent(url)
      providerId = match[1];
    } else if(match = url.match(regExpSoundcloud)){
      // is dailymotion
      provider = 'soundcloud';
      oEmbedUrl = 'http://soundcloud.com/oembed?format=json&url='+encodeURIComponent(url)
    } else if(match = url.match(regExpYoutubePlaylist)) {
      // is youtube
      oEmbedUrl = 'http://www.youtube.com/oembed?url='+encodeURIComponent(url)+'&format=json'
      Meteor.call('importYoutubePlaylist', playlist, match[1]);
      return;
    } else if(match = url.match(regExpYoutube)) {
      // is youtube
      provider = 'youtube';
      oEmbedUrl = 'http://www.youtube.com/oembed?url='+encodeURIComponent(url)+'&format=json'
      providerId = match[1];
    } else {
      // unknown
      return;
    }

    var fiber = Fiber.current;

    Meteor.http.get(
      oEmbedUrl
    , function(err, res){
        if(!err){
          var acceptedFields = ['author_name','author_url','height','html','provider_name','provider_url','thumbnail_height','thumbnail_url','thumbnail_width','title','type','version','width'];
          var resultData = {};
          for(var i=0,l=acceptedFields.length;i<l;i++){
            if(res.data[acceptedFields[i]]) resultData[acceptedFields[i]] = res.data[acceptedFields[i]];
          }
          
          if(provider === 'soundcloud'){
            if(match = res.data.html.match(/tracks%2F([0-9]+)/)){
              providerId = match[1];
            }
            if(match = res.data.html.match(/users%2F([0-9]+)/)){
              Meteor.call('importSoundcloudPlaylist', playlist, {
                type:'users'
              , id:match[1]
              });
            }
            if(match = res.data.html.match(/playlists%2F([0-9]+)/)){
              Meteor.call('importSoundcloudPlaylist', playlist, {
                type:'playlists'
              , id:match[1]
              });
            }
          }

          if(providerId){
            videos.insert({
              url:        url
            , owner:      Meteor.userId()
            , playlist:   playlist
            , provider:   provider
            , providerId: providerId
            , likes:      []
            , nbLikes:    0
            , data:       resultData
            , createdAt:  (new Date()).getTime()
            });
            // update playlist video preview
            playlists.updatePlaylistThumbnails(playlist);
            // update playlist video count
            playlists.updateVideoCount(playlist);
          }
        }
        fiber.run();
      }
    );
    Fiber.yield();
  }
, likeVideo : function(video, status){
    if(!Meteor.userId()) return;
    var userId = Meteor.userId();
    function updateNbLikes(){
      videos.update({_id:video}, {
        $set: {
          nbLikes: videos.findOne({_id:video}).likes.length
        }
      });
    }
    if(status){
      videos.update({_id:video}, {
        $addToSet: {
          likes: userId
        }
      }, updateNbLikes);
    } else {
      videos.update({_id:video}, {
        $pull: {
          likes: userId
        }
      }, updateNbLikes);
    }
  }
, removeVideo : function(video){
    if(!Meteor.userId()) return;
    var vid = videos.findOne({_id:video});
    if(vid){
      var pl = playlists.findOne({_id:vid.playlist});
      if(!playlists.canRemoveVideo(pl, vid)) return;
      videos.remove({_id:video});
      // update playlist video preview
      playlists.updatePlaylistThumbnails(vid.playlist);
      // update playlist video count
      playlists.updateVideoCount(vid.playlist);
    }
  }
});
