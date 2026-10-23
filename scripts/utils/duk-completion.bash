#!/bin/bash
# Bash completion for DUK commands
#
# Command signatures:
# - duk-install [--clean] [--setup]
# - duk-build [check]
# - duk-publish [--check] [--yes]
# - duk-run [dev|preview|test] [vite args...]

_duk_install() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    COMPREPLY=()
    COMPREPLY=($(compgen -W "--clean --setup" -- "$cur"))
}

_duk_build() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    COMPREPLY=()
    [ "$COMP_CWORD" -eq 1 ] && COMPREPLY=($(compgen -W "check" -- "$cur"))
}

_duk_run() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    COMPREPLY=()
    if [ "$COMP_CWORD" -eq 1 ]; then
        COMPREPLY=($(compgen -W "dev preview test" -- "$cur"))
    else
        COMPREPLY=($(compgen -W "--host --port --open" -- "$cur"))
    fi
}

_duk_publish() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    COMPREPLY=($(compgen -W "--check --yes" -- "$cur"))
}

complete -F _duk_install duk-install
complete -F _duk_build duk-build
complete -F _duk_run duk-run
complete -F _duk_publish duk-publish
