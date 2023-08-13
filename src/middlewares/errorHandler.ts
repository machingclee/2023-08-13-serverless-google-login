export default (err, req, res, next) => {
  if (err) {
    res.json({ success: false, errorMessage: err });
  }
}