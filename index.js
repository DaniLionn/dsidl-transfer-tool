const fs = require("fs");
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const multer = require("multer");

const app = express();

const baseURL = "https://dsidl-transfer-tool.dani-lionn.repl.co/";

const baseHTML = `
<!DOCTYPE html>
<head>
   <title>dsidl transfer tool</title>
   <link rel="icon" type="image/gif" href="https://db.universal-team.net/assets/images/icons/dsidl.gif">
   <style>.qr{display: inline-block;padding-top: 10px;padding-right: 10px;padding-bottom: 10px;padding-left: 10px;}body {background-color: #000000;} p, a {color: #FFFFFF;font-family: Verdana;} h3 {color: #FFFFFF;font-family: Verdana;  display: inline-block;}.center {margin: auto;width: 80%;}</style>
</head>
<body>
   <div class="center"><h3 style="text-align:center;"><img src="https://db.universal-team.net/assets/images/icons/dsidl.gif" width="25" height="25" style="padding-right: 7px" >QR codes are meant to be scanned with the <a href="https://github.com/Epicpkmn11/dsidl" target="_blank">dsidl homebrew app</a> for the DSi. <img src="https://db.universal-team.net/assets/images/icons/dsidl.gif" width="25" height="25" style="padding-left: 5px" ></h3><p>Upload a file and it'll be turned into a QR Code that you can scan with dsidl to download to your DSi!</p><p>Uploaded files are deleted after being scanned and sent over.</p></div>
   <br>`;
var finalHTML = baseHTML;

const options = {
  root: path.join(__dirname),
};

function createQRCode(file) {

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      JSON.stringify([
        `QR Code for file ${file} was scanned!`,
        `${baseURL}${file}`,
        "Thanks for downloading!",
      ]),

      (err, url) => {
        if (err) {
          reject("Error generating QR code");
        } else {
          const qrCodeHtml = `
  <div id="${file}" class="qr">
    <p style="text-align:center">Download ${file}:</p>
    <br>
    <img src="${url}" alt="QR Code" width="312px" height="312px">
  </div>`;

          finalHTML += qrCodeHtml;

          resolve();
        }
      },
    );
  });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); 
  },
  filename: function (req, file, cb) {
    console.log(file);
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const uploadedFile = req.file;

  if (uploadedFile) {
    console.log("uploaded");

    const filePath = path.join("./uploads", uploadedFile.filename);

    app.use(encodeURI(`/${uploadedFile.filename}`), function (req, res, next) {
      console.log("Got request!");

      res.sendFile(filePath, options, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Sent:", filePath);
        }
      });
    });

    app.get(encodeURI(`/${uploadedFile.filename}`), function (req, res) {
      console.log("File sent!");

      fs.promises.unlink(filePath)
      
      res.send("file sent");
    });

    createQRCode(encodeURI(uploadedFile.filename)).then(() => {
      res.redirect(`${baseURL}?resetPage=false`);
    });

    setTimeout(() => {
      fs.promises.unlink(filePath);
    }, 3600 * 1000);
  } else {
    res.redirect(baseURL);
  }
});

app.get("/test", function (req, res) {
  res.send("OK");
});

app.get("/", function (req, res) {
  let resetPage = req.query.resetPage;

  if (!resetPage || resetPage == "true") {
    finalHTML = baseHTML;

    res.send(
      finalHTML +
        `   <form action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file" />
    <button type="submit">Upload</button>
  </form>` +
        " </body>",
    );
  } else {
    res.send(
      finalHTML +
        `   <form action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file" />
    <button type="submit">Upload</button>
  </form>` +
        " </body>",
    );
  }
});

app.listen(80, function (err) {
  if (err) console.log(err);
});
