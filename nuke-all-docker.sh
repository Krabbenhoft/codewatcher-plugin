#!/bin/bash
docker rm -vf "$(docker ps -aq)"
docker volume rm "$(docker volume ls -q)"
