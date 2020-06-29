export const openRoamCaptureFrame = (
  template: string,
  ref: string,
  title: string,
  body: string
) => {
  const cmd = `(+org-roam-capture/open-frame "${template}" "${ref}" "${title}" "${body}")`;
  return ["emacsclient", "-a", "", "-e", cmd];
};

export const runRawRoamCaptureProtocol = (
  template: string,
  ref: string,
  title: string,
  body: string
) => {
  const cmd = `org-protocol://roam-ref?template=${template}&ref=${encodeURIComponent(
    ref
  )}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  return ["emacsclient", "-a", "", "-e", cmd];
};

export const runRawCaptureProtocol = (
  template: string,
  url: string,
  title: string,
  body: string
) => {
  const cmd = `org-protocol://capture?template=${template}&url=${encodeURIComponent(
    url
  )}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  return ["emacsclient", "-a", "", cmd];
};
