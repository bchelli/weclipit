if(Meteor.isServer) {
  (function () {
    var querystring = Npm.require('querystring')
      , useragent = Npm.require('useragent')
      , Fiber = Npm.require('fibers')
      ;

    if (!Meteor.facebook) {	 
      Meteor.facebook = {};
    }

    if (!Meteor.facebook._options) {
      Meteor.facebook._options = {};
    }

    Meteor.facebook.use = function(options) {
      Meteor.facebook._options = Meteor.facebook._options || {};
      for(var i in options){
        Meteor.facebook._options[i] = Meteor.facebook._options[i] || [];
        Meteor.facebook._options[i].push(options[i]);
      }
    };

    Meteor.facebook.accessToken = function(){
      var config = Accounts.loginServiceConfiguration.findOne({service: 'facebook'});

      if (!config) throw new Accounts.ConfigError("Service not configured");

      // Request an access token
      var result = Meteor.http.get(
        "https://graph.facebook.com/oauth/access_token", {
          params: {
            client_id: config.appId,
            client_secret: config.secret,
            grant_type:'client_credentials'
          }
        }
      );

      if (result.error) throw result.error;

      var response = result.content;
  
      // Errors come back as JSON but success looks like a query encoded in a url
      var error_response;
      try {
        // Just try to parse so that we know if we failed or not,
        // while storing the parsed results
        error_response = JSON.parse(response);
      } catch (e) {
        error_response = null;
      }
  
      if (error_response) throw new Meteor.Error(500, "Error trying to get access token from Facebook", error_response);
      else {
        // Success!  Extract the facebook access token and expiration
        // time from the response
        var parsedResponse = querystring.parse(response);
        var fbAccessToken = parsedResponse.access_token;
        var fbExpires = parsedResponse.expires;
  
        if (!fbAccessToken) throw new Meteor.Error(500, "Couldn't find access token in HTTP response.");
        return {
          accessToken: fbAccessToken,
          expiresIn: fbExpires
        };
      }

    }

    Meteor.facebook.api = function(action, method, params, callback){
      params.access_token = Meteor.facebook.accessToken().accessToken;
      Meteor.http.call(method.toUpperCase(), 'https://graph.facebook.com'+action,{params:params}, callback);
    }

    __meteor_bootstrap__.app.use(function(req, res, next) {

      try {
        // IS ACTUALLY FACEBOOK
        var ua = useragent.parse(req.headers['user-agent']);
        if (ua.family === 'FacebookBot') {
  
          res.writeHead(200, {'Content-Type': 'text/html'});
  
          Fiber(function () {
  
            // GENERATE OPEN GRAPH TAGS
            if (Meteor.facebook._options.openGraphTags) {
              res.write('<head>');
              for(var ogt in Meteor.facebook._options.openGraphTags){
                var head = Meteor.facebook._options.openGraphTags[ogt](req);
                if (head) {
                  for(var i in head){
                    res.write('<meta property="'+_.escape(head[i].property)+'" content="'+_.escape(head[i].content)+'" />');
                  }
                }
              }
              res.write('</head>');
            }
  
            res.end();
  
          }).run();
        } else {
          next();   
        }
      } catch (e) {
        next();
      }
    });
  })();
}