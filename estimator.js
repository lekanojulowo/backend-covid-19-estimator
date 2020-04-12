const fs = require("fs");

// Estimator
const covid19ImpactEstimator = (data) => {
	// Destructuring the given data
	const {
		region: { avgDailyIncomeInUSD, avgDailyIncomePopulation },
		periodType,
		reportedCases,
		totalHospitalBeds,
	} = data;
	let { timeToElapse } = data;

	// Custom Functions and Variables

	// normalize days; check for weeks and months if used
	if (periodType === "months") timeToElapse = Math.trunc(timeToElapse * 30);
	else if (periodType === "weeks") timeToElapse = Math.trunc(timeToElapse * 7);
	else timeToElapse = Math.trunc(timeToElapse * 1);

	// calculate InfectionsByRequestedTime
	const calculateInfectionsByRequestedTime = (currentlyInfected) => {
		const factor = Math.trunc(timeToElapse / 3);
		return currentlyInfected * 2 ** factor;
	};
	// calculate AvailableBeds
	const calculateAvailableBeds = (severeCasesByRequestedTime) => {
		const bedsAvailable = totalHospitalBeds * 0.35;
		const shortage = bedsAvailable - severeCasesByRequestedTime;
		const result = shortage < 0 ? shortage : bedsAvailable;
		return Math.trunc(result);
	};

	// calculate dollarsInFlight
	const calculateDollarsInFlight = (infectionsByRequestedTime) => {
		const infections =
			infectionsByRequestedTime *
			avgDailyIncomeInUSD *
			avgDailyIncomePopulation;
		const result = infections / timeToElapse;
		return Math.trunc(result);
	};

	// the best case estimation
	const impact = {};
	// challenge 1
	impact.currentlyInfected = reportedCases * 10;
	impact.infectionsByRequestedTime = calculateInfectionsByRequestedTime(
		impact.currentlyInfected
	);
	// challenge 2
	impact.severeCasesByRequestedTime = Math.trunc(
		impact.infectionsByRequestedTime * 0.15
	);
	impact.hospitalBedsByRequestedTime = calculateAvailableBeds(
		impact.severeCasesByRequestedTime
	);
	// challenge 3
	impact.casesForICUByRequestedTime = Math.trunc(
		impact.infectionsByRequestedTime * 0.05
	);
	impact.casesForVentilatorsByRequestedTime = Math.trunc(
		impact.infectionsByRequestedTime * 0.02
	);
	impact.dollarsInFlight = calculateDollarsInFlight(
		impact.infectionsByRequestedTime
	);

	// the severe case estimation
	const severeImpact = {};
	// challenge 1
	severeImpact.currentlyInfected = reportedCases * 50;
	severeImpact.infectionsByRequestedTime = calculateInfectionsByRequestedTime(
		severeImpact.currentlyInfected
	);
	// challenge 2
	severeImpact.severeCasesByRequestedTime = Math.trunc(
		severeImpact.infectionsByRequestedTime * 0.15
	);
	severeImpact.hospitalBedsByRequestedTime = calculateAvailableBeds(
		severeImpact.severeCasesByRequestedTime
	);
	// challenge 3
	severeImpact.casesForICUByRequestedTime = Math.trunc(
		severeImpact.infectionsByRequestedTime * 0.05
	);
	severeImpact.casesForVentilatorsByRequestedTime = Math.trunc(
		severeImpact.infectionsByRequestedTime * 0.02
	);
	severeImpact.dollarsInFlight = calculateDollarsInFlight(
		severeImpact.infectionsByRequestedTime
	);

	return {
		data, // the input data you got
		impact, // your best case estimation
		severeImpact, // your severe case estimation
	};
};

const filterInput = (data) => {
	if (!data) return false;
	// Destructuring the given data
	const {
		region: { name, avgAge, avgDailyIncomeInUSD, avgDailyIncomePopulation },
		periodType,
		timeToElapse,
		reportedCases,
		population,
		totalHospitalBeds,
	} = data;

	if (
		!name ||
		!avgAge ||
		!avgDailyIncomeInUSD ||
		!avgDailyIncomePopulation ||
		!periodType ||
		!timeToElapse ||
		!reportedCases ||
		!population ||
		!totalHospitalBeds
	)
		return false;

	return true;
};

