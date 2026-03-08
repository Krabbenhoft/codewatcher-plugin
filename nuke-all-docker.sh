#!/bin/bash
podman rm -vf "$(podman ps -aq)"
podman volume rm "$(podman volume ls -q)"
