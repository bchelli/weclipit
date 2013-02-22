
Meteor.publish("userData", function () {
  return Meteor.users.find(
    {
      _id:this.userId
    }
  , {
      fields: {
        'services.facebook.id': 1
      , 'services.facebook.name': 1
      }
    }
  );
});
