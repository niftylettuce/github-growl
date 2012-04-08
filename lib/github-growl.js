
//
//     github-growl
//     Copyright (c) 2012 Nick Baugh (niftylettuce@gmail.com)
//     MIT Licensed
//

// * Author: [@niftylettuce](https://twitter.com/#!/niftylettuce)
// * Website: <http://github.com/niftylettuce/>
// * Source: <https://github.com/niftylettuce/github-growl/>

// # github-growl

var path      = require('path')
  , http      = require('http')
  , fs        = require('fs')
  , exec      = require('child_process').exec
  , colors    = require('colors')
  , _         = require('underscore')
  , growl     = require('growl')
  , GitHubApi = require('github')
  , octocat   = path.join(__dirname, '..', 'octocat.png')
  , avatars   = path.join(__dirname, '..', 'avatars')
  , version   = require(path.join(__dirname, '..', 'package.json')).version

exports.version = version;

exports.github = new GitHubApi({ version: '3.0.0' });

exports.eventTypes = [
    'CommitCommentEvent'
  , 'CreateEvent'
  , 'DeleteEvent'
  , 'DownloadEvent'
  , 'GollumEvent'
  , 'IssueCommentEvent'
  , 'IssuesEvent'
  , 'MemberEvent'
  , 'PullRequestEvent'
  , 'PullRequestReviewCommitEvent'
  , 'PushEvent'
  , 'TeamAddEvent'
];

exports.growl = function(gravatar, title, description) {
  growl(description, {
      title: title
    , image: gravatar
  }, function(err) {
    if (err) throw err;
  });
};

// TODO: Utilize ~/.github-growl configs for events per repo if they exist
// Made .settings.json in root of project to hold oauth token and potentially
// repos

exports.authenticate = function(options) {
  var authOptions

  if (options.isAuth) {
    authOptions = {
        type     : 'oauth'
      , token    : options.password
    }
  } else {
    authOptions = {
        type     : 'basic'
      , username : options.username
      , password : options.password
    }
  }
  this.github.authenticate(authOptions);

  if (!options.isAuth) this.createAuth()
};

exports.createAuth = function() {
  var settings = this.options.settings

  var msg = {
      scopes: [
          'user'
        , 'repo'
      ]
    , note: 'github-growl'
    , note_url: 'https://github.com/niftylettuce/github-growl'
  }

  var def = {
      url: '/authorizations'
    , method: 'GET'
    , params: {
        scopes: null
      , note: null
      , note_url: null
    }
  }

  this.github.httpSend(msg, def, function(err, res) {
    var data = JSON.parse(res.data)
      , auth
      , i

    def.method = 'POST'

    for (i in data) {
      auth = data[i]
      if (auth.note === 'github-growl') {
        settings.token = auth.token
        return writeSettings()
      }
    }

    this.github.httpSend(msg, def, function(err, res) {
      var data = JSON.parse(res.data)

      settings.token = data.token
      writeSettings()
    })
  })

  function writeSettings() {
    fs.writeFileSync('.settings.json', JSON.stringify(settings))
  }
}

exports.now = new Date().getTime();

exports.checkRepoId = function(type, id) {
  var some = _.any(this.repos[type], function(el) {
    return el.id === id;
  });
  return some;
};

exports.gravatarLookup = function(actor, callback) {
  var img = actor.gravatar_id
    , opt = {
          host: 'www.gravatar.com'
        , port: 80
        , path: '/avatar/' + img + '?s=128&d=mm'
      }
    , location = path.join(avatars, img)
    , file = fs.createWriteStream(location);
  http.get(opt, function(res) {
    res
      .on('data', function(chunk) {
        file.write(chunk);
      })
      .on('end', function() {
        file.end();
        callback(location);
      });
  });
};

exports.parseEvent = function(event) {

  var that = this;

  that.gravatarLookup(event.actor, function(gravatar) {

    gravatar = gravatar || octocat;

    var title       = ''
      , description = '';

    console.log('DEBUG', event.type);

    switch(event.type) {
      case 'CommitCommentEvent':
        break;
      case 'CreateEvent':
        break;
      case 'DeleteEvent':
        break;
      case 'DownloadEvent':
        break;
      case 'GollumEvent':
        break;
      case 'IssueCommentEvent':
        title += 'Issue #' + event.payload.issue.number;
        title += ' - ' + event.payload.issue.title;
        description += 'New comment by @' + event.actor.login;
        description += '\n';
        description += event.payload.issue.html_url;
        description += '#issuecomment-';
        description += event.payload.comment.id;
        break;
      case 'IssuesEvent':
        break;
      case 'MemberEvent':
        break;
      case 'PullRequestEvent':
        break;
      case 'PullRequestReviewCommitEvent':
        break;
      case 'PushEvent':
        break;
      case 'TeamAddEvent':
        break;
      default:
        title += 'Github Notification';
        description += 'An event occured on Github, go check it out!';
    }
    that.growl(gravatar, title, description);
  });
};

exports.monitorEvents = function(type, options) {
  var that = this;
  that.github.events.get({}, function(err, events) {
    var elements = events.filter(function(el) {
      return new Date(el.created_at).getTime() >= that.now
          && that.checkRepoId(type, el.repo.id)
          && _.indexOf(that.eventTypes, el.type) !== -1;
    });
    if (elements.length > 0) {
      elements.forEach(function(event) {
        that.parseEvent(event);
      });
    } else {
      console.log(' No events detected');
    }
    that.now = new Date().getTime();
  });
};

exports.repos = {
    user: {}
  , organization: {}
};

exports.getUserRepos = function(options) {
  var that = this;
  that.github.repos.getFromUser({
      user: options.username
    , type: 'all'
  }, function(err, data) {
    if (err) throw err;
    /*
    // NOTE: This doesn't really work since repo properties change quite often
    if (!_.isEqual(that.repos.user, data)) {
      console.log('  ✔'.green + '  Updated list of user repositories');
      that.repos.user = data;
    }
    */
    that.repos.user = data;
    that.monitorEvents('user', options);
    setTimeout(function() {
      that.getUserRepos(options);
    }, options.interval);
  });
};

exports.monitor = function(options) {

  // Load options object
  options = this.options = options || {};

  // Ensure all required options are passed
  var required = ['username', 'password', 'interval'];
  required.forEach(function(val) {
    if (typeof options[val] === 'undefined') {
      console.log('  ✗'.red + '  Missing ' + val);
      return process.exit(1);
    }
  });

  // Ensure that interval is not going to cause rate limiting errors
  if (options.interval < 5000) {
    console.log('  ✗'.red + '  Rate limiting prevention b/c interval < 5s');
    return process.exit(1);
  }

  // Authenticate user
  this.authenticate(options);

  // Monitor user's repositories
  this.getUserRepos(options);

};
