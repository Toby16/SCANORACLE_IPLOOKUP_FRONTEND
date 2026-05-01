/**
 * Basic IPv4 / IPv6 / domain validation utilities.
 */

export const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/

export const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export function isValidIPv4(value) {
  return IPV4_REGEX.test(value)
}

export function isValidDomain(value) {
  return DOMAIN_REGEX.test(value)
}

export function isValidTarget(value) {
  const v = value.trim()
  return isValidIPv4(v) || isValidDomain(v)
}