const keepMyLog = (req, responseStatusCode, next) => {
	const { keepLog } = req;
	keepLog.ktime = Date.now();
	keepLog.kcode = responseStatusCode;
	const { kmethod, kpath, kcode, stime, ktime } = keepLog;
	fs.appendFile(
		`${__dirname}/logs.txt`,
		`${kmethod}\t${kpath}\t${kcode}\t${ktime - stime} ms \n`,
		(err) => {
			if (err) throw err;
		}
	);
};

// Get: display welcome message
const welcome = (req, res, next) => {
	keepMyLog(req, 200);
	res.status(200).send("<h4>Welcome to covid-19-estimator-api</h4>");
};
// POST: JSON
const dataJson = (req, res, next) => {
	if (!filterInput(req.body)) {
		keepMyLog(req, 400);
		return res.status(400).json({
			status: "Error",
			message: "Invalid Input. All values were not provided.",
		});
	}
	const covid19 = covid19ImpactEstimator(req.body);
	keepMyLog(req, 200);
	res.status(200).json(covid19);
};

// POST: XML
const dataXml = (req, res, next) => {
	if (!filterInput(req.body)) {
		keepMyLog(req, 400);
		return res.status(400).json({
			status: "Error",
			message: "Invalid Input. All values were not provided.",
		});
	}
	const { data, impact, severeImpact } = covid19ImpactEstimator(req.body);
	const {
		region: { name, avgAge, avgDailyIncomeInUSD, avgDailyIncomePopulation },
		periodType,
		reportedCases,
		totalHospitalBeds,
		population,
		timeToElapse,
	} = data;
	const xml = `
<?xml version="1.0" encoding="UTF-8" ?>
<root>
  <data>
    <region> 
      <name>${name}</name>
      <avgAge>${avgAge}</avgAge>
      <avgDailyIncomeInUSD>${avgDailyIncomeInUSD}</avgDailyIncomeInUSD>
      <avgDailyIncomePopulation>${avgDailyIncomePopulation}</avgDailyIncomePopulation>
    </region>
    <periodType>${periodType}</periodType>
    <timeToElapse>${timeToElapse}</timeToElapse>
    <reportedCases>${reportedCases}</reportedCases>
    <population>${population}</population>
    <totalHospitalBeds>${totalHospitalBeds}</totalHospitalBeds>
  </data>
  <impact>
    <currentlyInfected>${impact.currentlyInfected}</currentlyInfected>
    <infectionsByRequestedTime>${impact.infectionsByRequestedTime}</infectionsByRequestedTime>
    <severeCasesByRequestedTime>${impact.severeCasesByRequestedTime}</severeCasesByRequestedTime>
    <hospitalBedsByRequestedTime>${impact.hospitalBedsByRequestedTime}</hospitalBedsByRequestedTime>
    <casesForICUByRequestedTime>${impact.casesForICUByRequestedTime}</casesForICUByRequestedTime>
    <casesForVentilatorsByRequestedTime>${impact.casesForVentilatorsByRequestedTime}</casesForVentilatorsByRequestedTime>
    <dollarsInFlight>${impact.dollarsInFlight}</dollarsInFlight>
  </impact>
  <severeImpact>
    <currentlyInfected>${severeImpact.currentlyInfected}</currentlyInfected>
    <infectionsByRequestedTime>${severeImpact.infectionsByRequestedTime}</infectionsByRequestedTime>
    <severeCasesByRequestedTime>${severeImpact.severeCasesByRequestedTime}</severeCasesByRequestedTime>
    <hospitalBedsByRequestedTime>${severeImpact.hospitalBedsByRequestedTime}</hospitalBedsByRequestedTime>
    <casesForICUByRequestedTime>${severeImpact.casesForICUByRequestedTime}</casesForICUByRequestedTime>
    <casesForVentilatorsByRequestedTime>${severeImpact.casesForVentilatorsByRequestedTime}</casesForVentilatorsByRequestedTime>
    <dollarsInFlight>${severeImpact.dollarsInFlight}</dollarsInFlight>
  </severeImpact>
</root>
  `;
	res.type("application/xml");

	keepMyLog(req, 200);
	res.status(200).send(xml);
};

// GET: logs
const logs = (req, res, next) => {
	fs.readFile(`${__dirname}/logs.txt`, "utf8", (err, data) => {
		if (err) throw err;
		res.set("Content-Type", "text/plain");
		keepMyLog(req, 200);
		res.status(200).send(data);
	});
};

module.exports = {
	welcome,
	dataJson,
	dataXml,
	logs,
};
