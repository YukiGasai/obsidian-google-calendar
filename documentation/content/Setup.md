---
title: Setup
---

The installation of this plugin is a little cumbersome.
But after the initial setup you should never have to touch it again.
The creation of a public OAUTH client to skip this setup is WIP.

## Install Plugin

- One click install from [community plugin store](obsidian://show-plugin?id=google-calendar)
- Go to settings and activate plugin

## Setup Google Calendar plugin

The required URLS for the google cloud project are:

- Authorized JavaScript origins:
  - `http://127.0.0.1:42813`
  - `https://google-auth-obsidian-redirect.vercel.app`
- Authorized redirect URIs:
  - `http://127.0.0.1:42813/callback`
  - `https://google-auth-obsidian-redirect.vercel.app/callback`

<object data="Install.pdf" type="application/pdf" width="700px" height="700px">
    <embed src="Install.pdf">
        <p>This browser does not support PDFs. Please download the PDF to view it: <a href="Install.pdf">Download PDF</a>.</p>
    </embed>
</object>

A video showing the creation of the google cloud project can be found [here](https://youtu.be/TMQ8HZjeauo)

- Go into the plugin settings
- Insert your client id and secret in the input fields
- Press Login and authenticate with google
