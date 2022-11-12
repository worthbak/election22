const request = require("request");

let CO3 = {
	url: 'https://static01.nyt.com/elections-assets/2022/data/2022-11-08/results-colorado-us-house-district-3.json',
	lastUpdate: null,
	leader: null,
	diff: null
}

let NVS = {
	url: 'https://static01.nyt.com/elections-assets/2022/data/2022-11-08/results-nevada-us-senate.json',
	lastUpdate: null,
	leader: null,
	diff: null
}

function formatDate(date) {
	return date.toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

function fetchElectionData(options, onComplete) {
	request(options, function (error, response) {
		if (error) throw new Error(error);
		
		  const body = JSON.parse(response.body);
		  const races = body.races
		  const data = races[0]
		  const updated_at = new Date(data.updated_at)
		  const reports = data.reporting_units
		  const report = reports[0]
		  
		  const candidates = report.candidates
		  const first = candidates[0]
		  const second = candidates[1]
		  
		  let leader
		  let trailer
		  if (first.leader === true) {
			  leader = first
			  trailer = second
		  } else {
			  leader = second
			  trailer = first
		  }
		  
		  const voteDiff = leader.votes.total - trailer.votes.total
		  
		  onComplete({
			  lastUpdate: updated_at,
			  leader: leader.nyt_id,
			  diff: voteDiff
		  })
	})
}

function updateCO3(completion) {
	const options = {
		method: 'GET',
		url: CO3.url
	}
	
	fetchElectionData(options, (results) => {
		if (CO3.diff === results.diff || CO3.leader === results.leader) {
			completion(null)
			return
		} 
		
		CO3.lastUpdate = results.lastUpdate
		CO3.leader = results.leader
		CO3.diff = results.diff
		
		completion(CO3)
	})
}

function updateNVS(completion) {
	const options = {
		method: 'GET',
		url: NVS.url
	}
	
	fetchElectionData(options, (results) => {
		if (NVS.diff === results.diff || NVS.leader === results.leader) {
			completion(null)
			return
		} 
		
		NVS.lastUpdate = results.lastUpdate
		NVS.leader = results.leader
		NVS.diff = results.diff
		
		completion(NVS)
	})
}

function updateResults() {
	updateCO3((updatedCO) => {
		updateNVS((updatedNV) => {
			if (updatedCO === null && updatedNV === null) return
			const date = formatDate(new Date())
			
			console.log(`${date}: ${updatedCO.leader} is winning by ${updatedCO.diff} (updated at ${formatDate(updatedCO.lastUpdate)})`)
			console.log(`${date}: ${updatedNV.leader} is winning by ${updatedNV.diff} (updated at ${formatDate(updatedNV.lastUpdate)})`)
			console.log()
		})
	})
}

updateResults()
setInterval(function(){updateResults()}, 30000); 