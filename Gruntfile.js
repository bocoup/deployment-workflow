var path = require('path');
var yaml = require('js-yaml');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  var githubUrl = 'https://github.com/bocoup/deployment-workflow/';

  // Replacements to make before the markdown is parsed into HTML.
  var preReplacements = [
    // Handle <!--foo bar baz--> "templates"
    [/<!--\s*(\S+)\s*(.*?)\s*-->/g, function(_, method, args) {
      var methods = {
        // Add linked role tasks as an unordered list.
        'role-files': function(role) {
          var glob, files;
          var rolebase = 'ansible/roles/' + role;
          var tasks = [];
          glob = rolebase + '/tasks/*.yml';
          files = grunt.file.expand({cwd: 'deploy'}, glob);
          files.forEach(function(filepath) {
            var filename = path.basename(filepath);
            var lines = grunt.file.read('deploy/' + filepath).split('\n');
            var memo = {};
            var i = lines.length - 1;
            var doc;
            while (i--) {
              try {
                doc = yaml.safeLoad(lines.slice(i).join('\n'));
              } catch (err) {}
              var name = doc && doc[0] && doc[0].name;
              if (name && !memo[name]) {
                memo[name] = true;
                tasks.unshift(' * [' + name + '](' + filepath + '#L' + (i + 1) + ')');
              }
            }
            tasks.unshift('* [' + filename + '](' + filepath + ')');
          });
          var templates = [];
          glob = rolebase + '/templates/*';
          files = grunt.file.expand({cwd: 'deploy'}, glob);
          files.forEach(function(filepath) {
            var filename = path.basename(filepath);
            templates.push('* [' + filename + '](' + filepath + ')');
          });
          var output = [
            'This role contains the following files and tasks:',
            '',
          ].concat(tasks);
          if (templates.length > 0) {
            output = output.concat([
              '',
              'And the following templates:',
              '',
            ]).concat(templates);
          }
          output.push(
            '',
            '_(Browse the [' + rolebase + '](' + rolebase + ') directory for more information)_'
          );
          return output.join('\n');
        },
      };
      return methods[method].apply(null, args.split(' '));
    }],
  ];

  // Replacements to make after the markdown is parsed into HTML.
  var postReplacements = [
    // Change relative project URLs to absolute
    [/(<a href=")([^"]+)([^>]+>)([^<]+)/g, function(all, pre, href, post, text) {
      if (/^(?:https?:\/\/|#)/.test(href)) { return all; }
      var baseHref = githubUrl + 'blob/twenty/deploy/';
      if (/^\.\.\//.test(href)) {
        // Vagrantfile
        text = text.slice(3);
      } else if (href === '.') {
        // The deploy folder itself
        href = '';
        baseHref = baseHref.slice(0, -1);
      } else if (text === href) {
        // Files within the deploy folder
        text = 'deploy/' + text;
      }
      return pre + baseHref + href + post + text;
    }],
    // Make headers "linkable" in the Github style
    [/(<h\d id=")([^"]+)([^>]+>)/g, function(_, pre, id, post) {
      return pre + id + post + '<a class="anchor" aria-hidden="true" href="#' + id + '"><span class="octicon octicon-link"></span></a>';
    }],
    // Footer
    [/$/, function() {
      return '<div id=footer>' +
        [
          'Built with &lt;3 at <a href="http://bocoup.com/">Bocoup</a>',
          'Get the source at <a href="' + githubUrl + '">GitHub</a>',
          'Last updated on ' + (new Date).toDateString() + '.',
        ].join(' • ') +
        '</div>';
    }],
  ];

  grunt.initConfig({
    clean: {
      all: 'public',
    },
    copy: {
      wwwroot: {
        expand: true,
        cwd: 'build/wwwroot',
        src: '**/*',
        dest: 'public',
      },
      'github-markdown-css': {
        src: 'bower_components/github-markdown-css/github-markdown.css',
        dest: 'public/github-markdown.css',
      }
    },
    markdown: {
      options: {
        template: 'build/index.html',
      },
      readme: {
        options: {
          preCompile: function(src, context) {
            return preReplacements.reduce(function(src, arr) {
              return src.replace.apply(src, arr);
            }, src);
          },
          postCompile: function(src, context) {
            return postReplacements.reduce(function(src, arr) {
              return src.replace.apply(src, arr);
            }, src);
          },
        },
        src: 'deploy/README.md',
        dest: 'public/index.html',
      },
      '404': {
        src: 'build/404.md',
        dest: 'public/404.html',
      }
    },
    watch: {
      readme: {
        files: [
          'deploy/README.md',
          'build/**',
        ],
        tasks: ['default']
      },
    },
  });

  grunt.registerTask('build', ['clean', 'copy', 'markdown']);
  grunt.registerTask('dev', ['build', 'watch']);
  grunt.registerTask('default', ['build']);
};
