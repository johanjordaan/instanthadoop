var retry = (f, maxRetries, retryInterval) => {
	if(maxRetries === undefined) {
		maxRetries = 3;
	}

	if(retryInterval === undefined) {
		retryInterval = 5000;
	}

	var _retry = (resolve, reject, retry) => {
		f().then((result)=>{
			resolve([result,retry])
		}).catch((err)=>{
			if(retry < maxRetries) {
				console.log(`Retry [${retry}]`)
				setTimeout(()=>{
					_retry(resolve, reject, retry +1)
				}, retryInterval)
			} else {
				reject(err)
			}
		})
	}

	return new Promise((resolve,reject)=>{
		_retry(resolve, reject, 0);
	})
}

module.exports = retry
