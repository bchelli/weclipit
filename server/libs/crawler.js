if(Meteor.isServer) {
  (function () {
    var useragent = __meteor_bootstrap__.require('useragent');

    if (!Meteor.crawler) {	 
      Meteor.crawler = {};
    }

    if (!Meteor.crawler._options) {
      Meteor.crawler._options = {};
    }

    Meteor.crawler.use = function(options) {
      Meteor.crawler._options = Meteor.crawler._options || {};
      for(var i in options){
        Meteor.crawler._options[i] = Meteor.crawler._options[i] || [];
        Meteor.crawler._options[i].push(options[i]);
      }
    };

    __meteor_bootstrap__.app.use(function(req, res, next) {

      try {
        // IS ACTUALLY crawler
        var ua = useragent.parse(req.headers['user-agent']);
        if (ua.family === 'Spider' || ua.family === 'Googlebot') {
  
          res.writeHead(200, {'Content-Type': 'text/html'});
  
          Fiber(function () {
  
            // GENERATE OPEN GRAPH TAGS
            if (Meteor.crawler._options.metas) {
              res.write('<head>');
              for(var ogt in Meteor.crawler._options.metas){
                var head = Meteor.crawler._options.metas[ogt](req);
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
      } catch(e) {
        next();
      }
    });
  })();
}