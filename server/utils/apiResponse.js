export const sendResponse = (res, statusCode, data = null, message = "OK") => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    data,
    message
  });
};
