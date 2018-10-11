const expect = require('chai').expect;
const fetch = require('node-fetch');
const queryString = require('query-string');
const path = require('path');

// Current directory
const cwd = process.cwd();
// Our screen play
const script = require(path.join(cwd, 'http.script.json'));

function reportShot(reports, result) {
    reports.push({
        success: true,
        status: result.status
    });

    return result;
}

function reportShotError(reports, err) {
    reports.push({
        error: true,
        status: err.status
    });

    throw err;
}

function sleep(time) {
    return new Promise((resolve, reject) => {
        try {
            setInterval(resolve, time);
        } catch (e) { reject(e); }
    });
}

function action(name, url, method, request, amount, interval) {
    const options = { ...request, method };
    const reports = [];

    if (interval) {
        // Chained promises
        let promise = shot(url, options, reports);

        for (let i = 0; i < amount - 1; i++) {
            promise = promise.then(() => sleep(interval)).then(() => shot(url, options, reports));
        }

        return promise.then(() => reports);
    } else {
        // Parallel promises
        const promises = [];

        for (let i = 0; i < amount; i++) {
            promises.push(shot(url, options, reports));
        }

        return Promise.all(promises).then(() => reports);
    }
}

function shot(url, options, reports = []) {
    const { params, query } = options;

    url = insertParams(url, params);
    url = insertQuery(url, query);

    return fetch(url, options).then(reportShot.bind(null, reports)).catch(reportShotError.bind(null, reports));
}

function insertQuery(url, query) {
    return `${url}?${queryString.stringify(query)}`;
}

function insertParams(url, params) {
    Object.keys(params).forEach((key) => {
        url = replaceAll(url, `:${key}`, params[key]);
    });

    return url;
}

function insertParams(url, params) {
    Object.keys(params).forEach((key) => {
        url = replaceAll(url, `:${key}`, params[key]);
    });

    return url;
}

function replaceAll(input, oldValue, newValue) {
    return input.replace(new RegExp(oldValue, 'g'), newValue);
}

script.forEach((act) => {
    console.log('Starting to process our script...');
    // Each external array item
    const { url, method } = act;
    let { scenes } = act;

    if (!scenes) {
        //There is only one scene in the act
        scenes = [
            { name: act.name, headers: act.headers, params: act.params, query: act.query, body: act.body, amount: act.amount, interval: act.interval }
        ];
    }

    // For each scene
    const acts = scenes.map((scene, i) => {
        const name = scene.name || i;
        const request = { headers: scene.headers, params: scene.params, query: scene.query, body: scene.body };
        return action(name, url, method, request, scene.amount, scene.interval);
    });

    Promise.all(acts)
        .then((results) => {
            console.log('RESULTS: ', results);
        });
});