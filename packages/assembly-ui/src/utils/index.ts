export function isMacOS(): boolean {
  return navigator.userAgent.toLowerCase().indexOf('mac') >= 0;
}

export function isWindows(): boolean {
  return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
}
