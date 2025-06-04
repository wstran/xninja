declare namespace NodeJS {
	export interface ProcessEnv {
		TWITTER_CLIENT_ID: string;
		TWITTER_CLIENT_SECRET: string;
		MONGO_URI: string;
		DB_NAME: string;
		NEXTAUTH_SECRET: string;
		NEXT_PUBLIC_DISCORD_CLIENT_ID: string;
		NEXT_PUBLIC_DISCORD_REDIRECT_URI: string;
		DISCORD_CLIENT_SECRET: string;
		DISCORD_CLIENT_TOKEN: string;
		DISCORD_GUILD_ID: string;
	}
}