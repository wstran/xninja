import { CLIENT_URL, CLIENT_WEB_URL, upsertUser } from "./config";

export async function twitterOauth1a(req: any, res: any, client_infos: { clientIp: string; location: any }) {
  const user = await upsertUser(req.user, client_infos);
  res.redirect(
    `${CLIENT_URL}/oauth/callback/twitter?accessToken=${user.accessToken}&tw_id=${user.tw_id}`
  );
}

export async function twitterOauth1aWeb(req: any, res: any, client_infos: { clientIp: string; location: any }) {
  const user = await upsertUser(req.user, client_infos);

  res.cookie("xninja-auth_token", user.accessToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax"
  });

  res.redirect(CLIENT_WEB_URL);
}
