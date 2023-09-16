const Job = require('../models/jobsModel');

exports.getAllJobs = async (req, res) => {
  try {
    //Filtering fields from URL
    const filteredObj = { ...req.query };
    const fieldsToExclude = ['sort', 'select', 'page', 'limit', 'search'];
    fieldsToExclude.forEach(el => delete filteredObj[el]);

    let queryString = JSON.stringify(filteredObj);
    queryString = queryString.replace(/gte|gt|lte|lt/, match => `$${match}`);

    //Creating the QUERY
    let query = Job.find({
      ...JSON.parse(queryString),
      //Using search param we can query for jobs that contain str in name
      name: { $regex: req.query.search || '', $options: 'i' },
    });

    //Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.replaceAll(',', ' ');
      query.sort(sortBy);
    }

    //Select fields
    if (req.query.select) {
      const fields = req.query.select.replaceAll(',', ' ');
      query.select(fields);
    }

    //Pagination
    if (req.query.page) {
      const page = Number(req.query.page) || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      query.skip(skip).limit(limit);
    }

    // Get data from database
    const jobs = await query;

    //Return data
    res.status(200).json({
      status: 'success',
      count: jobs.length,
      data: {
        jobs,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.log(err);

    //Return error
    res.status(404).json({
      status: 'failed',
      message: 'There was a problem retrieving the data.',
    });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        job,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: `No job with id: ${req.params.id}`,
    });
  }
};

exports.createJob = async (req, res) => {
  try {
    const newJob = { ...req.body, createdBy: req.user.id };
    console.log(newJob);
    const job = await Job.create(newJob);
    res.status(201).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: 'success', data: { job } });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: `No job with id: ${req.params.id}`,
    });
  }
};
