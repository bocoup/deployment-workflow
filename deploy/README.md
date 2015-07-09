# Modern Web Deployment Workflow

This collection of Ansible playbooks have been designed to simplify deployment
of a modern website or web app using Vagrant, Ubuntu, nginx and HTTP/HTTPS. Many
tasks have been separated into separate roles, and as much configuration as
possible has been abstracted into external variables.

High-level benefits include:

* A new server can be up and running with fully deployed code in just a few
  minutes.
* An update to an existing project can be deployed and built in under a minute.
* A project can be rolled back to a previously-deployed version in a matter of
  seconds.
* Updates to server configuration can be made in a matter of seconds.
* Most server configuration and code updates can be made with zero server
  downtime.
* Code can be tested locally in Vagrant before being deployed to a production
  server.
* Code can be tested on a staging server for QA or final testing before being
  deployed to a production server.
* Server configuration and project deployment can be made to scale to any number
  of remote hosts.

More specific benefits include:

* Almost all server configuration and project deployment information is stored
  in the project, making it easy to destroy and re-create servers with
  confidence.
* All project maintainer user account information is stored in the project,
  making it easy to add or remove project maintainers.
* SSH agent forwarding allows the remote server to access private GitHub repos
  without requiring a private key to be copied to the server or for dedicated
  deployment keys to be configured.
* While working locally, the Vagrant box can easily be toggled between
  development and deployment modes at any time. This allows local changes to be
  previewed instantly (development) or a specific commit to be built as it would
  be in production (deployment).
* SSL certs can be auto-generated for testing HTTPS in development.
* Because the entire deployment workflow is comprised of Ansible playbooks and a
  Vagrantfile, it can be easily modified to meet any project's needs.

Here are links to the official, original project home page, documentation, Git
repository and wiki:

