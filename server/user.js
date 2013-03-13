
Meteor.publish("userData", function () {
  return Meteor.users.find(
    {
      _id:this.userId
    }
  , {
      fields: {
        'services.facebook.id': 1
      , 'services.twitter.id': 1
      , 'services.twitter.screenName': 1
      , 'services.google.id': 1
      }
    }
  );
});
