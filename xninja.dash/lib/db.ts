import { MongoClient, Db } from 'mongodb';

class Database {
  private client: MongoClient;
  private db: Db;

  constructor(private uri: string, private dbName: string) {
    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
  }

  public async connect(): Promise<Db> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    }
    return this.db;
  }

}

class DatabaseManager {
  private databases: Record<string, Database> = {};

  constructor(private connections: Record<string, { uri: string | undefined, dbName: string | undefined }>) {}

  public getDatabase(name: string): Database {
    if (!this.databases[name]) {
      const connection = this.connections[name];
      if (!connection) {
        throw new Error(`No connection found for name: ${name}`);
      }
      if(connection.uri && connection.dbName)
      this.databases[name] = new Database(connection.uri, connection.dbName);
    }
    return this.databases[name];
  }
}

const connections = {
  dashDB: { uri: process.env.MONGO_URI, dbName: process.env.DB_NAME },
  gameDB: { uri: process.env.MONGO_G_URI, dbName: process.env.DB_G_NAME },
};

export const manager = new DatabaseManager(connections);
