#!/usr/bin/env bash

bin=ansible-playbook

function usage() {
cat <<EOF
Usage: $(basename "$0") playbook[.yml] inventory [--flag ...] [var=value ...]
EOF
}

function help() {
usage
cat <<EOF

   playbook  playbook file in deploy/ansible/, the .yml extension is optional.
  inventory  inventory host file in deploy/ansible/inventory/.
     --flag  any valid $bin flags, Eg. --help for help, -vvvv for
             connection debugging, --user=REMOTE_USER to specify the remote
             user, --ask-become-pass to prompt for a remote password, etc.
  var=value  any number of ansible extra vars in the format var=value.

Notes:

  * Flags and vars must be specified after both playbook and inventory.
  * All arguments specified after playbook and inventory not beginning with -
    or -- will be treated as extra vars.
  * If a non-vagrant inventory host is specified, unless the ubuntu user is
    specified, the --ask-become-pass flag will be automatically added to the
    command.

Examples:

  $(basename "$0") provision vagrant
  $(basename "$0") deploy production --user=ubuntu commit=master force=true
EOF
}

function error() {
  [[ "$1" ]] && echo "ERROR: $@"
  errors=1
}

function exit_on_errors() {
  [[ "$errors" ]] && usage && exit 1
}

# Was one of the specified args passed to this script?
script_args=("$@")
function has_arg() {
  local arg script_arg
  for script_arg in "${script_args[@]}"; do
    for arg in "$@"; do
      [[ "$script_arg" == "$arg" || "$script_arg" =~ ^$arg= ]] && return 0
    done
  done
  return 1
}

# Does the user need help?
[[ ! "$1" ]] && help && exit
if has_arg -h --help; then
  help
  echo -e "\n=== Output from $bin --help ===\n"
  $bin --help
  exit
fi

# Initial error checking.
errors=
[[ "$(type -P $bin)" ]] || error "$bin must be installed and in the PATH."
[[ "$2" ]] || error "both inventory and playbook must be specified."
exit_on_errors

# Parse playbook and inventory from command-line arguments.
playbook="${1#./}"; shift
inventory="${1#./}"; shift

# script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
script_dir="$(dirname "${BASH_SOURCE[0]}")"
script_dir="${script_dir#./}"
ansible_dir="$script_dir/ansible"
inventory_dir="$ansible_dir/inventory"

# Try to find the playbook file.
playbook_files=(
  "$playbook"                   # Path absolute or relative to the project root
  "$ansible_dir/$playbook"      # Playbook file name, no path
  "$ansible_dir/$playbook.yml"  # Playbook file name, no path, no extension
)
playbook_file=; for f in "${playbook_files[@]}"; do
  [[ -f "$f" ]] && playbook_file="$f" && break
done

# Try to find the inventory file.
inventory_files=(
  "$inventory"                  # Path absolute or relative to the project root
  "$inventory_dir/$inventory"   # Inventory file name, no path
)
inventory_file=; for f in "${inventory_files[@]}"; do
  [[ -f "$f" ]] && inventory_file="$f" && break
done

# Handle errors.
errors=
[[ -f "$playbook_file" ]] || error "playbook file $playbook not found."
[[ -f "$inventory_file" ]] || error "inventory file $inventory not found."
exit_on_errors

# Build the command.
command=(
  $bin
  "$playbook_file"
  "--inventory=$inventory_file"
)

# Ask for sudo password for non-vagrant inventory hosts, unless --user=ubuntu
# was specified (the default "ubuntu" user in AWS instances has passwordless
# sudo, but any users created via ansible should require passwords for sudo).
if [[ "${inventory##*/}" != "vagrant" ]]; then
  if ! has_arg -K --ask-sudo-pass --ask-become-pass && ! has_arg --user=ubuntu; then
    command=("${command[@]}" --ask-become-pass)
  fi
fi

# Pass args starting with - (hypen) through to ansible-playbook as-is,
# otherwise precede them with --extra-vars.
for arg in "$@"; do
  [[ "$arg" =~ ^- ]] || command=("${command[@]}" "--extra-vars")
  command=("${command[@]}" "$arg")
done

# Output some (helpful) text before running the command.
cat <<EOF
Running the following command:
${command[@]}

If prompted for a password, enter the remote account password.
EOF

# Run the command!
"${command[@]}"
