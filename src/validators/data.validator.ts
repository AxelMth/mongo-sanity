import mongoose, { Document } from 'mongoose';

import { Validator } from './validator';

export class DataValidator<T extends Document> extends Validator<T> {
  constructor(
    protected readonly mongooseInstance: typeof mongoose,
    protected readonly modelName: string,
    protected readonly batchSize: number = 5000,
  ) {
    super(mongooseInstance, modelName, batchSize);
  }

  protected async validateDocument(doc: T): Promise<void> {
    await this.mongooseInstance.model(this.modelName).validate(doc);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected async onValidationFailed(_doc: T, _errorMessage: string): Promise<void> {}

  protected async postValidate(): Promise<number> {
    return Promise.resolve(0);
  }
}
