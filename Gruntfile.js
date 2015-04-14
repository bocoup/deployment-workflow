module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  var githubUrl = 'https://github.com/bocoup/deployment-workflow/';
  var postReplacements = [
    // Change relative project URLs to absolute
    [/(<a href=")([^"]+)([^>]+>)([^<]+)/g, function(all, pre, href, post, text) {
      if (/^(?:https?:\/\/|#)/.test(href)) { return all; }
      var baseHref = githubUrl + 'blob/master/deploy/';
      if (/^\.\.\//.test(href)) {
        // Vagrantfile
        text = text.slice(3);
      } else if (href === '.') {
        // The deploy folder itself
        href = '';
        baseHref = baseHref.slice(0, -1);
      } else {
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
  ]

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
        postCompile: function(src, context) {
          return postReplacements.reduce(function(src, arr) {
            return src.replace.apply(src, arr);
          }, src);
        },
      },
      readme: {
        src: 'deploy/README.md',
        dest: 'public/index.html',
      }
    }
  });

  grunt.registerTask('default', ['clean', 'copy', 'markdown']);
};
