import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchBucket,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      endpoint: config.get<string>('S3_ENDPOINT', 'http://localhost:9000'),
      region: config.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: config.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = config.get<string>('S3_BUCKET', 'media-creator');
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch (err: any) {
      if (err.name === 'NotFound' || err.name === 'NoSuchBucket') {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Created bucket "${this.bucket}"`);
        } catch (createErr: any) {
          this.logger.warn(`Failed to create bucket "${this.bucket}": ${createErr.message}`);
        }
      } else {
        this.logger.warn(`Cannot access S3 at ${this.config.get('S3_ENDPOINT')}: ${err.message}`);
      }
    }
  }

  /**
   * Upload a local file to MinIO, then delete the local file.
   * Returns the object key.
   */
  async uploadFile(localPath: string, objectKey: string): Promise<string> {
    const fileStream = createReadStream(localPath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: fileStream as unknown as Readable,
        ContentType: 'video/mp4',
      }),
    );

    // Delete local temp file
    await fs.unlink(localPath).catch(() => {});

    this.logger.log(`Uploaded ${objectKey}`);
    return objectKey;
  }

  /**
   * Download a file from MinIO to a local path.
   */
  async downloadFile(objectKey: string, localPath: string): Promise<void> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    const response = await this.client.send(command);
    const { createWriteStream } = await import('fs');
    const writer = createWriteStream(localPath);
    await new Promise<void>((resolve, reject) => {
      (response.Body as any).pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  /**
   * Get a presigned URL for downloading/viewing an object.
   */
  async getPresignedUrl(objectKey: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Check if an object exists in the bucket.
   */
  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      return true;
    } catch {
      return false;
    }
  }
}
