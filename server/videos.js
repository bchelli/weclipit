
Meteor.publish('videos', function(pls){
  pls = ''+pls;
  return videos.find({playlist:{'$in':pls.split(',')}});
});

Meteor.methods({
  importYoutubePlaylist: function(playlist, youtubePlaylistId){
    var fiber = Fiber.current;
    Meteor.http.get('http://www.youtube.com/playlist?list='+encodeURIComponent(youtubePlaylistId), function(err, res){
      if(!err){
        var regExp = new RegExp('href="/watch?[^"]+list='+encodeURIComponent(youtubePlaylistId)+'[^"]+"', 'g')
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
, searchDailymotionVideos: function(query){
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
    var pl = playlists.findOne({_id:playlist})
      , regExpVimeo = /http(s)?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/
      , regExpYoutube = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
      , regExpYoutubePlaylist = /youtu.+list=([^&]+)/
      , regExpDailymotion = /dailymotion[^\/]+\/video\/([^_]+)/
      , provider = ''
      , providerId = ''
      , oEmbedUrl = ''
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
          , ownerData:  publicUserInfo(Meteor.user())
          });
        }
        fiber.run();
      }
    );
    Fiber.yield();
  }
, likeVideo : function(video, status){
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
    var vid = videos.findOne({_id:video});
    if(vid){
      var pl = playlists.findOne({_id:vid.playlist});
      if(!playlists.canRemoveVideo(pl, vid)) return;
      videos.remove({_id:video});
    }
  }
});
