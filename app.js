(function() {

  return {

    newAuthorId: 0,

    requests: {
      getArticles: function(authorId) {
        return {
          url: helpers.fmt('/api/v2/help_center/users/%@/articles.json?per_page=100', authorId)
        };
      },

      updateArticleAuthor: function(articleId, authorId) {
        return {
          type: 'PUT',
          contentType: 'application/json',
          url: helpers.fmt('/api/v2/help_center/articles/%@.json', articleId),
          data: JSON.stringify({article: { author_id: parseInt(authorId, 10) }})
        };
      },

      getNewAuthorRole: function(authorId) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', authorId)
        };
      }
    },

    events: {
      'app.activated'         :'init',
      'click #reassign'       :'onReassignButtonClick',
      'click #retry'          :'init',
      'getNewAuthorRole.done' :'verifyAuthorRole',
      'getNewAuthorRole.fail' :'onGetFail',
      'getArticles.done'      :'reassignArticles',
      'getArticles.fail'      :'onGetFail'
    },

    init: function() {
      var currentUser = this.user();

      this.switchTo('agent_selector', currentUser);
    },

    onReassignButtonClick: function() {
      this.newAuthorId = this.$('#agentId').val();
      this.switchTo('loading');
      this.ajax('getNewAuthorRole', this.newAuthorId);
    },

    onGetFail: function() {
      this.displayMessage(false, 'Failed to retrieve list of articles!');
    },

    verifyAuthorRole: function(data) {
      var newAuthor = data.user;
      var currentAuthorId = this.user().id();

      if (newAuthor.role === "end-user" || !newAuthor) {
        this.displayMessage(false, 'Cannot reassign articles to ' + newAuthor.name + '! ' +
         newAuthor.name + ' is an end-user.');
      } else {
        this.ajax('getArticles', currentAuthorId);
      }
    },

    reassignArticles: function(data) {
      var articles = data.articles;
      var requests = [];
      var currentUser = this.user();

      if (articles.length < 1) {
        this.displayMessage(false, currentUser.name() + ' has no articles to reassign!');
      }
      else {
        for (var i = 0; i < articles.length; i++) {
          requests.push(
            this.ajax('updateArticleAuthor', articles[i].id, this.newAuthorId)
          );
        } 
        this.updateArticleRecords(requests);
      }
    },

    updateArticleRecords: function(requests) {
      this.
        when.
        apply(this, requests).
        done(
          _.bind(function(){
            this.displayMessage(true, requests.length + ' articles reassigned successfully!');
        }, this)).
        fail(
          _.bind(function(){
            this.displayMessage(false, 'Unable to reassign articles!');
        }, this));
    },

    displayMessage: function(success, message) {
      this.switchTo(
        'error',
        { 
          success: success, 
          message: message 
        }
      );
    }
  };

}());
