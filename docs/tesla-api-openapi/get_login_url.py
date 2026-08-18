#!/usr/bin/env python3
"""Print a ready-to-open Tesla SSO login URL + the matching code_verifier.

This is the RECOMMENDED way to get an authorization code — no network call,
so nothing here can be blocked by Tesla's WAF (unlike get_step1_fields.py,
which tries to script Step 1/2 directly and gets served an Akamai bot
challenge instead of the real login form).

Usage:
    python3 get_login_url.py
    -> open the printed URL in a REAL browser, log in with your Tesla account
    -> browser redirects to https://auth.tesla.com/void/callback?code=...&state=...
       (the page itself will fail to load — that's expected, the host doesn't
       resolve to anything on purpose)
    -> copy the `code` value straight out of the browser's address bar
    -> use it + the printed code_verifier in Step 3 (getOrRefreshToken,
       grant_type=authorization_code) to get your access_token/refresh_token
"""
import base64
import hashlib
import secrets
import urllib.parse


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

    print("# --- SAVE this, you need it for Step 3 (token exchange) ---")
    print("code_verifier:", code_verifier)
    print()
    print("# --- open this in a real browser and log in ---")
    print(url)
    print()
    print("# after login, the address bar will show something like:")
    print("# https://auth.tesla.com/void/callback?code=XXXX&state=" + state + "&issuer=...")
    print("# (the page fails to load — that's expected). Copy the `code` value from it.")


if __name__ == "__main__":
    main()
