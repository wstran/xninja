import { RequestWithUser } from 'config';
import { NextFunction, Response } from 'express';
import IORedis, { Redis } from 'ioredis';

class RedisWithFallback {
    private redisClient: Redis;
    private localSet: Set<string> = new Set();
    private useRedis: boolean = true;

    constructor(redisUrl: string) {
        this.redisClient = new IORedis(redisUrl);

        this.redisClient.on('connect', () => {
            this.useRedis = true;
        });

        this.redisClient.on('error', () => {
            this.useRedis = false;
        });

        this.redisClient.on('end', () => {
            this.useRedis = false;
        });
    }

    async add(key: string, value: string, ttl: number): Promise<void> {
        if (this.useRedis) {
            await this.redisClient.multi().sadd(key, value).set(`key:${value}`, '', 'EX', ttl).exec();
        } else {
            this.localSet.add(value);
            setTimeout(() => this.localSet.delete(value), ttl * 1000);
        }
    }

    async has(key: string, value: string): Promise<boolean> {
        if (this.useRedis) {
            return !!(await this.redisClient.sismember(key, value));
        } else {
            return this.localSet.has(value);
        }
    }

    async delete(key: string, value: string): Promise<void> {
        if (this.useRedis) {
            await this.redisClient.multi().srem(key, value).del(`key:${value}`).exec();
        } else {
            this.localSet.delete(value);
        }
    }
}

const redisWrapper = new RedisWithFallback(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const REDIS_KEY = 'queuing_request';

export default function queueRequest() {
    const StartRequest = async (req: RequestWithUser, _: Response, next: NextFunction) => {
        const tw_id = req.payload?.tw_id;
        if (tw_id) {
            if (!(await redisWrapper.has(REDIS_KEY, tw_id))) {
                await redisWrapper.add(REDIS_KEY, tw_id, 15);
                next();
            };
        };
    };

    const EndRequest = async (req: RequestWithUser) => {
        const tw_id = req.payload?.tw_id;
        if (tw_id) {
            await redisWrapper.delete(REDIS_KEY, tw_id);
        };
    };

    return [StartRequest, EndRequest];
};