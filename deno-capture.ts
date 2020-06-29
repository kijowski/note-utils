#!/usr/bin/env -S deno run -A
import { openRoamCaptureFrame, runRawCaptureProtocol } from "./engine.ts";

// This script assumes that there is an emacs server / instance running
const [kind, template, body, title, ref] = Deno.args;

// const runEmacsclient = async () => {
//   const cmd = `(+org-roam-capture/open-frame "${template}" "${ref}" "${title}" "${body}")`;
//   await Deno.run({
//     cmd: ["emacsclient", "-a", "", "-e", cmd],
//   });
// };

// const runRawOrgProtocol = async () => {
//   const cmd = `org-protocol://capture?template=${template}&url=${encodeURIComponent(
//     ref
//   )}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
//   await Deno.run({
//     cmd: ["emacsclient", "-a", "", cmd],
//   });
// };

switch (kind) {
  case "roam":
    Deno.run({
      cmd: openRoamCaptureFrame(template, ref, title, body),
    });
    break;
  case "silent":
    Deno.run({
      cmd: runRawCaptureProtocol(template, ref, title, body),
    });
    break;
}

// if (template.startsWith("r")) {
//   const command = `(+org-roam-capture/open-frame "${template}" "${ref}" "${title}" "${body}")`;
//   runEmacsclient(template, ref, title, body);
// }

// if (template.startsWith("s")) {
//   // const command = `(+org-roam-silent-capture "${template}" "${ref}" "${title}" "${body}")`;
//   // runEmacsclient(command);
//   runRawOrgProtocol(template, ref, title, body);
// }

// cleanup() {
//   emacsclient --eval '(let (kill-emacs-hook) (kill-emacs))'
// }

// # If emacs isn't running, we start a temporary daemon, solely for this window.
// if ! emacsclient --suppress-output --eval nil; then
//   emacs --daemon
//   trap cleanup EXIT INT TERM
//   daemon=1
// fi

// # org-capture key mapped to argument flags
// # keys=$(emacsclient -e "(+org-capture-available-keys)" | cut -d '"' -f2)
// while getopts "hk:" opt; do
//   key="\"$OPTARG\""
//   break
// done
// shift $((OPTIND-1))

// [ -t 0 ] && str="$*" || str=$(cat)

// if [ $daemon ]; then
//   emacsclient -a "" \
//     -c -F '((name . "doom-capture") (width . 70) (height . 25) (transient . t))' \
//     -e "(+org-capture/open-frame \"$str\" ${key:-nil})"
// else
//   # Non-daemon servers flicker a lot if frames are created from terminal, so we
//   # do it internally instead.
//   emacsclient -a "" \
//     -e "(+org-capture/open-frame \"$str\" ${key:-nil})"
// fi
