const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const xml2js = require("xml2js");
const { parseString } = xml2js;

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

// send request
app.post("/send-email", (req, res) => {
  const { to, subject, text } = req.body;
  const formattedText = text.replace(/\\n/g, "\n");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "Dynasoftsm@gmail.com",
      pass: "jiltzcuvbkgbfxbn",
    },
  });
  const mailOptions = {
    from: "info@dynasoftsystems.technology",
    to,
    subject,
    text: formattedText,
  };
  console.log(mailOptions);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Error sending email" });
    } else {
      console.log("Email sent:", info.response);
      res.json({ success: "Email sent successfully", message: mailOptions });
    }
  });
});

// join the newsletter
app.post("/newsLetter", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send("Bad Request: Email is missing.");
  }
  fs.readFile("emails.xml", "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading XML file:", err);
      return res.status(500).send("Internal Server Error");
    }
    xml2js.parseString(data, { explicitArray: false }, (parseErr, result) => {
      if (parseErr) {
        console.error("Error parsing XML:", parseErr);
        return res.status(500).send("Internal Server Error");
      }
      result = result || {};
      result.emails = result.emails || {};
      result.emails.email = result.emails.email || [];
      const existingEmails = result.emails.email || [];
      if (existingEmails && existingEmails.includes(email)) {
        return res.status(409).send("Conflict: Email already exists.");
      }
      if (!Array.isArray(existingEmails)) {
        result.emails.email = [existingEmails];
      } else {
        result.emails.email = existingEmails;
      }
      if (result.emails.email.includes(email)) {
        return res.status(409).send("Conflict: Email already exists.");
      }
      result.emails.email.push(email);
      const builder = new xml2js.Builder();
      const updatedXml = builder.buildObject(result);
      fs.writeFile("emails.xml", updatedXml, "utf-8", (writeErr) => {
        if (writeErr) {
          console.error("Error writing to XML file:", writeErr);
          return res.status(500).send("Internal Server Error");
        }
        return res.status(200).send("Email appended to XML file successfully.");
      });
    });
  });
});

app.get("/dynaletter", (req, res) => {
  const filePath = path.join(__dirname, "newsletter.html");
  res.sendFile(filePath);
});

// send newsletters
app.post("/sendMails", (req, res) => {
  let { pass, text, subject } = req.body;

  let copyText = text;
  if (pass && pass == "dynasoft") {
    const xmlFilePath = "emails.xml";
    const readXmlFile = async (path) => {
      const data = await fs.promises.readFile(path, "utf-8");
      let emails = "";
      parseString(data, function (err, result) {
        emails = result;
      });
      return emails;
    };
    const getEmails = async () => {
      try {
        const result = await readXmlFile(xmlFilePath);
        return result.emails && result.emails.email ? result.emails.email : [];
      } catch (error) {
        console.error("Error reading XML file:", error.message);
        process.exit(1);
      }
    };
    const transporter = nodemailer.createTransport({
      host: "smtp2go.com",
      port: 2525,
      secure: false,
      auth: {
        user: "abbass_ibrahim@hotmail.com",
        pass: "f2velUO9WPbe",
      },
    });
    const sendEmail = async (to) => {
      const unsubscribeLink = `http://localhost:3000/unsubscribe?email=${to}`;
      const unsubscribeButton = `<a href="${unsubscribeLink}">unsubscribe</a>`;
      copyText = `${text}<br/><br/>${unsubscribeButton}`;
      const mailOptions = {
        from: "info@dynasoftsystems.technology",
        to,
        subject: subject,
        html: copyText,
      };
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
      } catch (error) {
        console.error(`Error sending email to ${to}:`, error.message);
      }
    };
    const main = async () => {
      const emails = await getEmails();
      for (const email of emails) {
        await sendEmail(email);
      }
    };
    main();
    res.json("done");
  } else {
    res.status(401);
  }
});

// send greating mail
app.post("/greetingMail", (req, res) => {
  const { email } = req.body;
  const subject = "You're In! 🎉 Welcome to Dynasoft's Family!";
  const text = `
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: center;
        }
        .content {
          padding: 20px;
        }
        .footer {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Dynasoft Technology's Family!</h1>
        </div>
        <div class="content">
          <p>
            We're thrilled to have you on board. Thank you for joining our newsletter community.
          </p>
          <p>
            You can expect exciting updates, news, and offers delivered straight to your inbox.
          </p>
          <p>
            If you wish to unsubscribe, click <a href="http://localhost:3000/unsubscribe?email=${email}">here</a>.
          </p>
        </div>
        <div class="footer">
          <p>
            Best regards,<br>
            The Dynasoft Team
          </p>
        </div>
      </div>
    </body>
  </html>
`;
  const transporter = nodemailer.createTransport({
    host: "smtp2go.com",
    port: 2525,
    secure: false,
    auth: {
      user: "abbass_ibrahim@hotmail.com",
      pass: "f2velUO9WPbe",
    },
  });

  const mailOptions = {
    from: "info@dynasoftsystems.technology",
    to: email,
    subject: subject,
    html: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Error sending email" });
    } else {
      console.log("Email sent:", info.response);
      res.json({ success: "Email sent successfully", message: mailOptions });
    }
  });
});

// unsubscribe from newsletter
app.get("/unsubscribe", (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send("Bad Request: Email is missing.");
  }

  fs.readFile("emails.xml", "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading XML file:", err);
      return res.status(500).send("Internal Server Error");
    }

    xml2js.parseString(data, { explicitArray: false }, (parseErr, result) => {
      if (parseErr) {
        console.error("Error parsing XML:", parseErr);
        return res.status(500).send("Internal Server Error");
      }

      result = result || {};
      result.emails = result.emails || {};
      result.emails.email = result.emails.email || [];

      const existingEmails = result.emails.email;

      if (!existingEmails.includes(email)) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Email Unsubscribed</title>
              <style>
                body {
                  font-family: "Arial", sans-serif;
                  background-color: #f5f5f5;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                }              
                p {
                  color: #555;
                }              
                .success {
                  color: #4caf50;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Email Unsubscribed</h1>
                <p class="success">Your email has been successfully unsubscribed.</p>
                <p>Thank you for using our newsletter service.</p>
              </div>
            </body>
          </html>
            `);
      }
      result.emails.email = existingEmails.filter(
        (existingEmail) => existingEmail !== email
      );

      const builder = new xml2js.Builder();
      const updatedXml = builder.buildObject(result);

      fs.writeFile("emails.xml", updatedXml, "utf-8", (writeErr) => {
        if (writeErr) {
          console.error("Error writing to XML file:", writeErr);
          return res.status(500).send("Internal Server Error");
        }

        return res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Email Unsubscribed</title>
              <style>
                body {
                  font-family: "Arial", sans-serif;
                  background-color: #f5f5f5;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333;
                }              
                p {
                  color: #555;
                }              
                .success {
                  color: #4caf50;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Email Unsubscribed</h1>
                <p class="success">Your email has been successfully unsubscribed.</p>
                <p>Thank you for using our newsletter service.</p>
              </div>
            </body>
          </html>
      `);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
