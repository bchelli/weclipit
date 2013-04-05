
Meteor.OAuthRequest = function(req){
  this.req = req;
}

Meteor.OAuthRequest.prototype._setOauthHeaders = function(){
  if(!this.req.options.bearer){
    this.oauth = {
      "consumer_key":this.req.options.clientId
    , "nonce":(new Date()).getTime()+'0'+(new Date()).getTime()
    , "signature_method":"HMAC-SHA1"
    , "timestamp":Math.floor((new Date()).getTime()/1000)
    , "version":"1.0"
    };
  } else {
    this.oauth = {bearer:this.req.options.bearer};
  }
  if(this.req.options.token && this.req.options.tokenSecret){
    this.oauth.token = this.req.options.token;
  }
};

Meteor.OAuthRequest.prototype._getSignature = function(){
  var crypto = Npm.require('crypto')
    , qs = Npm.require('querystring')
    , hmac
    , obj = {}
    , sigObj = {}
    , keys = []
    ;

  if(this.req.options.token && this.req.options.tokenSecret){
    hmac = crypto.createHmac('sha1', this.req.options.clientSecret+'&'+this.req.options.tokenSecret);
  } else {
    hmac = crypto.createHmac('sha1', this.req.options.clientSecret);
  }

  for(var i in this.req.query){
    obj[i] = this.req.query[i];
    keys.push(i);
  }

  for(var i in this.oauth){
    obj['oauth_'+i] = this.oauth[i];
    keys.push('oauth_'+i);
  }

  keys.sort();

  for(var i in keys){
    sigObj[keys[i]] = obj[keys[i]];
  }

  var data = [
    this.req.method
  , encodeURIComponent(this.req.url)
  , encodeURIComponent(qs.stringify(sigObj))
  ];
  
  hmac.update(data.join('&'));
  
  return hmac.digest('base64');
};

Meteor.OAuthRequest.prototype.call = function(callback){
  var url = Npm.require('url')
    , urlParsed = url.parse(this.req.url)
    , qs = Npm.require('querystring').stringify(this.req.query)
    , http = Npm.require(urlParsed.protocol.substr(0,urlParsed.protocol.length-1))
    ;

  this._setOauthHeaders();

  var options = {
    hostname: urlParsed.hostname
  , path: urlParsed.pathname+(qs===''?'':'?'+qs)
  , method: this.req.method
  , headers:{}
  };

  if(this.oauth.bearer){
    options.headers = {
      'Authorization':'Bearer '+encodeURIComponent(this.oauth.bearer)
    }
  } else {
    options.headers = {
      'Authorization':'OAuth realm="",'
                +'oauth_consumer_key="'+      encodeURIComponent(this.oauth.consumer_key)+'",'
                +'oauth_version="'+           encodeURIComponent(this.oauth.version)+'",'
                +'oauth_signature_method="'+  encodeURIComponent(this.oauth.signature_method)+'",'
                +'oauth_timestamp="'+         encodeURIComponent(this.oauth.timestamp)+'",'
                +'oauth_nonce="'+             encodeURIComponent(this.oauth.nonce)+'",'
                +(this.oauth.token?'oauth_token="'+             encodeURIComponent(this.oauth.token)+'",':'')
                +'oauth_signature="'+         encodeURIComponent(this._getSignature())+'"'
    }
  }

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var result = [];
    res.on('data', function (chunk) {
      result.push(chunk);
    });
    res.on('end', function (chunk) {
      result.push(chunk);
      callback(null, JSON.parse(result.join('')));
    });
  });

  req.on('error', callback);

  req.end();
}

