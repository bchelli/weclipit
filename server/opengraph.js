if(Meteor.isServer){

  // Set Facebook APP ID
  Meteor.facebook.use({
    openGraphTags:function(req){
      return [{"property":"fb:app_id",  "content":"157608577727216"}];
    }
  });

  // Website
  Meteor.facebook.use({
    openGraphTags:function(req){
      var url = __meteor_bootstrap__.require('url'); 
      var parts = url.parse(req.url).pathname.split('/');
      var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
      if(parts.length == 2 && parts[1] === ''){
        return [
          {"property":'og:type',        "content":'website'}
        , {"property":'og:url',         "content":Meteor.absoluteUrl()}
        , {"property":'og:title',       "content":'26 Plays'}
        , {"property":'og:image',       "content":Meteor.absoluteUrl('img/logo.png')}
        , {"property":'og:description', "content":'Keep, play and share your videos with your friends'}
        ];
      }
    }
  });

  // playlist
  Meteor.facebook.use({
    openGraphTags:function(req){
      var url = __meteor_bootstrap__.require('url'); 
      var parts = url.parse(req.url).pathname.split('/');
      var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
      if(parts.length == 3 && parts[1] === 'playlist'){
        var playlistId = parts[2]
          , playlist = playlists.findOne({_id:playlistId})
          , videoList = videos.find({playlist:playlistId}).fetch()
          ;
        var result = [];
        if(playlist){
          result.push({"property":'og:type',        "content":'twentysixplays:video_playlist'});
          result.push({"property":'og:url',         "content":absoluteUrl});
          result.push({"property":'og:title',       "content":playlist.name});
          result.push({"property":'og:image',       "content":Meteor.absoluteUrl('img/logo.png')});
          result.push({"property":'og:description', "content":playlist.name+' by '+playlist.ownerData.profile.name});
        }
        if(videoList){
          for(var i in videoList){
            result.push({
              "property":"og:video"
            , "content":videoList[i].url
            });
          }
        }
        return result;
      }
    }
  });

  // video
  Meteor.facebook.use({
    openGraphTags:function(req){
      var url = __meteor_bootstrap__.require('url'); 
      var parts = url.parse(req.url).pathname.split('/');
      var absoluteUrl = Meteor.absoluteUrl(req.url.substr(0,1)=='/' ? req.url.substr(1) : req.url);
      if(parts.length == 5 && parts[1] === 'playlist' && parts[3] === 'video'){
        var videoId = parts[4]
          , video = videos.findOne({_id:videoId})
          ;
        console.log(video);
        if(video){
          return [
            {"property":'og:type',        "content":'video.other'}
          , {"property":'og:url',         "content":absoluteUrl}
          , {"property":'og:title',       "content":video.data.title}
          , {"property":'og:image',       "content":video.data.thumbnail_url}
          , {"property":'og:video',       "content":video.url}
          , {"property":'og:description', "content":video.data.description}
          ];
        }
        return [];
      }
    }
  });
}