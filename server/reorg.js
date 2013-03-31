function initConfig(key){
  var config = configDb.findOne({key:key});
  if(!config){
    configDb.insert({
      key:key
    });
  }
}

function getConfig(key){
  var config = configDb.findOne({key:key});
  return config ? config.value : null;
}

function setConfig(key, value){
  initConfig(key);
  configDb.update({key:key},{key:key,value:value});
}

var reorg = {};

reorg.num1 = function(){
  var users = Meteor.users.find().fetch();
  for(var i in users){
    playlists.update({owner:users[i]._id}, {
      $set: {
        ownerData:publicUserInfo(users[i])
      }
    }, {multi: true});
    videos.update({owner:users[i]._id}, {
      $set: {
        ownerData:publicUserInfo(users[i])
      }
    }, {multi: true});
  }
  return true;
};

reorg.num2 = function(){
  var v = videos.find().fetch()
    , refTime = 1362137187358
    ;

  for(var i in v){
    if(!v[i].createdAt){
      videos.update({_id:v[i]._id}, {
        $set: {
          createdAt:refTime-i*60*1000
        }
      });
    }
  }

  return true;
};

reorg.num3 = function(){
  playlists.update({}, {
    $set: {privacy:'private'}
  }, {multi: true});
  return true;
};

reorg.num4 = function(){
  playlists.update({}, {
    $unset: {canAddVideo:'',canRemoveVideo:''}
  }, {multi: true});
  return true;
};

reorg.num5 = function(){
  var pls = playlists.find().fetch()
    , users = {}
    ;
  _.each(pls, function(pl){
    var canAccess = [];
    _.each(pl.canAccess, function(fbId){
      if(_.isString(fbId)){
        // facebook account
        if(!users[fbId]) {
          var u = Meteor.users.findOne({"services.facebook.id":fbId});
          if(!_.isUndefined(u)){
            users[fbId] = publicUserInfo(u);
          }
        }
        if(!_.isUndefined(u)){
          canAccess.push(users[fbId]);
        }
      } else {
        // user account
        canAccess.push(fbId);
      }
    });
    if(canAccess.length >= 0) playlists.update({_id:pl._id}, {$set:{canAccess:canAccess}});
  });
  return true;
};

reorg.num6 = function(){
  var pls = playlists.find().fetch()
    ;
  _.each(pls, function(pl){
    updatePlaylistThumbnails(pl._id);
  });
  return true;
};

reorg.num7 = function(){
  playlists.update({}, {
    $set: {public:true}
  }, {multi: true});
  return true;
};

reorg.num8 = function(){
  var pls = playlists.find().fetch()
    ;
  _.each(pls, function(pl){
    updateVideoCount(pl._id);
  });
  return true;
};

// RUN Reoganisation on startup
Meteor.startup(function(){
  var db = getConfig('db') || {version:0};
  while(reorg['num'+(db.version+1)]){
    console.log('START REORG '+(db.version+1));
    if(reorg['num'+(db.version+1)]()){
      console.log('DONE REORG '+(db.version+1));
      db.version++;
      setConfig('db', db);
    } else {
      console.log('ERROR IN REORG '+(db.version+1));
      return;
    }
  }
});
