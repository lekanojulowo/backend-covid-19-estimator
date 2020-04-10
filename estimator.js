const fs = require("fs");

// Estimator
const covid19ImpactEstimator = (data) => {
  // Destructuring the given data
  const {
    region,
    periodType,
    timeToElapse,
    reportedCases,
    population,
    totalHospitalBeds,
  } = data;
  // Destructuring the region of the given data
  const {
    name,
    avgAge,
    avgDailyIncomeInUSD,
    avgDailyIncomePopulation,
  } = region;

  // Custom Functions and Variables

  // normalize days; check for weeks and months if used
  switch (periodType) {
    case "weeks":
      timeToElapse *= 7;
      break;
    case "months":
      timeToElapse *= 30;
  }

  // calculate InfectionsByRequestedTime
  const calculateInfectionsByRequestedTime = (currentlyInfected) => {
    const factor = parseInt(timeToElapse / 3);
    return currentlyInfected * 2 ** factor;
  };
  // calculate AvailableBeds
  const calculateAvailableBeds = (severeCasesByRequestedTime) => {
    const bedsAvailable = totalHospitalBeds * 0.35;
    const shortage = bedsAvailable - severeCasesByRequestedTime;
    const result = shortage < 0 ? shortage : bedsAvailable;
    return parseInt(result);
  };

  // the best case estimation
  const impact = {};
  // challenge 1
  impact.currentlyInfected = reportedCases * 10;
  impact.infectionsByRequestedTime = calculateInfectionsByRequestedTime(
    impact.currentlyInfected
  );
  // challenge 2
  impact.severeCasesByRequestedTime = impact.infectionsByRequestedTime * 0.15;
  impact.hospitalBedsByRequestedTime = calculateAvailableBeds(
    impact.severeCasesByRequestedTime
  );
  // challenge 3
  impact.casesForICUByRequestedTime = impact.infectionsByRequestedTime * 0.05;
  impact.casesForVentilatorsByRequestedTime =
    impact.infectionsByRequestedTime * 0.02;
  impact.dollarsInFlight =
    impact.infectionsByRequestedTime *
    avgDailyIncomePopulation *
    avgDailyIncomeInUSD *
    timeToElapse;

  // the severe case estimation
  const severeImpact = {};
  // challenge 1
  severeImpact.currentlyInfected = reportedCases * 50;
  severeImpact.infectionsByRequestedTime = calculateInfectionsByRequestedTime(
    severeImpact.currentlyInfected
  );
  // challenge 2
  severeImpact.severeCasesByRequestedTime =
    severeImpact.infectionsByRequestedTime * 0.15;
  severeImpact.hospitalBedsByRequestedTime = calculateAvailableBeds(
    severeImpact.severeCasesByRequestedTime
  );
  // challenge 3
  severeImpact.casesForICUByRequestedTime =
    severeImpact.infectionsByRequestedTime * 0.05;
  severeImpact.casesForVentilatorsByRequestedTime =
    severeImpact.infectionsByRequestedTime * 0.02;
  severeImpact.dollarsInFlight =
    severeImpact.infectionsByRequestedTime *
    avgDailyIncomePopulation *
    avgDailyIncomeInUSD *
    timeToElapse;

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
    region: {
      name,
      avgAge,
      avgDailyIncomeInUSD,
      avgDailyIncomePopulation
    },
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
  const {
    keepLog
  } = req;
  keepLog.ktime = Date.now();
  keepLog.kcode = responseStatusCode;
  const {
    kmethod,
    kpath,
    kcode,
    stime,
    ktime
  } = keepLog;
  fs.appendFile(
    `${__dirname}/logs.txt`,
    `${kmethod}\t${kpath}\t${kcode}\t${ktime - stime} ms \n`,
    err => {
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
  const covid19 = covid19ImpactEstimator(req.body);
  res.set("Content-Type", "text/xml");
  keepMyLog(req, 200);
  res.status(200).send(covid19);
};

// GET: logs
const logs = (req, res, next) => {
  const fileName = __dirname + "/logs.txt";
  res.set("Content-Type", "text/plain");
  res.status(200).sendFile(fileName, err => {
    if (err) throw err;
    keepMyLog(req, 200);
  });
};

module.exports = {
  welcome,
  dataJson,
  dataXml,
  logs,
};