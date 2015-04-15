# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = '2'

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = 'ubuntu/trusty64'

  # This directory should be the same as the site_path setting in
  # deploy/ansible/group_vars/all.yml
  config.vm.synced_folder '.', '/mnt/site'

  # Ideally, this IP will be unique, so entry added to /etc/hosts won't
  # conflict with that of another project.
  config.vm.network :private_network, ip: '192.168.33.99'

  # Automatically add an entry to /etc/hosts for this vagrant box. This
  # requires sudo. This should match the app_fqdn setting specified in the
  # ansible "localdev" config.
  config.hostsupdater.aliases = ['deployment-workflow.loc']

  # A specific name looks much better than "default" in ansible output.
  config.vm.define 'vagrant'

  # Configure the ansible provisioner.
  config.vm.provision 'ansible' do |ansible|
    # Add the vagrant box (the config.vm.define value) to the "localdev"
    # group so its vars are used when provisioning.
    ansible.groups = {'localdev' => ['vagrant']}
    # Do ansible stuff!
    ansible.playbook = 'deploy/ansible/provision.yml'
  end
end
