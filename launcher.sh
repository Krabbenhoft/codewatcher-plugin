#!/bin/bash

# if [ ! -f "watcher/node_modules/axios" ] then
# 	cd watcher
# 	npm install axios
# 	cd ..
# fi

echo "Removing old extension..."
rm -R ~/.vscode-oss/extensions/watcher
echo "Copying new extension..."
cp -R watcher ~/.vscode-oss/extensions/watcher
echo "Launching dev window..."
codium --extensionDevelopmentPath=~/.vscode-oss/extensions/watcher
