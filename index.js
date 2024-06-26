const fs = require("fs");
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const multer = require("multer");

const app = express();

const baseURL = "https://dsidl-transfer-tool.glitch.me";

const baseHTML = `<!DOCTYPE html>
<head>
  <title>dsidl transfer tool</title>
  <link rel="icon" type="image/jpeg" href="https://danilionn.github.io/danis-bot-website/assets/images/dsidl-transfer-tool-icon.png">
  <style>

  @font-face {
      font-family: 'Pixel';
      src:  url('https://danilionn.github.io/danis-bot-website/assets/fonts/JSE_Commodore64.woff2') format('woff2'),
            url('https://danilionn.github.io/danis-bot-website/assets/fonts/JSE_Commodore64.woff') format('woff');
  }  
    .qr {
       display: inline-block;
       padding-top: 10px;
       padding-right: 10px;
       padding-bottom: 10px;
       padding-left: 10px;
     }

     .center {
     margin: auto;
     width: 80%;
     }

    body {
      background-color: #000000;
      } 

      p, a, form {
        color: #FFFFFF;
        font-family: Pixel;
     ;
        } 
        h3 {
        color: #FFFFFF;
        font-family: Pixel;  
        display: inline-block;
        }
        #uploadButton, #clearButton {
         display: none;
        }

  </style>
</head>
<body>
  <div class="center">
  <h3 style="text-align:center;">
  <img src="https://danilionn.github.io/danis-bot-website/assets/images/dsidl-transfer-tool-icon.png" width="32" height="32" style="padding-left: 5px">
    QR codes are meant to be scanned with the 
    <a href="https://github.com/Epicpkmn11/dsidl" target="_blank">
      dsidl homebrew app</a> for the DSi. 
    <img src="https://danilionn.github.io/danis-bot-website/assets/images/dsidl-transfer-tool-icon.png" width="32" height="32" style="padding-left: 5px">
  </h3>
  <p style="text-align:center;">
    Upload a file and it'll be turned into a QR Code that you can scan with dsidl to download to your DSi!
  </p>
  <p style="text-align:center;">
    Uploaded files are deleted after being scanned and sent over, so QR Codes are one use only.
  </p>
  </div>
  <br>`;

const htmlFinalPart = `<br><br><br><div class="center"> 
    <form  style="text-align:center;" action="/upload" method="post" enctype="multipart/form-data">
     <input type="file" id="fileInput" name="file" onchange="showUploadButton()">
      <button type="submit" id="uploadButton" >Upload</button>
      <button type="button" id="clearButton" onclick="clearFileInput()">Clear Selection</button>

    </form>

<script>

  function showUploadButton() {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const clearButton = document.getElementById('clearButton');

    if (fileInput.files.length > 0) {

      uploadButton.style.display = 'inline-block';
      clearButton.style.display = 'inline-block';
    } else {

      uploadButton.style.display = 'none';
      clearButton.style.display = 'none';
    }
  }

  function clearFileInput() {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const clearButton = document.getElementById('clearButton');

    fileInput.value = '';

    uploadButton.style.display = 'none';
     clearButton.style.display = 'none';
  }
</script>
    
  </div>
  <br><br><br><br>
  <div class="center">  
    <p style="text-align:center;">Check out the <a href="https://github.com/DaniLionn/dsidl-transfer-tool">github repo!<img src="https://danilionn.github.io/danis-bot-website/assets/images/github-mark-white.png" width="25" height="25" style="padding-left: 5px"></a></p>
  </div>
</body>`;
var finalHTML = baseHTML;

const options = {
  root: path.join(__dirname),
};

function createQRCode(file) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      JSON.stringify([
        `QR Code for file ${file} was scanned!`,
        `${baseURL}/${file}`,
        "Thanks for downloading!",
      ]),

      (err, url) => {
        if (err) {
          reject("Error generating QR code");
        } else {
          const qrCodeHtml = `<div id="${file}" class="qr"><p style="text-align:center">Download ${file}:</p><br><img src="${url}" alt="QR Code" width="312px" height="312px"</div>`;
          //"<form action="/clearQR?file=${file}&url=${url}" method="get" enctype="multipart/form-data"><button type="submit" id="clearQR" >Clear</button></form>"
          finalHTML += qrCodeHtml;

          resolve();
        }
      }
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
      console.log("Got request! Sending file...");

      res.sendFile(filePath, options, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Sent:", filePath);
          fs.promises.unlink(filePath);
        }
      });
    });

    createQRCode(encodeURI(uploadedFile.filename)).then(() => {
      res.redirect(`${baseURL}?resetPage=false`);
    });
  } else {
    res.redirect(baseURL);
  }
});

app.get("/test", function (req, res) {
  res.send("OK");
});

// app.get("/clearQR", function (req, res) {
//   let file = req.query.file
//   let url = req.query.url

//   console.log(file,url)

//   const qrCodeHtml = `<div id="${file}" class="qr"><p style="text-align:center">Download ${file}:</p><br><img src="${url}" alt="QR Code" width="312px" height="312px"><form action="/clearQR?file=${file}" method="post" enctype="multipart/form-data"><button type="submit" id="clearQR" onclick="clearQR()">Clear</button></form></div>`;

//   console.log(qrCodeHtml, finalHTML.includes(qrCodeHtml))

//   if (finalHTML.includes(qrCodeHtml)) {
//     finalHTML = finalHTML.replace(qrCodeHtml, "");
//     const filePath = path.join("./uploads", file);
//      fs.promises.unlink(filePath);
//   }

//   res.redirect(`${baseURL}?resetPage=false`);
// });

app.get("/", function (req, res) {
  let resetPage = req.query.resetPage;

  if (!resetPage || resetPage == "true") {
    finalHTML = baseHTML;

    res.send(finalHTML + htmlFinalPart);
  } else {
    res.send(finalHTML + htmlFinalPart);
  }
});

app.listen(3000, function (err) {
  if (err) console.log(err);
  console.log("Server listening on port 3000");
});

//delete any leftover uploaded files on startup
fs.readdir("./uploads", function (err, files) {
  if (err) {
    console.log(err);
  } else {
    files.forEach((file) => {
      const filePath = path.join("./uploads", file);
      fs.promises.unlink(filePath);
    });
  }
});
