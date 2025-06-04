const TWITTER_CLIENT_ID = import.meta.env.VITE_TW_CLIENT_ID!

// twitter oauth Url constructor
function getTwitterOauthUrl() {
  const rootUrl = "https://twitter.com/i/oauth2/authorize";
  const options = {
    redirect_uri: `${import.meta.env.VITE_API_URL}/oauth/twitter`,
    client_id: TWITTER_CLIENT_ID,
    state: "state",
    response_type: "code",
    code_challenge: "y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8",
    code_challenge_method: "S256",
    scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(" ")
  };
  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

// the component
export function TwitterOauthButton() {
  return (
    <a className="a-button row-container" href={getTwitterOauthUrl()}>
      <p className="text-white-dark">{"twitter"}</p>
    </a>
  );
}