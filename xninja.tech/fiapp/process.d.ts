declare namespace NodeJS {
	export interface ProcessEnv {
		TWITTER_CLIENT_ID: string;
		TWITTER_CLIENT_SECRET: string;
		MONGO_URI: string;
		DB_NAME: string;
	}
}