#!/bin/bash
docker build -f Dockerfile -t johanjordaan/instanthadoop .

docker push johanjordaan/instanthadoop
