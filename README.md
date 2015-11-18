# Modern Web Deployment Workflow

The files and directory you care about are:

* [Vagrantfile](Vagrantfile)
* [ansible.cfg](ansible.cfg)
* [.gitignore](.gitignore)
* [deploy/](deploy/)

Everything else is used to generate the [project home page][home], which is just
a stylized version of the main project documentation
([deploy/README.md](deploy/README.md)). And yes, the deployment workflow
homepage is deployed using the deployment workflow.

[home]: https://deployment-workflow.bocoup.com/

If this is your first time here, you should start by reading [the
documentation][home].

## Developing the project homepage

This assumes that the [deployment workflow
dependencies](https://deployment-workflow.bocoup.com/#dependencies) as well as
the example project's specific dependencies (node.js, npm) have been installed.

There are 2 ways to develop the example project.

Without vagrant, which is faster:

1. `npm install`
1. `npm run dev`
1. Check the main page: `open public/index.html`
1. Check the 404 page: `open public/404.html`
1. Edit `build/*` and `deploy/README.md` files locally, pages should auto-reload
1. Repeat steps 3-5

With vagrant, which more accurately reflects site behavior once deployed:

1. `vagrant up`
1. `npm install`
1. `npm run dev`
1. Check the main page: <http://deployment-workflow.loc/>
1. Check the 404 page: <http://deployment-workflow.loc/whoops>
1. Edit `build/*` and `deploy/README.md` files locally, pages should auto-reload
1. Repeat steps 4-6

When done, file a PR!