* [Canonical home page & documentation](https://deployment-workflow.bocoup.com/)
* [Canonical Git repository](https://github.com/bocoup/deployment-workflow/)
* [Canonical wiki](https://github.com/bocoup/deployment-workflow/wiki)

Notes:

* Even though Node.js, npm and Bower are used in this sample project, with minor
  edits this workflow can be made to work with basically any programming
  language, package manager, etc.
* This workflow won't teach you how to create an AWS instance. Fortunately,
  there are already excellent guides for [creating a key
  pair](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html),
  [setting up a security
  group](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html)
  and [launching an
  instance](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-instance_linux.html).
* This workflow has been thoroughly tested in [Ubuntu 14.04 LTS
  (trusty)](http://releases.ubuntu.com/14.04/). More specifically, with the
  [ubuntu/trusty64](https://vagrantcloud.com/ubuntu/boxes/trusty64) Vagrant
  image and with the AWS EC2 `Ubuntu Server 14.04 LTS` AMI. Minor adjustments
  might need to be made for other providers, while more substantial changes
  might need to be made for other Ubuntu versions or Linux distributions.
* While this workflow has been designed to meet the needs of a typical use
  case, it might not meet your project's needs exactly. Consider this to be
  a starting point; you're encouraged to edit the included playbooks and roles!

## Overview

Assuming you've already created (or are in the process of creating) a website or
web app, you will typically perform these steps when using this workflow.

1. Ensure the [workflow dependencies](#dependencies) have been installed on your
   development machine.
1. Add and commit the [workflow files](#initial-setup) into your project.
1. Modify the [Ansible variables, playbooks and roles](#ansible) to meet your
   specific project needs.
1. Test your project on the [local Vagrant box](#vagrant) while authoring
   it. _(Optional, but recommended)_
1. [Deploy](#deploying) your project to a staging server for QA and final
   testing. _(Optional, but recommended)_
1. [Deploy](#deploying) your project to a production server.

Step 1 is usually only done per development machine, steps 2-3 are usually only
done per project, and steps 4-6 will be repeated throughout the life of your
project as you make and test changes and deploy new versions of your website or
web app.

## Dependencies

The following will need to be installed on your local development machine before
you can use this workflow. All versions should be the latest available unless
otherwise specified.

* **[Ansible (version 1.9.2)](http://docs.ansible.com/)**
  - Install `ansible` via apt (Ubuntu), yum (Fedora), [homebrew][homebrew] (OS
    X), etc. See the [Ansible installation
    instructions](http://docs.ansible.com/intro_installation.html) for detailed,
    platform-specific information.
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

* Ansible doesn't really work in Windows. But it works great in OS X and Linux,
  so be sure to use one of those operating systems for development.

## Initial Setup

Copy this project's files so that the [deploy](.) directory is in the root of
your project Git repository. Be sure to copy recursively and preserve file
modes, eg. executable, so that the [bash helper script](#bash-helper-script)
continues to work. The [Vagrantfile](#configuring-vagrant) and
[ansible.cfg](#ansible-configuration) file should be placed in your project root
directory, _not_ the deploy directory.

Also, be sure to add `.vagrant` to your project's `.gitignore` file so that
directory's contents, which are auto-generated by Vagrant, aren't committed with
your project's source.

## Ansible

At the core of this workflow is Ansible, an IT automation tool. Ansible aims to
be simple to configure and easy to use, while being secure and reliable. In this
workflow, Ansible is used to configure systems and deploy software.

### Ansible Configuration

#### Ansible Variables

Much of this workflow's behavior can be configured via Ansible variables.

* [ansible/group_vars/all.yml](ansible/group_vars/all.yml) - variables global to all
  [playbooks](#ansible-playbooks) and [roles](#ansible-roles)

Host-specific settings may be defined in host-named files in the
[host_vars](ansible/host_vars) directory and will override global values.

* [ansible/host_vars/vagrant](ansible/host_vars/vagrant) - variables specific to the
  `vagrant` [inventory](#ansible-inventory) host

Variables may be overridden when a playbook is run via the `--extra-vars`
command line option. These variables are noted in the preceding files as `EXTRA
VARS`.

See the [Ansible variables](https://docs.ansible.com/playbooks_variables.html)
documentation for more information on variables, variable precedence, and how
`{{ }}` templates and filters work.

#### Ansible Configuration File

The [../ansible.cfg](../ansible.cfg) file at the root of the repo contains
settings that change how Ansible behaves. In this workflow, Ansible is
configured to use [ssh agent
forwarding](https://developer.github.com/guides/using-ssh-agent-forwarding/),
which allows the remote server to access private Git repositories without
requiring your private key to be copied to that server.

See [the Ansible configuration
file](http://docs.ansible.com/intro_configuration.html) documentation for more
information.

### Ansible Inventory

These files contain the addresses of any servers to which this project will be
deployed. Usually, these addresses will be [fully qualified domain
names](https://en.wikipedia.org/wiki/Fully_qualified_domain_name), but they may
also be IPs. Each inventory file may contain a list of multiple server FQDNs or
IPs, allowing a playbook to be deployed to multiple servers simultaneously, but
for this workflow, each inventory file will list a single server.

* [ansible/inventory/production](ansible/inventory/production)
* [ansible/inventory/staging](ansible/inventory/staging)
* [ansible/inventory/vagrant](ansible/inventory/vagrant)

Like with [host variables](#ansible-variables), settings defined here will
override those defined in the [global variables](#ansible-variables) and [group
variables](#ansible-variables) files. For example, in the staging inventory, the
`site_fqdn` variable can be set to the staging server's FQDN, allowing nginx to
respond to requests made to _its_ FQDN instead of the production server's FQDN.

Unless the variable is a server name-specific override like `site_fqdn` or
`ansible_ssh_host`, it should probably be defined in [host
variables](#ansible-variables).

### Ansible Playbooks

Ansible playbooks are human-readable documents that describe and configure the
tasks that Ansible will run on a remote server. They should be idempotent,
allowing them to be run multiple times with the same result each time.

The following playbooks are included in this workflow:

* [provision playbook](#provision-playbook)
* [configure playbook](#configure-playbook)
* [deploy playbook](#deploy-playbook)
* [vagrant-link playbook](#vagrant-link-playbook)
* [init playbook](#init-playbook)

For more detailed information on what each playbook actually does and how it
will need to be configured, be sure to check out the description for each
[role](#ansible-roles) that playbook includes.

#### provision playbook

Provision server. This playbook must be run when a server is first created
and is typically only run once. It may be run again if you make server-level
changes or need to update any installed apt modules to their latest versions.
If you were creating a new AMI or base box, you'd do so after running only
this playbook.

* Playbook: [ansible/provision.yml](ansible/provision.yml)
* Roles: [base](#base-role)

#### configure playbook

Configure server. This playbook is run after a server is provisioned but
before a project is deployed, to configure the system, add user accounts,
and setup long-running processes like nginx, postgres, etc.

* Playbook: [ansible/configure.yml](ansible/configure.yml)
* Roles: [configure](#configure-role), [users](#users-role), [nginx](#nginx-role)

#### deploy playbook

Clone, build, and deploy, restarting nginx if necessary. This playbook must
be run after `provision` and `configure`, and is used to deploy and build the
specified commit (overridable via extra vars) on the server. Running this
playbook in Vagrant will override the `vagrant-link` playbook, and vice-versa.

* Playbook: [ansible/deploy.yml](ansible/deploy.yml)
* Roles: [deploy](#deploy-role)

#### vagrant-link playbook

Instead of cloning the Git repo and building like the `deploy` playbook, this
playbook links your local working project directory into the Vagrant box so that
you can instantly preview your local changes on the server, for convenience
while developing. While in this mode, all building will have to be done
manually, at the command line of your development machine. Running this playbook
will override the `deploy` playbook, and vice-versa.

* Playbook: [ansible/vagrant-link.yml](ansible/vagrant-link.yml)

#### init playbook

This playbook saves the trouble of running the `provision`, `configure` and
`vagrant-link` playbooks individually, and is provided for convenience. After
`vagrant up`, this playbook will be run on the new Vagrant box.

* Playbook: [ansible/init.yml](ansible/init.yml)

### Ansible Roles

There are multiple ways to organize playbooks, and while it's possible to put
all your tasks into a single playbook, it's often beneficial to separate related
tasks into "roles" that can be included in one or more playbooks, for easy reuse
and organization.

The following roles are used by this workflow's playbooks:

* [base role](#base-role)
* [configure role](#configure-role)
* [nginx role](#nginx-role)
* [users role](#users-role)
* [deploy role](#deploy-role)

#### base role

Get the box up and running. These tasks run before the box is configured
or the project is cloned or built. All system dependencies should be
installed here.

Apt keys, apt ppas, apt packages and global npm modules can be configured in the
`PROVISIONING` section of the [global variables](#ansible-variables) file. If
you need custom packages or modules to be installed, specify them there.

Don't be afraid to modify these tasks. For example, if your project doesn't use
npm, just remove the npm tasks.

<!--role-files base-->

#### configure role

Configure the box. This happens after the base initialization, but before
the project is cloned or built.

<!--role-files configure-->

#### nginx role

Generate nginx config files (and ssl configuration, if ssl was specified),
rolling back changes if any part of the config is invalid.

The public site path, ssl and ssl cert/key file locations can be configured in
the `WEB SERVER` section of the [global variables](#ansible-variables) file. If
you want to override any settings for just Vagrant, you can do so in [host
variables](#ansible-variables).

By default, nginx is configured to serve a website with a custom 404 page.
However, if you want to redirect all requests to `index.html` (eg. for a web
app), you should modify the [site.conf](ansible/roles/nginx/templates/site.conf)
template per the inline comments. For more involved customization, read the
[nginx documentation](http://nginx.org/en/docs/).

If you enable SSL for `production` or `staging`, you will need to supply your
own signed SSL cert/key files and put them on the remote server via [AWS
CloudFormation](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/deploying.applications.html),
[cloud-init](http://cloudinit.readthedocs.org/), or you can [copy them
manually](https://github.com/bocoup/deployment-workflow/wiki/FAQ#how-do-i-manually-copy-ssl-certs-to-a-remote-server)
_before_ provisioning, or this role will fail.

If you choose to enable SSL for `vagrant`, self-signed SSL cert/key files will
be generated for you automatically if they don't already exist. In this case,
your website or web app will work, but you will have to click past a SSL
certificate warning before viewing it.

<!--role-files nginx-->

#### users role

In development ([localuser.yml](ansible/roles/users/tasks/localuser.yml)),
create an account for the currently logged-in user, and copy their public key to
the server. This makes it possible to run other playbooks without specifying a
user or private key on the command line.

In production ([users.yml](ansible/roles/users/tasks/users.yml)), ensure all
users have been added, along with any public keys. If any user's state is
`absent`, they will be removed. If any keys are removed, they will be deleted.
In a development environment, make sudo passwordless, for convenience.

User accounts, passwords and public keys can be configured in the `USERS`
section of the [global variables](#ansible-variables) file.

**_When creating a new project using this workflow, REPLACE THE DEFAULT USERS
WITH YOUR OWN USERS. If you leave the default users, we'll all have access to
your servers, which is something we really don't want._**

<!--role-files users-->

#### deploy role

Clone the repo and check out the specified commit unless it has already been
checked out. When done, symlink the specified commit to make it go live, and
remove old clones to free up disk space.

The Git repo URL, deployment paths, number of recent deployments to retain and
build info file path can be configured in the `DEPLOY` section of the
[global variables](#ansible-variables) file.

The following variables defined in the `DEPLOY EXTRA VARS` section of the same
file may be overridden on the `ansible-playbook` command line in the format
`--extra-vars="commit=mybranch force=true"`.

var      | default  | description
---------|----------|------------
`commit` | `master` | Specify any ref (eg. branch, tag, SHA) to be deployed. This ref must be pushed to the remote `git_repo` before it can be deployed.
`force`  | `false`  | Clone and build the specified commit SHA, regardless of prior build status.
`local`  | `false`  | Use the local project Git repo instead of the remote `git_repo`. This option only works with the `vagrant` inventory, and not with `staging` or `production`.

The [build.yml](ansible/roles/deploy/tasks/build.yml) file contains all the
build tasks that need to be run after your project is cloned, eg. `npm install`,
`bower install`, `npm run build`. Don't be afraid to modify these tasks. Your
project's build process might need to be different than what's here, so adjust
accordingly!

<!--role-files deploy-->

## Vagrant

Vagrant allows you to isolate project dependencies (like nginx or postgres) in a
stable, disposable, consistent work environment. In conjunction with Ansible and
VirtualBox, Vagrant ensures that anyone on your team has access to their own
private, pre-configured development server whenever they need it.

If you only want to deploy to remote production or staging servers, you can just
install Ansible and skip VirtualBox and Vagrant, which are only used to create
the local development server.

### Configuring Vagrant

The [../Vagrantfile](../Vagrantfile) file at the root of the repo contains the
project's Vagrant configuration. Be sure to specify an appropriate hostname
alias for the Vagrant box here.

### Using Vagrant

Once the [Vagrantfile](#configuring-vagrant) and [Ansible variables, playbooks
and roles](#ansible-configuration) have been customized to meet your project's
needs, you should be able to run `vagrant up` to create a local,
fully-provisioned Vagrant server that is accessible in-browser via the hostname
alias specified in the Vagrantfile. _If you're asked for your administrator
password during this process, it's so that the hostsupdater plugin can modify
your `/etc/hosts` file._

If you change the Ansible configuration, running `vagrant provision` will re-run
the Ansible playbooks. If you make drastic changes to the Ansible configuration
and need to recreate the Vagrant server (which is often the case), you can
delete it with `vagrant destroy`. _If you do this, be sure to let collaborators
know too!_

See the Vagrant [Ansible
provisioner](http://docs.vagrantup.com/v2/provisioning/ansible.html)
documentation for more information.

### Using SSH with Vagrant

Vagrant provides the `vagrant ssh` command which allows you to connect to the
Vagrant box via its built-in `vagrant` user. While this is convenient for some
basic development tasks, once provisioned, you should connect to the Vagrant box
using the user account created by the [users role](#users-role). This will
ensure that the [ansible-playbook](#deploying) command, which uses `ssh`
internally, will work, allowing you to deploy.

To connect to Vagrant in this way, use the `ssh` command along with the
hostname alias defined in the [Vagrantfile](#configuring-vagrant). Eg, for this
example project, the command would be `ssh deployment-workflow.loc`.

Also, adding a [section like
this](https://github.com/cowboy/dotfiles/blob/8e4fa2a/link/.ssh/config#L9-L14)
to your `~/.ssh/config` file will prevent SSH from storing Vagrant box keys in
`~/.ssh/known_hosts` and complaining about them not matching when a Vagrant
box is destroyed and recreated. _Do not do this for production servers. This is
only safe for private, local virtual machines!_

## Deploying

Once you've customized [Ansible variables, playbooks and
roles](#ansible-configuration) and committed your changes to the Git repository
configured in [global variables](#ansible-variables), you may run the
`ansible-playbook` command or the included [playbook helper
script](#playbook-helper-script) to run any [playbook](#ansible-playbooks) on
any [inventory](#ansible-inventory) host.


### Command Line Flags

Note that the following flags apply to both `ansible-playbook` and the included
[playbook helper script](#playbook-helper-script).

* **`--help`** - Display usage information and all available options; the list
  here contains only the most relevant subset of all options.
* **`--user`** - Connect to the server with the specified user. If a user isn't
  specified, the currently logged-in user's username will be used.
* **`--ask-become-pass`** - If the remote user account requires a password to be
  entered, you will need to specify this option.
* **`--private-key`** - If the remote user account requires a private key, you
  will need to specify this option.
* **`--extra-vars`** - Values that override those stored in the [ansible
  configuration](#ansible-variables) in the format
  `--extra-vars="commit=mybranch force=true"`.
* **`-vvvv`** - Display verbose connection debugging information.

#### Production and Staging Notes

Once the [users role](#users-role) has run successfully, assuming your user
account has been correctly added to it, you should be able to omit the `--user`
and `--private-key` command line flags. However, until the users role has run at
least once:

* the `--user` flag will need to be specified. For the default AWS EC2 Ubuntu
  AMI, use `--user=ubuntu`.
* the `--private-key` flag will need to be specified. For AWS, specify
  `--private-key=/path/to/keyfile.pem` where `keyfile.pem` is the file
  downloaded when [creating a new key
  pair](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
  in AWS. _Do not store this private key in your project Git repo!_

The default AWS `ubuntu` user doesn't require a password for `sudo`, but user
accounts added via the users role do, so be sure to specify the
`--ask-become-pass` flag when you omit the `--user` command line flag.

#### Vagrant Notes

Once the [users role](#users-role) has run successfully, assuming your user
account has been correctly added to it, you should be able to omit the `--user`
and `--private-key` command line flags. However, until the users role has run at
least once:

* specify `--user=vagrant`, which is the default user created for the Vagrant
  box.
* specify `--private-key=.vagrant/machines/vagrant/virtualbox/private_key`,
  which is where the private key file for user `vagrant` is generated during
  `vagrant up`.

Additionally, you should never need to use the `--ask-become-pass` flag in
Vagrant, once passwordless sudo has been enabled via the [configure
role](#configure-role). This is done for convenience.

### Playbook helper script

While you may run the `ansible-playbook` command manually, the
[run-playbook.sh](run-playbook.sh) bash script has been provided to facilitate
running `ansible-playbook`.

```
Usage: run-playbook.sh playbook[.yml] inventory [--flag ...] [var=value ...]

   playbook  playbook file in deploy/ansible/, the .yml extension is optional.
  inventory  inventory host file in deploy/ansible/inventory/.
     --flag  any valid ansible-playbook flags, Eg. --help for help, -vvvv for
             connection debugging, --user=REMOTE_USER to specify the remote
             user, --ask-become-pass to prompt for a remote password, etc.
  var=value  any number of ansible extra vars in the format var=value.
```

#### Notes

* Flags and vars must be specified after both `playbook` and `inventory`.
* All arguments specified after `playbook` and `inventory` not beginning with
  `-` or `--` will be treated as extra vars.
* If a non-`vagrant` inventory host is specified, unless the `ubuntu` user is
  specified, the `--ask-become-pass` flag will be automatically added to the
  command.
* You may pass flags to this scripts as you would to `ansible-playbook`. Eg.
  `--help` for help, `-vvvv` for connection debugging, `--user=REMOTE_USER` to
  specify the remote user, `--ask-become-pass` to prompt for a remote account
  password, etc.
* You may specify any number of extra variables at the end of the command in the
  format `foo=12 bar=34` instead of the more verbose default
  `--extra-vars="foo=12 bar=34"`.

#### Examples

The following command to run the `provision` playbook on the
`production` inventory host with the `--user` and `--private-key` command line
flags:

* `ansible-playbook deploy/ansible/provision.yml
  --inventory=deploy/ansible/inventory/production --user=ubuntu
  --private-key=~/keyfile.pem`

can be run like:

* `./deploy/run-playbook.sh provision production --user=ubuntu
  --private-key=~/keyfile.pem`

And the following command to run the `deploy` playbook on the `vagrant`
inventory host with the `commit` and `local` extra variables:

* `ansible-playbook deploy/ansible/deploy.yml
  --inventory=deploy/ansible/inventory/vagrant --extra-vars="commit=testing
  local=true"`

can be run like:

* `./deploy/run-playbook.sh deploy vagrant commit=testing local=true`

#### More Examples

* Assume these examples are run from the root directory of your project's Git
  repository.
* Don't type in the `$`, that's just there to simulate your shell prompt.

```bash
# Provision the production server using the ubuntu user and the ~/keyfile.pem
# private key. Note that while this installs apt packages, it doesn't
# configure the server or deploy the site.

$ ./deploy/run-playbook.sh provision production --user=ubuntu --private-key=~/keyfile.pem
```

```bash
# Run just the tasks from the nginx role from the configure playbook on the
# production server. Using tags can save time when only tasks from a certain
# role need to be re-run.

$ ./deploy/run-playbook.sh configure production --tags=nginx
```

```bash
# If the current commit at the HEAD of master was previously deployed, this
# won't rebuild it. However, it will still be symlinked and made live, in case
# a different commit was previously made live. If master has changed since it
# was last deployed, and that commit hasn't yet been deployed, it will be
# cloned and built before being symlinked and made live.

$ ./deploy/run-playbook.sh deploy production
```

```bash
# Like above, but instead of the HEAD of master, deploy the specified
# branch/tag/sha.

$ ./deploy/run-playbook.sh deploy production commit=my-feature
$ ./deploy/run-playbook.sh deploy production commit=v1.0.0
$ ./deploy/run-playbook.sh deploy production commit=8f93601a6bc7efeb90b1961d7574b47f61018b6f
```

```bash
# Regardless of the prior deploy state of commit at the HEAD of the my-feature
# branch, re-clone and rebuild it before symlinking it and making it live.

$ ./deploy/run-playbook.sh deploy production commit=my-feature force=true
```

```bash
# Deploy the specified branch to the Vagrant box from the local project Git
# repo instead of the remote Git URL. This way, the specified commit can be
# tested before being pushed to the remote Git repository.

$ ./deploy/run-playbook.sh deploy vagrant commit=my-feature local=true
```

```bash
# Link the local project directory into the Vagrant box, allowing local changes
# to be previewed there immediately. This is run automatically at the end of
# "vagrant up".

$ ./deploy/run-playbook.sh vagrant-link vagrant
```
