var _ = require('lodash');
var SshClient = require('ssh2').Client;
var fs = require('fs');
var AWS = require('aws-sdk');
var rp = require('request-promise');


var retry = require('./retry');

AWS.config.region = 'eu-west-1';
var ec2 = new AWS.EC2();

var userData = fs.readFileSync('./cloud-config.template','utf8');

var sshConfig = fs.readFileSync('./ssh/config','utf8');
var sshHadoopId = fs.readFileSync('./ssh/hadoop_id','utf8');
var sshHadoopIdPub = fs.readFileSync('./ssh/hadoop_id.pub','utf8');

var yamlReplace = (source,dict) => {
	var retVal = source;

	var shiftValue = (value,count) => {
		var lines  = value.split("\n");
		var retVal = "";
		var indent = _.repeat(" ",count);

		_.each(lines,(line)=>{
			retVal = retVal + `${indent}${line}\n`
		});
		return retVal
	}

	var replaceWithIndent = (key, value) => {
		key = key.replace("\{","\\{").replace("\}","\\}").replace("\.","\\.")
		var keyRe = new RegExp(`([ \t]*)${key}`);
		var match = retVal.match(keyRe);
		while(match != null) {
			var [full,spaces] = match
			retVal = retVal.replace(full,shiftValue(value,spaces.length))
			match = retVal.match(keyRe);
		}
	}


	_.each(_.toPairs(dict),([key,value])=>{
		replaceWithIndent(key, value);
	});

	return retVal;
}

var clusterSize = 1;
var etcdLookup;
rp(`https://discovery.etcd.io/new?size=${clusterSize}`).then( (htmlString) => {
	etcdLookup = htmlString;
	startCluster();
}).catch((err) => {
	console.log(err);
});


var startCluster = () =>{
	userData = userData.replace("{etcd_lookup}",etcdLookup);
	userData = yamlReplace(userData, {
		"{ssh_config}":sshConfig,
		"{ssh_hadoop_id.pub}":sshHadoopIdPub,
		"{ssh_hadoop_id}":sshHadoopId,
	})

	fs.writeFileSync("userdata",userData,"utf8");

	var params = {
		ImageId: 'ami-03cea870',
		InstanceType: 't2.micro',
		MinCount: 1, MaxCount: 1,
		UserData: new Buffer(userData).toString('base64')
	};

	ec2.runInstances(params, (err, data) => {
		if (err) { console.log("Could not create instance", err); return; }

		var instanceId = data.Instances[0].InstanceId;
		console.log("Created instance", instanceId);
		console.log(params);

		params = {Resources: [instanceId], Tags: [
			{Key: 'Name', Value: 'instanceName'}
		]};
		ec2.createTags(params, (err) => {
			console.log("Tagging instance", err ? "failure" : "success");
		});

		console.log("Waiting for instances to be running");
		ec2.waitFor('instanceRunning', {InstanceIds:[instanceId]}, (err, data) => {
		  if (err) console.log(err, err.stack); // an error occurred
		  else {
			  ec2.describeInstances({InstanceIds:[instanceId]}, (err, data) => {
			  	  if (err) console.log(err, err.stack); // an error occurred
			  	  else {
						//console.log(data);
						_.each(data.Reservations[0].Instances,(instance) => {
							//console.log(instance);
			 				console.log(instance.PublicIpAddress);
							retry( ()=> {
								return doStuff('uptime',instance.PublicIpAddress)
							})/*.then((resp)=>{
								console.log(resp);
								return retry(()=>{
									return doStuff('docker pull johanjordaan/instanthadoop; docker run -v /home/core/ssh:/instanthadoop/ssh -d johanjordaan/instanthadoop;',instance.PublicIpAddress)
								},10,5000);
							})*/.catch((err)=>{
								console.log(err);
							});
						})
					}
				});
			}
		});

	});
}

var doStuff = (command,ip) => {
	return new Promise((resolve, reject)=>{
		console.log("----->",ip,command);
		var conn = new SshClient();
		var retVal = "";
		conn.on('ready', function() {
			console.log('Client :: ready');
			conn.exec(command, function(err, stream) {
				if (err) throw err;
				stream.on('close', function(code, signal) {
				console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
				conn.end();
				resolve(retVal);
			}).on('data', function(data) {
				console.log('STDOUT: ' + data);
				retVal = retVal + data;
			}).stderr.on('data', function(data) {
				console.log('STDERR: ' + data);
				reject(data);
			});
			});
		}).on('error',(err)=>{
			console.log("Some error ....",err)
			reject(err);
		}).connect({
			host: ip,
			port: 22,
			username: 'core',
			privateKey: fs.readFileSync('./ssh/hadoop_id')
		});
	});
}



//ssh -oStrictHostKeyChecking=no
