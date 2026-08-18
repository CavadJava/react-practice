#!/usr/bin/env python3
"""Tesla SSO login, Step 1: request the login page for real and extract the
hidden form fields + session cookie you need to build Step 2's request body.

_csrf/_phase/_process/transaction_id/cancel are issued fresh by Tesla's server
on every call and are single-use/session-bound — unlike code_challenge/state,
there is no formula for them, they can only come from a real Step 1 response.
Run this, then copy its output straight into Step 2's request body + cookie header.
"""
import base64
import hashlib
import http.cookiejar
import secrets
import urllib.parse
import urllib.request
from html.parser import HTMLParser


class HiddenFieldExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields = {}

    def handle_starttag(self, tag, attrs):
        if tag == "input":
            d = dict(attrs)
            if d.get("type") == "hidden" and "name" in d:
                self.fields[d["name"]] = d.get("value", "")


def main():
    code_verifier = secrets.token_urlsafe(64)[:86]
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode("ascii")).digest()
    ).decode("ascii").rstrip("=")
    state = secrets.token_urlsafe(16)

    params = {
        "client_id": "ownerapi",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "redirect_uri": "https://auth.tesla.com/void/callback",
        "response_type": "code",
        "scope": "openid email offline_access",
        "state": state,
    }
    url = "https://auth.tesla.com/oauth2/v3/authorize?" + urllib.parse.urlencode(params)

    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    req = urllib.request.Request(url, headers={"User-Agent": "tesla-api-openapi-test/1.0"})

    with opener.open(req) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    parser = HiddenFieldExtractor()
    parser.feed(html)

    print("# --- save this, you need it for Step 3 (token exchange) ---")
    print("code_verifier:", code_verifier)
    print()
    print("# --- reuse these exact values in Step 2's query string ---")
    print("code_challenge:", code_challenge)
    print("state:", state)
    print()
    print("# --- put these in Step 2's request body, verbatim ---")
    for name, value in parser.fields.items():
        print(f"{name}: {value}")
    print()
    print("# --- send this back as the Cookie header on Step 2 ---")
    for c in cookie_jar:
        print(f"{c.name}={c.value}")

    if not parser.fields:
        print("\n(!) No hidden fields found — Tesla's SSO WAF may have served a JS")
        print("    challenge instead of the real form because of this script's")
        print("    User-Agent/TLS fingerprint. See README.md for the caveat.")


if __name__ == "__main__":
    main()
