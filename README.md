# somedevfox/JFrog-Discord-Proxy
This script provides proxy for JFrog Artifactory Webhooks.

## How does this work?
You run the script, and it starts web-server which intercepts packets from JFrog Webhooks, parses it to Discord style and sends it thru webhook.
This script REQUIRES port forwarding, as it acts as web proxy.

## How do I run this script?
You need node.js, you can find it [here](https://nodejs.org/)
Then, to install libraries run 
```
npm install node-fetch
```

Great, now you can run script:
```
node proxy.js
```