var _ = require('underscore');
var SshClient = require('ssh2').Client;
var fs = require('fs');

var AWS = require('aws-sdk');

AWS.config.region = 'eu-west-1';

var ec2 = new AWS.EC2();


var UserData = fs.readFileSync('./cloud-config.template','utf8');
var publicKey = fs.readFileSync('./keys/hadoop_id.pub');
UserData = UserData.replace("{hadoop_id}",publicKey);

var params = {
	ImageId: 'ami-03cea870',
	InstanceType: 't2.micro',
	MinCount: 1, MaxCount: 1,
	UserData: new Buffer(UserData).toString('base64')
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
						tryAtMost( ()=> {
							return doStuff(instance.PublicIpAddress)
						},10).then((resp)=>{
							console.log(resp);
						}).catch((err)=>{
							console.log(err);
						});
					})
				}
			});
		}
	});

});

// f needs to return a promise
var tryAtMost = (f, maxRetries) => {
	return f().then(()=>{
		Promise.resolve(result);
	}).catch((err)=>{
		if (maxRetries > 0) {
			console.log("Retry ",maxRetries)
			// Try again if we haven't reached maxRetries yet
			setTimeout(function() {
				tryAtMost(f, maxRetries - 1);
			}, 10000);
		} else {
			Promise.reject(err);
		}
	});
}

var doStuff = (ip) => {
	return new Promise((resolve, reject)=>{
		console.log("----->",ip);
		var conn = new SshClient();
		var retVal = "";
		conn.on('ready', function() {
			console.log('Client :: ready');
			conn.exec('uptime', function(err, stream) {
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
			privateKey: fs.readFileSync('./keys/hadoop_id')
		});
	});
}



//ssh -oStrictHostKeyChecking=no
