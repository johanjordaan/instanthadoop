This is my solution to having a on demand hadoop cluster

### Dependencies
Install a local hadoop so that you can submit jobs etc
Mac
```
brew install hadoop
```

### install
```
npm install instanthadoop
```

### Setup

### Start the cluster
```
ih --region --instance_type -az --nodes 10 --disk 20 --source s3:///
```
This will start up a hadoop cluster
- in Ireland
- using t2 micros
- having 10 nodes (1 name and 9 data)
- having 20 gis storage each
- coping the the data to work on from the s3 bucket

### Submit work
```
hadoop ... ... ...
```

### Todo

### Some references
https://blog.insightdatascience.com/spinning-up-a-free-hadoop-cluster-step-by-step-c406d56bae42#.v7h1yiwkr
http://www.nixguys.com/blog/backup-hadoop-hdfs-amazon-s3-shell-script
https://github.com/harrisiirak/webhdfs
