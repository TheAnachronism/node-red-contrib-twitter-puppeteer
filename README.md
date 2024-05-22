# node-red-contrib-twitter-puppeteer

A collection of nodes using [puppeteer](https://pptr.dev/) and [browserless](https://github.com/browserless/browserless) to impersonate a logged-in twitter account and interact with Twitter / X.

## Prerequisites

- Make sure to have an instance of [browserless](https://github.com/browserless/browserless) running and reachable by node-red.  
You can run a container easily like this:  
```sh
docker run -p 3000:3000 ghcr.io/browserless/chromium
```

## Install

Install via npm inside the node-red user directory (*usually `~/.node-red`*):

```sh
npm install node-red-contrib-twitter-puppeteer
```

## Usage

Add a node to a flow and configure the `auth_token`, as well as the connection to the `browserless` instance. Then run a message with the text as payload into the node.

### Tweet

- Whatever message is set as `msg.payload` will be tweeted out.

### Direct Message

- `msg.payload` will be used as a message and user IDs can be supplied as an array in `msg.users`:
```json
[ "anachronisdev", "nodejs" ]
```  