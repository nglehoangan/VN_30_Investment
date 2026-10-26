# EOD core validation

PASS completeness for both selected 23/10 and latest intraday 26/10 captures. Each contains exactly one 5.3 board snapshot, 30 5.11 security-master requests and 30 5.13 two-bar daily requests. All 61 HTTP 200, all raw responses exist and match SHA-256. Exact ticker/security UUID request binding and API parameters are checked by existing pipeline; selected replay PASS. Request start/retrieval times and HTTP Date metadata remain retained.

CORE_CHECKS.json contains executable-check results and manifest/capture pins; CAPTURE_DETAILS.json contains parameters, timestamps, endpoints and raw hashes for every core request. No reduced --symbols coverage detected. The release SHA matches the actual pinned release. This proves coverage of the retained 30-security universe only, not official current membership.

The 32 extra REST requests and WSS are outside the EOD core. They do not substitute for a missing EOD response.
