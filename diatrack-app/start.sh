#!/bin/bash
cd client && npm install && npm run build && cd ../server && NODE_ENV=production node server.js
