module.exports = (req, res) => {
  res.json({
    message: "Root api folder is compiled and working!",
    timestamp: new Date()
  });
};
