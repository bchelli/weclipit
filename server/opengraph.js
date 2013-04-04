if(Meteor.isServer){

  function getFacebookVideoUrl(video){
    switch(video.provider){
      case 'youtube':
        return 'http://www.youtube.com/v/'+video.providerId+'?version=3&amp;autohide=1';
        break;
      case 'vimeo':
        return 'http://vimeo.com/moogaloop.swf?clip_id='+video.providerId;
        break;
      case 'dailymotion':
        return 'http://www.dailymotion.com/swf/video/'+video.providerId+'?autoPlay=1';
        break;
      case 'soundcloud':
        return 'http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F'+video.providerId+'&amp;color=3b5998&amp;auto_play=true&amp;show_artwork=false';
        break;
    }
    return false;
  }

  function getTwitterVideoUrl(video){
    switch(video.provider){
      case 'youtube':
        return 'https://www.youtube.com/embed/'+video.providerId;
        break;
      case 'vimeo':
        return 'https://player.vimeo.com/video/'+video.providerId;
        break;
      case 'dailymotion':
        return 'http://www.dailymotion.com/swf/video/'+video.providerId+'?autoPlay=1';
        break;
      case 'soundcloud':
        return 'https://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F'+video.providerId+'&amp;color=3b5998&amp;auto_play=false&amp;show_artwork=true';
        break;
    }
    return false;
  }

  // Set Facebook APP ID
  Meteor.facebook.use({
    openGraphTags:function(req){
      return [{"property":"fb:app_id",  "content":"157608577727216"}];
    }
  });

  // Website
  function isWebsite(req){
    var url = __meteor_bootstrap__.require('url'); 
    var parts = url.parse(req.url).pathname.split('/');
    var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
    return (parts.length == 2 && parts[1] === '');
  }
  Meteor.twitter.use({
    openGraphTags:function(req){
      if(isWebsite(req)){
        return [
          {"property":'twitter:card',         "content":'summary'}
        , {"property":'twitter:site',         "content":"@26plays"}
        , {"property":'twitter:url',          "content":Meteor.absoluteUrl()}
        , {"property":'twitter:title',        "content":'26 Plays'}
        , {"property":'twitter:image',        "content":Meteor.absoluteUrl('img/playlist-og.jpg')}
        , {"property":'twitter:description',  "content":'Keep, play and share your videos with your friends'}
        ];
      }
      return [];
    }
  });
  Meteor.facebook.use({
    openGraphTags:function(req){
      if(isWebsite(req)){
        return [
          {"property":'og:type',        "content":'website'}
        , {"property":'og:url',         "content":Meteor.absoluteUrl()}
        , {"property":'og:title',       "content":'26 Plays'}
        , {"property":'og:image',       "content":Meteor.absoluteUrl('img/playlist-og.jpg')}
        , {"property":'og:description', "content":'Keep, play and share your videos with your friends'}
        ];
      }
      return [];
    }
  });

  // playlist
  function isPlaylist(req){
    var url = __meteor_bootstrap__.require('url'); 
    var parts = url.parse(req.url).pathname.split('/');
    if(parts.length == 3 && parts[1] === 'playlist'){
      return parts[2];
    }
    return false;
  }
  Meteor.twitter.use({
    openGraphTags:function(req){
      var playlistId = isPlaylist(req);
      if(playlistId){
        var playlist = playlists.findOne({_id:playlistId})
          , u = Meteor.users.findOne({_id:playlist.owner})
          , absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url)
          ;
        if(playlist){
          return [
            {"property":'twitter:card',        "content":'summary'}
          , {"property":'twitter:site',        "content":"@26plays"}
          , {"property":'twitter:url',         "content":absoluteUrl}
          , {"property":'twitter:title',       "content":playlist.name}
          , {"property":'twitter:image',       "content":Meteor.absoluteUrl('img/playlist-og.jpg')}
          , {"property":'twitter:description', "content":playlist.name+' by '+u.profile.name+' on 26plays.com'}
          ];
        }
      }
      return [];
    }
  });
  Meteor.facebook.use({
    openGraphTags:function(req){
      var playlistId = isPlaylist(req);
      var result = [];
      if(playlistId){
        var playlist = playlists.findOne({_id:playlistId})
          , u = Meteor.users.findOne({_id:playlist.owner})
          , videoList = videos.find({playlist:playlistId}).fetch()
          , absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url)
          ;
        if(playlist){
          result.push({"property":'og:type',        "content":'twentysixplays:video_playlist'});
          result.push({"property":'og:url',         "content":absoluteUrl});
          result.push({"property":'og:title',       "content":playlist.name});
          result.push({"property":'og:image',       "content":Meteor.absoluteUrl('img/playlist-og.jpg')});
          result.push({"property":'og:description', "content":playlist.name+' by '+u.profile.name+' on 26plays.com'});
        }
        if(videoList){
          for(var i in videoList){
            result.push({"property":"og:video",     "content":getFacebookVideoUrl(videoList[i])
            });
          }
        }
      }
      return result;
    }
  });

  // video
  function isVideo(req){
    var url = __meteor_bootstrap__.require('url'); 
    var parts = url.parse(req.url).pathname.split('/');
    if(parts.length == 5 && parts[1] === 'playlist' && parts[3] === 'video'){
      return parts[4];
    }
    return false;
  }
  Meteor.twitter.use({
    openGraphTags:function(req){
      var videoId = isVideo(req);
      if(videoId){
        var video = videos.findOne({_id:videoId});
        var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
        if(video){
          return [
            {"property":'twitter:card',         "content":'player'}
          , {"property":'twitter:site',         "content":"@26plays"}
          , {"property":'twitter:url',          "content":absoluteUrl}
          , {"property":'twitter:title',        "content":video.data.title}
          , {"property":'twitter:image',        "content":video.data.thumbnail_url}
          , {"property":'twitter:player',       "content":getTwitterVideoUrl(video)}
          , {"property":'twitter:player:width', "content":video.data.width}
          , {"property":'twitter:player:height',"content":video.data.height}
          , {"property":'twitter:description',  "content":video.data.description}
          ];
        }
      }
      return [];
    }
  });
  Meteor.facebook.use({
    openGraphTags:function(req){
      var videoId = isVideo(req);
      if(videoId){
        var video = videos.findOne({_id:videoId});
        var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
        if(video){
          return [
            {"property":'og:type',        "content":'video'}
          , {"property":'og:url',         "content":absoluteUrl}
          , {"property":'og:title',       "content":video.data.title}
          , {"property":'og:image',       "content":video.data.thumbnail_url}
          , {"property":'og:video',       "content":getFacebookVideoUrl(video)}
          , {"property":'og:description', "content":video.data.description}
          ];
        }
      }
      return [];
    }
  });
}