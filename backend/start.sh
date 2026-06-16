#!/bin/sh
set -eu

if [ "$#" -eq 0 ]; then
  set -- serve
fi

if [ -x "./CodeMaster" ]; then
  exec ./CodeMaster "$@"
fi

exec go run ./cmd/CodeMaster "$@"
