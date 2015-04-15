# Modern Web Deployment Workflow

This collection of Ansible playbooks have been designed to simplify deployment
of a modern website or web app using Vagrant, Ubuntu, Nginx and HTTP/HTTPS. Many
tasks have been separated into separate roles, and as much configuration as
possible has been abstracted into external variables.

The main goals of this workflow are to allow you to:

* Easily provision (ie. initialize, configure) local development, staging and
  production web servers.
* Easily test your project on a local development server, allowing you to work
  offline.
* Easily test your project on a staging server, allowing you to perform QA and
  final testing before going "live" in production.
* Easily deploy (and re-deploy) your project to staging and production servers.

Because this workflow will be copied into projects and modified, here are links
to the official, original project home page, documentation, git repository and
wiki:

* [Canonical home page & documentation](https://deployment-workflow.bocoup.com/)
* [Canonical git repository](https://github.com/bocoup/deployment-workflow/)
* [Canonical wiki](https://github.com/bocoup/deployment-workflow/wiki)

Notes:

* This workflow has been thoroughly tested in [Ubuntu 14.04 LTS
  (trusty)](http://releases.ubuntu.com/14.04/). More specifically, with the
  [ubuntu/trusty64](https://vagrantcloud.com/ubuntu/boxes/trusty64) Vagrant
  image and with the AWS EC2 `Ubuntu Server 14.04 LTS` AMI, using the default
  `ubuntu` user. Minor adjustments might need to be made for other providers,
  while more substantial changes might need to be made for other Ubuntu versions
  or Linux distributions.
* This workflow won't teach you how to create an AWS instance. Fortunately,
  there are already excellent guides for [creating a key
  pair](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html),
  [setting up a security
  group](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html)
  and [launching an
  instance](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-instance_linux.html).
* Even though Node.js, Npm and Bower are used in these sample files, with minor
  edits this workflow can be made to work with basically any programming
  language, package manager, etc.
* While the decisions made in this project are the result of significant time
  and testing, this should be considered a starting point; you're encouraged to
  edit the included playbooks to meet your project's specific needs.

## Environments

There are currently two supported environments,
[development](#development-environment) and
[production](#production-environment), with the following notable differences:

### development environment

This environment is used for the local vagrant server
([localdev group](#group-variables)):

* When the server is provisioned, the Nginx-served public directory is symlinked
  to the local root directory of your repository.
* Checking out a commit or building locally (eg. via the command line) will be
  instantly reflected on the Nginx server. Automated deploy and build tasks are
  skipped, but building may be done locally when needed.
* The development environment should be similar to the production environment,
  but should prioritize a sane developer workflow over QA and final testing.

### production environment

This environment is used for staging and production servers
([appservers group](#group-variables)):

* When a commit is deployed, the Nginx-served public directory is automatically
  symlinked to a sha-named Git repository directory that has that specific
  commit (or ref, eg. master) checked out. This requires the commit-to-be-
  checked-out to be pushed to the configured Git repository before deployment.
* When a commit is deployed, building is automatically done after the Git
  repository is cloned, but before the website or web app is made "live." If a
  commit has already been deployed (eg. when reverting to a previous version),
  it won't be rebuilt by default.
* Staging and production servers should be provisioned as similarly as possible,
  to facilitate QA and final testing.

## Overview

Assuming you've already created (or are in the process of creating) a website or
web app, you will typically perform these steps when using this workflow.

1. Ensure the [workflow dependencies](#dependencies) have been installed on your
   development machine.
2. Add the [workflow files](#initial-setup) into your project.
3. Modify the [workflow configuration](#configuration) for your specific project
   needs.
4. Test your project on the [local Vagrant server](#developing) while authoring
   it. _(Optional, but recommended)_
5. [Deploy](#deploying) your project to a staging server for QA and final
   testing. _(Optional, but recommended)_
6. [Deploy](#deploying) your project to a production server.

Step 1 is usually only done once per development machine, steps 2-3 are usually
only done once per project, and steps 4-6 will be repeated throughout the life
of your project as you make and test changes and deploy new versions of your
website or web app.

## Dependencies

The following will need to be installed on your local development machine before
you can use this workflow. All versions should be the latest available, unless
otherwise noted.

* **[Ansible](http://docs.ansible.com/)**
  - Install `ansible` via apt (Ubuntu), yum (Fedora), [homebrew][homebrew] (OS
    X), etc. See the [Ansible installation
    instructions](http://docs.ansible.com/intro_installation.html) for
    detailed, platform-specific information.
* **[VirtualBox](https://www.virtualbox.org/)**
  - [Download](https://www.virtualbox.org/wiki/Downloads) (All platforms)
  - Install `virtualbox` via [homebrew cask][cask] (OS X)
* **[Vagrant](https://www.vagrantup.com/)**
  - [Download](http://docs.vagrantup.com/v2/installation/) (All platforms)
  - Install `vagrant` via [homebrew cask][cask] (OS X)
* **[vagrant-hostsupdater](https://github.com/cogitatio/vagrant-hostsupdater)**
  - Install with `vagrant plugin install vagrant-hostsupdater` (All platforms)

[homebrew]: http://brew.sh/
[cask]: http://caskroom.io/

Notes:

* If you only want to deploy to remote servers, you can just install Ansible and
  skip VirtualBox and Vagrant, which are used to create the local development
  server.
* Ansible doesn't really work in Windows. But it works great in OS X and Linux,
  so be sure to use one of those operating systems for development.

## Initial Setup

Copy this project's files so that the [deploy](.) directory is in the root
of your repository. Be sure to copy recursively and preserve file modes, eg.
executable, so that bash helper scripts continue to work. The
[Vagrantfile](#vagrantfile) should be placed in your repository root
directory, _not_ the deploy directory.

Also, be sure to add `.vagrant` to your project's `.gitignore` file so that
directory's contents, which are auto-generated by Vagrant, aren't committed with
your project's source.

## Configuration

Many of the following files will need to be edited for your project. Also, there
are more files to this project than are listed here; you're encouraged to read
the [Ansible documentation](http://docs.ansible.com/) and explore these files.

### Vagrantfile

* [../Vagrantfile](../Vagrantfile)

This file contains the project's Vagrant configuration, and should be placed in
the root directory of your repository. You should change the IP and specify an
appropriate hostname alias for the Vagrant server here.

### Global variables

* [ansible/group_vars/all.yml](ansible/group_vars/all.yml)

This file contains all of the settings that are common across all environments.
You should specify your project name, remote Git repository address, hostname,
and server [FQDN][FQDN] here, and you'll need to ensure the public path is
correct. The other settings usually won't need to change.

[FQDN]: http://en.wikipedia.org/wiki/Fully_qualified_domain_name

### Group variables

* [ansible/group_vars/localdev.yml](ansible/group_vars/localdev.yml)
  (development)
* [ansible/group_vars/appservers.yml](ansible/group_vars/appservers.yml)
  (production/staging)

These files contain any settings that differ per-group (ie. environment).
Settings defined here will override those defined in the [global
variables](#global-variables) file. You should specify whether or not you want
to use SSL (HTTPS) for each environment, and change SSL cert/key paths here (if
necessary).

Note: if you choose to enable SSL for development (localdev), self-signed SSL
cert/key files will be generated for you automatically if they don't already
exist. In this case, your website or web app will work, but you will have to
click past a SSL certificate warning before viewing it. If you enable SSL for
production (appservers), you will need to supply your own signed SSL cert/key
files and put them on the remote server via [AWS
CloudFormation](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/deploying.applications.html),
[cloud-init](http://cloudinit.readthedocs.org/), or you can [copy them
manually](https://github.com/bocoup/deployment-workflow/wiki/FAQ#how-do-i-manually-copy-ssl-certs-to-a-remote-server)
_before_ provisioning.

### Host variables

While none exist in this project, these files contain any settings that differ
per-host (ie. specific machine). Settings defined in host variables will override
those defined in the [global variables](#global-variables) file and [group
variables](#group-variables) files.

For more information about variables see the Ansible documentation on [variable
precedence](http://docs.ansible.com/playbooks_variables.html#variable-precedence-where-should-i-put-a-variable)
and [directory
layout](https://docs.ansible.com/playbooks_best_practices.html#directory-layout).

### Inventory

* [ansible/inventory/production](ansible/inventory/production)
* [ansible/inventory/staging](ansible/inventory/staging)

These files contain the addresses of any production and/or staging appservers
to deploy to. Usually, these addresses will be [FQDNs][FQDN], but they may also
be IPs.

Additionally, these files may contain settings that differ per-host. Like the
aforementioned [host variables](#host-variables), settings defined here will
override those defined in the [global variables](#global-variables) and [group
variables](#group-variables) files. For example, in the staging inventory, the
`app_fqdn` variable can be set to the staging server's FQDN, allowing Nginx to
respond to requests made to _its_ FQDN instead of the production server's FQDN.
_If you have a lot of host-specific variables, you should define them in a
separate [host variables](#host-variables) file._

### Base role variables

* [ansible/roles/base/vars/main.yml](ansible/roles/base/vars/main.yml)

This file contains Apt keys, Apt PPAs, Apt packages and global Npm modules to be
installed before your project is cloned or built. If you need custom packages or
modules to be installed, specify them here. If you don't use Npm, just remove it
along with the Npm-specific [base role tasks](#base-role-tasks)!

Note:

* Apt package versions may be specified like `- git=2.1.0`
* Npm module versions may be specified like `- {name: bower, version: 1.2.3}`

Useful ppas:

* Git latest - `ppa:git-core/ppa`
* Node.js 0.10.x - `deb https://deb.nodesource.com/node_0.10 trusty main`
* Node.js 0.12.x - `deb https://deb.nodesource.com/node_0.12 trusty main`
* Io.js 1.x - `deb https://deb.nodesource.com/iojs_1.x trusty main`

(Replace `trusty` with your Ubuntu version codename, if necessary)

### Nginx configuration

* [ansible/roles/nginx/vars/main.yml](ansible/roles/nginx/vars/main.yml)
* [ansible/roles/nginx/templates/app.conf](ansible/roles/nginx/templates/app.conf)
* [ansible/roles/nginx/templates/gzip_params](ansible/roles/nginx/templates/gzip_params)
* [ansible/roles/nginx/templates/ssl_params](ansible/roles/nginx/templates/ssl_params)

These files contain Nginx configuration. By default, Nginx is configured to
serve a website with a custom 404 page. However, if you want to redirect all
requests to index.html (eg. for a web app), you should modify the
[app.conf](ansible/roles/nginx/templates/app.conf) template per the inline
comments. For more involved customization, read the [Nginx
documentation](http://nginx.org/en/docs/).

If you want to make modifications that might differ per-environment, like
enabling SSL or changing the location of SSL cert/key files, you should do so
via [group variables](#group-variables).

### Deploy role build tasks

* [ansible/roles/deploy/tasks/build.yml](ansible/roles/deploy/tasks/build.yml)

This file contains all the build tasks that need to be run after your project is
cloned, eg. `npm install`, `bower install`, `npm run build`. You may or may not
need to modify this file, depending on your project's build process.
Additionally, if `build_info_path` is defined (see [global
variables](#global-variables)), a build info file will be automatically
generated at the end of this process.

General recommendations:

* For an Npm-based project, create a `build` [Npm
  script](https://docs.npmjs.com/misc/scripts) in your project's `package.json`
  that runs whichever framework-specific build command your project needs. That
  way, you might not have to modify this file.
* Run `bower install` as a separate task, and _not_ in an Npm install script.
  That way, it can be reasoned about separately from the `npm install` task. Or
  don't use Bower at all; many client-side packages are available in Npm.
* Don't be afraid to modify these tasks. Your project's build process might need
  to be vastly different than what's here, so adjust accordingly!

### Ansible configuration file

* [ansible/ansible.cfg](ansible/ansible.cfg)

This file contains settings that change how Ansible behaves.

Many `ansible-playbook` command line flags may be specified as options in this
file instead of being specified on the command line every time, eg. `--user` is
[remote_user](http://docs.ansible.com/intro_configuration.html#remote-user) and
`--ask-sudo-pass` is
[ask_sudo_pass](http://docs.ansible.com/intro_configuration.html#ask-sudo-pass).
See the [Deploying](#deploying) and [command line flags](#command-line-flags)
documentation as well as the [Ansible configuration file
documentation](http://docs.ansible.com/intro_configuration.html) for more
information.

Note: avoid adding settings into this file that might change per-developer or
per-run, eg. username, private key path, etc. Settings that change per-developer
or per-run should be specified as [command line flags](#command-line-flags).

### Other configuration

For most projects, the following files won't need to change.

#### Base role tasks

* [ansible/roles/base/tasks/main.yml](ansible/roles/base/tasks/main.yml)

If editing base role variables isn't sufficient, you can add or remove tasks
here.

#### Configure role tasks

* [ansible/roles/configure/tasks/main.yml](ansible/roles/configure/tasks/main.yml)

This file contains tasks for configuring the server after all the base
dependencies have been installed.

#### Nginx role tasks

* [ansible/roles/nginx/tasks/main.yml](ansible/roles/nginx/tasks/main.yml)
* [ansible/roles/nginx/tasks/ssl.yml](ansible/roles/nginx/tasks/ssl.yml)

These files contain tasks to generate Nginx config files (and hardened SSL
configuration, if SSL was specified), restarting Nginx on success or rolling
back changes if any part of the config is invalid.

Note: if SSL is enabled for production (appservers), the SSL cert files must
exist on the server _before_ provisioning, or this task will fail.

#### Deploy role other tasks

* [ansible/roles/deploy/tasks/main.yml](ansible/roles/deploy/tasks/main.yml)
* [ansible/roles/deploy/tasks/checkout.yml](ansible/roles/deploy/tasks/checkout.yml)

These tasks will clone the Git repository and check out the specified commit
unless it has already been cloned. The build may be forced to clone and build
regardless of prior status. When done, the specified commit will be symlinked to
make it go "live."

## Developing

Assuming everything has been configured correctly, you should be able to run
`vagrant up` to create a local, fully-provisioned Vagrant server that is
accessible in-browser via the hostname alias specified in the
[Vagrantfile](#vagrantfile). _If you're asked for your administrator password
during this process, it's so that the hostsupdater plugin can modify your
`/etc/hosts` file._

If you change the Ansible configuration, running `vagrant provision` will re-run
the Ansible playbooks. If you make drastic changes to the Ansible configuration
and need to recreate the Vagrant server, you can delete it with `vagrant
destroy`. _If you do this, be sure to let collaborators know too!_

See the Vagrant [Ansible
provisioner](http://docs.vagrantup.com/v2/provisioning/ansible.html)
documentation for more information.

## Deploying

Once you've [configured Ansible](#configuration) and committed your changes to
the Git repository configured in [global variables](#global-variables), you can
run the `ansible-playbook` command or one of the included [deploy helper
scripts](#deploy-helper-scripts) to execute the following playbooks on the
remote staging or production server:

* [ansible/provision.yml](ansible/provision.yml) - Perform `base`, `configure`
  and `nginx` roles. This playbook must be run when a server is first created
  and is typically only run once. It may be run again if you make server-level
  changes or need to update any installed Apt packages to their latest versions.
* [ansible/deploy.yml](ansible/deploy.yml) - Perform `deploy` role. This
  playbook must be run after provisioning, and is used to deploy and build the
  specified commit (see [extra vars](#extra-vars)) on the server.

It's recommended that you run one of the included [deploy helper
scripts](#deploy-helper-scripts) instead of running the `ansible-playbook`
command directly, but the following [command line flags](#command-line-flags)
and [extra vars](#extra-vars) apply to both.

#### Command line flags

Note that the following flags apply to both `ansible-playbook` and the included
[deploy helper scripts](#deploy-helper-scripts).

* **`--help`** - Display usage information and all available options; the list
  here contains only the most relevant subset of all options.
* **`-vvvv`** - Display verbose connection debugging information.
* **`--user`** - If a dedicated remote user account is used for deployment on
  the production server, you will need to specify `--user=REMOTE_USER` on the
  command line. If the remote user isn't specified, the current username will be
  used. Eg. the default AWS EC2 Ubuntu AMI user is `ubuntu` so you'd need
  specify `--user=ubuntu` on the command line. _This flag may be specified in
  the [ansible configuration file](#ansible-configuration-file) instead of being
  passed on the command line, which it is by default._
* **`--ask-sudo-pass`** - If the remote user account requires a password to be
  entered for `sudo`, you will need to specify `--ask-sudo-pass` on the command
  line. Eg. the default AWS EC2 Ubuntu AMI user does _not_ require a password
  for `sudo`, so you should omit this from the command line. _This flag may be
  specified in the [ansible configuration file](#ansible-configuration-file)
  instead of being passed on the command line._
* **`--private-key`** - If the remote user account requires a private key, you
  will either need to [add the private key to your SSH
  agent](https://github.com/bocoup/deployment-workflow/wiki/FAQ#how-do-i-add-a-private-key-to-my-ssh-agent)
  or specify `--private-key=/path/to/keyfile` on the command line. Eg. when you
  launch an AWS EC2 instance and [create a new key
  pair](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html),
  the keyfile is the `.pem` file that you download.

#### Extra vars

These variables are defined in [ansible/deploy.yml](ansible/deploy.yml) and may
be overridden on the command-line in the format `--extra-vars="foo=12 bar=34"`.

* `commit` - Defaults to `master`. Specify any ref (eg. branch, tag) or SHA to
  be deployed.
* `force` - Defaults to `false`. If the specified commit SHA has already been
  deployed, it won't be re-cloned or re-built unless this is `true`.

### Deploy helper scripts

While you may run the `ansible-playbook` command manually, a few bash helper
scripts named like `PLAYBOOK_NAME-INVENTORY_NAME.sh` have been created to
facilitate running `ansible-playbook` with the detected inventory and playbook
and passing optional extra vars:

* [provision-production.sh](provision-production.sh) - run
  [ansible/provision.yml](ansible/provision.yml) playbook on
  [production](#inventory) inventory.
* provision-staging.sh - run [ansible/provision.yml](ansible/provision.yml)
  playbook on [staging](#inventory) inventory.
* deploy-production.sh - run [ansible/deploy.yml](ansible/deploy.yml) playbook
  on [production](#inventory) inventory.
* deploy-staging.sh - run [ansible/deploy.yml](ansible/deploy.yml) playbook on
  [staging](#inventory) inventory.

#### Notes

* The only actual script is [provision-production.sh](provision-production.sh),
  the rest are just symlinks to that script.
* Unlike with `ansible-playbook`, don't specify the inventory or playbook to
  run; the bash script name determines which playbook to run on which inventory.
* Should you need to run a different playbook or choose a different inventory,
  just create another symlink. Also, you may delete any symlinked scripts you
  don't need.
* You may pass flags to these scripts as you would to `ansible-playbook`. Eg.
  `--help` for help, `-vvvv` for connection debugging, `--user=REMOTE_USER` to
  specify the remote user, `--ask-sudo-pass` to prompt for a remote account sudo
  password, etc.
* You may specify any number of [extra vars](#extra-vars) in the format `foo=12
  bar=34` instead of the more verbose default `--extra-vars="foo=12 bar=34"`.
* If prompted for a password, enter the remote account password.

#### Examples

* Assume these examples are run from the root directory of your project's Git
  repository.
* Don't type in the `$`, that's just there to simulate your shell prompt.

```bash
# Provision the production server using the "other" user. Note that while this
# installs Apt packages, configures Nginx, etc. the site won't be deployed yet.

$ ./deploy/provision-production.sh --user=other

# If the current commit at the HEAD of master was previously deployed, this
# won't rebuild it. However, it will still be symlinked and made live. If
# master has changed since it was last deployed, and that commit hasn't yet been
# deployed, it will be cloned and built before being symlinked and made live.

$ ./deploy/deploy-production.sh

# Like above, but instead of master, deploy the specified branch/tag/ref/sha.

$ ./deploy/deploy-production.sh commit=my-feature
$ ./deploy/deploy-production.sh commit=v1.0.0
$ ./deploy/deploy-production.sh commit=8f93601a6bc7efeb90b1961d7574b47f61018b6f

# Regardless of the prior deploy state of commit at the HEAD of the my-feature
# branch, re-clone and rebuild it before symlinking it and making it live.

$ ./deploy/deploy-production.sh commit=my-feature force=true
```
