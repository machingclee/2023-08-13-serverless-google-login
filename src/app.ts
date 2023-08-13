import express, { Request } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import cors from 'cors';
import errorHandler from "./middlewares/errorHandler";

const allowlist = ['http://localhost:3000']
const corsOptionsDelegate = (req, callback) => {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) > -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  ALLOWED_EMAILS,
  GOOGLE_API_REDIRECT,
  JWT_SECRET,
  FRONTEND_URL
} = process.env;

const ALLOWED_EMAILS_ = ALLOWED_EMAILS.split(",");

const app = express();
app.use(cors(corsOptionsDelegate));

const oAuth2Client = new google.auth.OAuth2(
  {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_API_REDIRECT
  }
);
function getAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  });
}

app.get("/login", async (req, res) => {
  const url = getAuthUrl()
  res.status(200).json({ url });
});

app.get("/login-google", async (req: Request<any, any, any, { code: string }>, res, next) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.credentials = tokens;
  const oauth2 = google.oauth2("v2");

  const res_ = await oauth2.userinfo.v2.me.get({
    auth: oAuth2Client
  });
  const { email } = res_.data;
  const hasRight = ALLOWED_EMAILS_.includes(email);
  if (!hasRight) {
    return next(`Only ${ALLOWED_EMAILS_.join(", ")} has access to this project.`);
  }
  const token = jwt.sign({
    email,
  }, JWT_SECRET, {
    expiresIn: 60 * 60
  });
  res.redirect(`${FRONTEND_URL}/token/${token}`);
})

app.get("/authenticate", async (req: Request<any, any, any, { token: string }>, res, next) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true })
  } catch (err) {
    next(err);
  }
})

app.use(errorHandler);

const PORT = Number(process.env["PORT"]);

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});


