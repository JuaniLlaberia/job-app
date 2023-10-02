const User = require('../models/userModel');
const catchErrorAsync = require('../utils/catchErrorAsync');
const CustomError = require('../utils/error');

exports.getUsers = catchErrorAsync(async (req, res) => {
  const users = await User.find({
    profession: { $regex: req.query.search || '', $options: 'i' },
  })
    .limit(req.query.limit || 10)
    .select('_id profession fullName image location');

  res.status(200).json({
    status: 'success',
    count: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchErrorAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    '_id fullName image profession email'
  );

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updateUser = catchErrorAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new CustomError('Not allowed to update password in this endpoint', 400)
    );

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchErrorAsync(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

//User interactions

exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: req.user,
  });
};

exports.updateMe = catchErrorAsync(async (req, res, next) => {
  //Does not work for passwords (just for information)
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new CustomError(
        'This endpoint is not to update passwords (just user info).',
        400
      )
    );

  let filteredObj = { ...req.body };
  const fieldsToRemove = ['_id', 'role', 'savedPosts', 'passwordChangedAt'];
  fieldsToRemove.forEach(el => delete filteredObj[el]);

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchErrorAsync(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

//Save job in user favorite
exports.saveJob = catchErrorAsync(async (req, res, next) => {
  const postToSave = req.params.id;

  if (req.user.savedPosts.includes(postToSave))
    return next(new CustomError(`You can't save a post twice.`, 404));

  const allSavedPosts = [...req.user.savedPosts, postToSave];

  await User.findByIdAndUpdate(req.user.id, { savedPosts: allSavedPosts });

  res.status(200).json({
    status: 'success',
    message: 'Saved successfully.',
  });
});

exports.unSaveJob = catchErrorAsync(async (req, res) => {
  const newSavedPosts = req.user.savedPosts.filter(
    job => job.toString('hex') !== req.params.id
  );

  await User.findByIdAndUpdate(req.user.id, { savedPosts: newSavedPosts });

  res.status(200).json({
    status: 'success',
    message: 'Unsaved successfully.',
  });
});
