import mongoose, { Document } from 'mongoose';

import _ from 'lodash';
import { Validator } from './validator';
import {
  extractAllModelNamesAndRefPaths,
  getRefIdsFromSchemaPath,
} from '../helpers/mongoose.helper';

export class ReferenceValidator<T extends Document> extends Validator<T> {
  private modelNamesAndRefPaths: { modelName: string; refPath: string }[] = [];

  private refIdsByModelName: Record<string, Set<string>> = {};

  private docByRefId: Record<string, string[]> = {};

  constructor(
    protected readonly mongooseInstance: typeof mongoose,
    protected readonly modelName: string,
    protected readonly batchSize: number = 100,
  ) {
    super(mongooseInstance, modelName, batchSize);
    this.modelNamesAndRefPaths = extractAllModelNamesAndRefPaths(
      this.mongooseInstance.model(this.modelName).schema,
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async validateDocument(doc: T): Promise<void> {
    for (const { modelName: refModelName, refPath } of this.modelNamesAndRefPaths) {
      const refIds = getRefIdsFromSchemaPath(doc, refPath);
      // eslint-disable-next-line no-continue
      if (refIds.length === 0) continue;
      const refIdSet = this.refIdsByModelName[refModelName] || new Set();
      refIds.forEach((r) => {
        refIdSet.add(r);
      });
      this.refIdsByModelName[refModelName] = refIdSet;
      refIds.forEach((r) => {
        this.docByRefId[r] = (this.docByRefId[r] || []).concat((doc._id as string).toString());
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected async onValidationFailed(doc: T, errorMessage: string): Promise<void> {}

  protected async postValidate(): Promise<number> {
    const allModelNames = Object.keys(this.refIdsByModelName);
    const docIdsWithMissingRefs: string[] = [];
    for (const modelName of allModelNames) {
      const refIds = Array.from(this.refIdsByModelName[modelName]);
      console.info(`Checking ${refIds.length} references for model ${modelName}`);
      const refIdsChunks = _.chunk(refIds, 10000);
      for (const chunkIds of refIdsChunks) {
        const missingRefIds = await this.getMissingRefIds(modelName, chunkIds);
        missingRefIds.forEach((id) => {
          docIdsWithMissingRefs.push(...this.docByRefId[id]);
        });
      }
    }
    return _.uniq(docIdsWithMissingRefs).length;
  }

  private async getMissingRefIds(modelName: string, refIds: string[]): Promise<string[]> {
    try {
      const model = this.mongooseInstance.model(modelName);
      const docs = await model.find({ _id: { $in: refIds } });
      if (docs.length === refIds.length) {
        return [];
      }
      return _.difference<string>(
        refIds,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        docs.map((doc) => doc._id.toString()),
      );
    } catch (error) {
      console.error(error as Error);
      return [];
    }
  }
}
