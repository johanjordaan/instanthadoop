#!/bin/bash
mkdir -p ~/.ssh/
cp /instanthadoop/ssh/config ~/.ssh/config
cp /instanthadoop/ssh/hadoop_id ~/.ssh/hadoop_id
cp /instanthadoop/ssh/hadoop_id.pub ~/.ssh/hadoop_id.pub
cp ~/.ssh/hadoop_id.pub ~/.ssh/authorized_keys

chmod 400 ~/.ssh/config
chmod 400 ~/.ssh/hadoop_id
chmod 400 ~/.ssh/authorized_keys
chmod 400 ~/.ssh/hadoop_id.pub

chown -R root:root ~/.ssh
