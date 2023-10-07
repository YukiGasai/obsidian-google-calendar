---
title: GoogleOAuthServer
---

This setting is only required when using the public Google Cloud Project.
This is indicated by switching the [[UseCustomClient]] setting to `false`.
This setting defies the sever to use for authentication with Google.
This server proxies the authentication request to Google and is required for the public client.
The server can be self hosted, the source code can be found [here](https://github.com/YukiGasai/ObsidianGoogleCalendarAuth).
