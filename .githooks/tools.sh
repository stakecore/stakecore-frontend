#!/usr/bin/env bash
# Pinned, checksum-verified binaries for the pre-push hook.
#
#   .githooks/tools.sh install       install every tool for this machine
#   .githooks/tools.sh path <tool>   print one tool's path, installing it first
#
# Installs land in ~/.cache/stakecore-hooks/<tool>-<version>/, outside the
# checkout: every worktree shares one copy, and nothing here can be linted,
# bundled or committed by accident. The version is part of the path, so a bump
# installs beside the old binary on the next push instead of waiting for
# someone to re-run this by hand.
#
# To bump a tool, change its version, both URLs and both sha256 values in one
# go. Take each sha256 from the release asset's digest on GitHub or from the
# project's own checksums file — a hash of your own download only proves that
# you downloaded something.
set -euo pipefail

# tool       version  arch     sha256 of the release archive                                     url
pins='
shellcheck   0.11.0   x86_64   b7af85e41cc99489dcc21d66c6d5f3685138f06d34651e6d34b42ec6d54fe6f6  https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.gz
shellcheck   0.11.0   aarch64  68a8133197a50beb8803f8d42f9908d1af1c5540d4bb05fdfca8c1fa47decefc  https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.aarch64.tar.gz
gitleaks     8.30.1   x86_64   551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
gitleaks     8.30.1   aarch64  e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080  https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_arm64.tar.gz
actionlint   1.7.12   x86_64   8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz
actionlint   1.7.12   aarch64  325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6  https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_arm64.tar.gz
zizmor       1.30.1   x86_64   e65324f4430c2717591937edcec90ccbefaf14c174f8ec9415e03ca875b46e1a  https://github.com/zizmorcore/zizmor/releases/download/v1.30.1/zizmor-x86_64-unknown-linux-gnu.tar.gz
zizmor       1.30.1   aarch64  7ff1dce33bdd18fd2a4affe63bdd47efcccca97b2cec1c1863ec26e9e2647540  https://github.com/zizmorcore/zizmor/releases/download/v1.30.1/zizmor-aarch64-unknown-linux-gnu.tar.gz
'

cache=${XDG_CACHE_HOME:-$HOME/.cache}/stakecore-hooks
tmp=
trap 'if [[ -n $tmp ]]; then rm -rf "$tmp"; fi' EXIT

die() {
    printf 'tools.sh: %s\n' "$*" >&2
    exit 1
}

host_arch() {
    if [[ $(uname -s) != Linux ]]; then
        die "binaries are pinned for Linux only, and this is $(uname -s) — push from the devcontainer"
    fi
    case $(uname -m) in
        x86_64 | amd64) echo x86_64 ;;
        aarch64 | arm64) echo aarch64 ;;
        *) die "no binaries are pinned for $(uname -m)" ;;
    esac
}

# Print the path of tool $1, downloading and verifying it first if it is not
# installed yet. The binary is renamed into place only after the archive has
# passed its checksum, so an interrupted install never leaves behind a file
# the hook would go on to run.
tool_path() {
    local want=$1 arch tool version pin_arch sha url dest bin
    arch=$(host_arch)
    while read -r tool version pin_arch sha url; do
        if [[ $tool != "$want" || $pin_arch != "$arch" ]]; then
            continue
        fi
        dest=$cache/$tool-$version/$tool
        if [[ ! -x $dest ]]; then
            printf 'tools.sh: installing %s %s\n' "$tool" "$version" >&2
            tmp=$(mktemp -d)
            curl --fail --silent --show-error --location --retry 2 \
                --proto '=https' --proto-redir '=https' --tlsv1.2 \
                --output "$tmp/archive.tar.gz" "$url"
            if ! printf '%s  %s\n' "$sha" "$tmp/archive.tar.gz" | sha256sum --check --status; then
                die "checksum mismatch for $url — not installing it"
            fi
            tar -xzf "$tmp/archive.tar.gz" -C "$tmp"
            bin=$(find "$tmp" -type f -name "$tool" -print -quit)
            if [[ -z $bin ]]; then
                die "no $tool binary inside $url"
            fi
            mkdir -p "${dest%/*}"
            install -m 0755 "$bin" "$dest.partial.$$"
            mv -f "$dest.partial.$$" "$dest"
            rm -rf "$tmp"
            tmp=
        fi
        printf '%s\n' "$dest"
        return
    done <<<"$pins"
    die "no pin for $want on $arch"
}

case ${1:-} in
    install)
        arch=$(host_arch)
        while read -r tool _ pin_arch _; do
            if [[ -n $tool && $pin_arch == "$arch" ]]; then
                tool_path "$tool" >/dev/null
            fi
        done <<<"$pins"
        ;;
    path)
        if [[ $# -ne 2 ]]; then
            die "usage: tools.sh path <tool>"
        fi
        tool_path "$2"
        ;;
    *)
        die "usage: tools.sh install | tools.sh path <tool>"
        ;;
esac
