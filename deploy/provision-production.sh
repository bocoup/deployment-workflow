#!/usr/bin/env bash

# The program this script wraps.
bin=ansible-playbook
# Get the name of this script file, without extension.
basename=$(basename "$0" .sh)
# Split on the first hyphen.
parts=(${basename/-/ })
# Everything before the first hyphen is the playbook filename.
playbook=${parts[0]}.yml
# Everything after the first hyphen is the inventory filename.
inventory=inventory/${parts[1]}

# cd to the directory of this bash script
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir/ansible"

# Log any errors.
errors=
if [[ ! "$(type -P $bin)" ]]; then
  echo "Error: $bin must be installed and in the PATH."
  errors=1
fi
if [[ ! -e "$playbook" ]]; then
  echo "Error: playbook file $playbook not found."
  errors=1
fi
if [[ ! -e "$inventory" ]]; then
  echo "Error: inventory file $inventory not found."
  errors=1
fi

# Fail if there were any errors.
[[ "$errors" ]] && exit 1

# Pass args starting with - (hypen) through to ansible-playbook as-is,
# otherwise precede them with --extra-vars.
args=()
for arg in "$@"; do
  [[ "$arg" =~ ^- ]] || args=("${args[@]}" "--extra-vars")
  args=("${args[@]}" "$arg")
done

# Build the command.
command=($bin -i "$inventory" "$playbook" "${args[@]}")

# Output some (helpful) text before running the command.
cat <<EOF
You may pass flags to this script as you would to $bin.
Eg. --help for help, -vvvv for connection debugging, --user=REMOTE_USER
to specify the remote user, --ask-sudo-pass to prompt for a remote account
sudo password, etc.

You may specify any number of extra vars in the format varname=value.
Eg: $(basename "$0") commit=master force=true

Running command: cd "$(pwd)" && ${command[@]}

If prompted for a password, enter the remote account password.

EOF

# Run the command!
"${command[@]}"
