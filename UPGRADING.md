# Upgrading
> a guide for moving between ansible versions

### 1.9.x -> 2.0
  * replace all instances of `sudo: yes/no` with `become: yes/no` ([commit](https://github.com/bocoup/deployment-workflow/commit/17e248b70f90fd022f42ea1c92d15d3a4b37c9af)).
  * lines with escaped strings (e.g. `\t`) must be wrapped in double quotes ([commit](tbd)).
  * use blocks for multi-task when clauses ([commit](tbd)).
  * don't use '+' to combine lists, use `with_flattened` or `union` filter ([commit](https://github.com/bocoup/deployment-workflow/commit/b6019edad7ccaaf428b111548f31f64be9c7bc6d)) ([reference](https://github.com/ansible/ansible/issues/14118))
  * don't use `include` in conjunction with handlers (see dynamic includes problem in this [blog post](http://www.ansible.com/blog/ansible-2.0-launch))
