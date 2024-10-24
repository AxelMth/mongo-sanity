import mongoose, { Document } from 'mongoose';
import cliProgress from 'cli-progress';

import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

interface ValidationResult {
  total: number;
  nbOfInvalidDocuments: number;
}

export class Validator<T extends Document> {
  private progressBar: cliProgress.SingleBar;

  private nbOfInvalidDocuments = 0;

  private _processTransform: Transform = new Transform({
    objectMode: true,
    transform: async (doc: T, encoding: string, callback: () => void): Promise<void> => {
      try {
        await this.validateDocument(doc);
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.onValidationFailed(doc, error.message);
        }
        this.nbOfInvalidDocuments += 1;
      } finally {
        this.incrementProgression();
        callback();
      }
    },
  });

  constructor(
    protected readonly mongooseInstance: typeof mongoose,
    protected readonly modelName: string,
    protected readonly batchSize: number,
  ) {
    this.progressBar = new cliProgress.SingleBar(
      {},
      {
        ...cliProgress.Presets.shades_classic,
        format: `${this.modelName} [{bar}] {percentage}% | {value}/{total}`,
      },
    );
  }

  public async validate(): Promise<ValidationResult> {
    const count = await this.countDocuments();

    this.initProgressBar(count);

    const stream = this.mongooseInstance.model(this.modelName).collection.find().stream();

    await pipeline(stream, this._processTransform);

    this.stopProgression();

    const nbOfInvalidDocuments = await this.postValidate();

    return {
      total: count,
      nbOfInvalidDocuments: nbOfInvalidDocuments || this.nbOfInvalidDocuments,
    };
  }

  private countDocuments(): Promise<number> {
    return this.mongooseInstance.model(this.modelName).countDocuments();
  }

  private initProgressBar(total: number): void {
    this.progressBar.start(total, 0);
  }

  private incrementProgression(incrementStep = 1): void {
    this.progressBar.increment(incrementStep);
  }

  private stopProgression(): void {
    this.progressBar.stop();
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  protected async validateDocument(doc: T): Promise<void> {
    throw new Error('validateDocument not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected onValidationFailed(doc: T, errorMessage: string): void {
    throw new Error('onValidationFailed not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/require-await,
  protected async postValidate(): Promise<number> {
    throw new Error('postValidate not implemented.');
  }
}
