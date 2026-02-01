#!/bin/bash

# if [ ! -f "watcher/node_modules/axios" ] then
# 	cd watcher
# 	npm install axios
# 	cd ..
# fi

echo "Removing old extension..."
rm -R ~/.vscode/extensions/watcher
echo "Copying new extension..."
cp -R watcher ~/.vscode/extensions/watcher
echo "Launching dev window..."
code --extensionDevelopmentPath=~/.vscode/extensions/watcher