const express = require('express');
const router = express.Router();
const db  = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


router.post('/register', signupValidation, (req, res, next) => {

    db.query(
      `SELECT * FROM blilusersignupdata WHERE LOWER(Email) = LOWER(${db.escape(
    req.body.Email
)});`,
      (err, result) => {

    if (result.length) {
    return res.status(409).send({
    msg: 'This user is already in use!'
});
}
 else {
// username is available
    bcrypt.hash(req.body.Password, 10, (err, hash) => {
    if (err) {
    return res.status(500).send({
    msg: err
});
   } else {
// has hashed pw => add to database
db.query(
    `INSERT INTO blilusersignupdata (FirstName,LastName,Age,Gender,Location,PhoneNo,Eac,Pincode,Subject,Data,Type,About, Email, Password) VALUES ('${req.body.FirstName}','${req.body.LastName}','${req.body.Age}','${req.body.Gender}','${req.body.Location}','${req.body.PhoneNo}','${req.body.Eac}','${req.body.Pincode}','${req.body.Subject}','${req.body.Data}','${req.body.Type}','${req.body.About}', ${db.escape(
    req.body.Email
)}, ${db.escape(hash)})`,
    (err, result) => {
    if (err) {
throw err;
    return res.status(400).send({
    msg: err
});
}
   return res.status(201).send({
   msg: 'Registered Sucessfully'
})});
}})}});
});


router.post('/login', loginValidation, (req, res, next) => {
   db.query(
   `SELECT * FROM blilusersignupdata WHERE Email = ${db.escape(req.body.Email)};`,
   (err, result) => {
// user does not exists
   if (err) {
   throw err;
   return res.status(400).send({
   msg: err
});
}
   if (!result.length) {
   return res.status(401).send({
   msg: 'Email or password is incorrect!'
});
}
// check password
   bcrypt.compare(
   req.body.Password,
   result[0]['Password'],
   (bErr, bResult) => {
// wrong password
   if (bErr) {
   throw bErr;
   return res.status(401).send({
   msg: 'Email or password is incorrect!'
});
}
   if (bResult) {
   const token = jwt.sign({DocId:result[0].DocId},'the-super-strong-secrect',{ expiresIn: '1h' });
   db.query(
   `UPDATE blilusersignupdata SET last_login = now() WHERE DocId = '${result[0].DocId}'`
);
    return res.status(200).send({
    msg: 'Logged in!',
    token,
    user: result[0]
});
}
   return res.status(401).send({
   msg: 'Username or password is incorrect!'
})}
)})});


router.post('/get-user', signupValidation, (req, res, next) => {
   if(
       !req.headers.authorization ||
       !req.headers.authorization.startsWith('Bearer') ||
       !req.headers.authorization.split(' ')[1]
){
    return res.status(422).json({
       message: "Please provide the token",
});
}
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, 'the-super-strong-secrect');
  db.query('SELECT * FROM blilusersignupdata where DocId=?', decoded.DocId, function (error, results, fields) {
    if (error) throw error;
    return res.send({ error: false, data: results[0], message: 'Fetch Successfully.' });
});
});


module.exports = router;
