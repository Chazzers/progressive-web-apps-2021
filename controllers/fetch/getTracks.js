const getData = require('./getData.js')
const recursiveFetch = require('./recursiveFetch.js')


// create a url from strings
function createUrl({ baseUrl, query, value }) {
	const url = `${baseUrl}${query ? `?${query}=` : ''}${value ? value : ''}`
	return url
}


// create fetch promises
function createPromises(array, promise, accessToken, { baseUrl, query, promiseArray = [] }) {
	array.forEach(item => promiseArray.push(promise(createUrl({
		baseUrl: baseUrl,
		query: query,
		value: item,
	}), accessToken)))
	return promiseArray
}

// get tracks
async function getTracks(url, accessToken) {
	const getTrackData = await getData(url, accessToken)
		.then((data, containerArray = [data.items]) =>  {
			// if data.next exists which is a url for the next 100 items, add it to the container array
			return recursiveFetch({ 
				url: data.next,
				array: containerArray,
				accessToken: accessToken
			})
		})
		.then(trackData => {
			// create array of id's
			return {
				audioFeaturesData: trackData.map(array => array.map(item => item.track.id)),
				trackData: trackData
			}
		})
		.then(({ trackData, audioFeaturesData }) => {
			// create one big string of all the id's of the tricks
			return {
				audioFeaturesData: audioFeaturesData.map(item => item.join()),
				trackData: trackData
			}
		}).then(async({ trackData, audioFeaturesData }) => {
			return {
				// make fetch calls out of the url ids of the tracks
				audioFeaturesData: await Promise.all(createPromises(audioFeaturesData, getData, accessToken, {
					baseUrl: 'https://api.spotify.com/v1/audio-features',
					query: 'ids',
				})).then(res => res),
				trackData: trackData
			}
		})
	return getTrackData
}

module.exports = getTracks
