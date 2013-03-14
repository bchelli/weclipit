
Template.setNameTemplate.events = {
  'submit form':function(ev, template){
    var name = $('#your-name').val();
    Meteor.call('setName', name, function(err){
      if(err){
        $('#set-name-error').html(err.reason);
      }
    });
    return false;
  }
};