import mongoose from 'mongoose';
import { DataValidator } from './validators/data.validator';
import { ReferenceValidator } from './validators/reference.validator';

interface ValidationResult {
  total: number;
  dataInvalid: number;
  refInvalid: number;
}

/**
 * Check if the document is valid according to the schema.
 * @param mongooseInstance
 * @param modelName
 * @param doc
 * @returns
 */
const areDataValid = async (
  mongooseInstance: typeof mongoose,
  modelName: string,
): Promise<number> => {
  console.info(`Checking data for model ${modelName}`);
  const dataValidator = new DataValidator(mongooseInstance, modelName, 2500);
  const { nbOfInvalidDocuments } = await dataValidator.validate();
  return nbOfInvalidDocuments;
};

/**
 * If schema contains a ref to another model, we need to check if the ref is valid.
 * It means the reference exists in the database.
 * @param mongooseInstance
 * @param modelName
 * @param doc
 * @returns
 */
const doRefsExist = async (
  mongooseInstance: typeof mongoose,
  modelName: string,
): Promise<number> => {
  console.info(`Checking references for model ${modelName}`);
  const referenceValidator = new ReferenceValidator(mongooseInstance, modelName, 5000);
  const { nbOfInvalidDocuments } = await referenceValidator.validate();
  return nbOfInvalidDocuments;
};

const validateDataOfModel = async (
  mongooseInstance: typeof mongoose,
  modelName: string,
): Promise<ValidationResult> => {
  console.info(`Validating model: ${modelName}`);

  const total = await mongooseInstance.model(modelName).collection.countDocuments();
  const invalidDataCount = await areDataValid(mongooseInstance, modelName);
  const invalidReferenceCount = await doRefsExist(mongooseInstance, modelName);

  return { total, dataInvalid: invalidDataCount, refInvalid: invalidReferenceCount };
};

export const connectToDatabaseAndValidateData = async (
  mongooseInstance: typeof mongoose,
  {
    modelsToExclude = [],
    modelsToInclude = [],
  }: { modelsToExclude?: string[]; modelsToInclude?: string[] } = {},
): Promise<void> => {
  for (const modelName of mongooseInstance.modelNames().filter((model) => {
    if (modelsToInclude.length > 0) {
      return modelsToInclude.includes(model);
    }
    return !modelsToExclude.includes(model);
  })) {
    const modelResult = await validateDataOfModel(mongooseInstance, modelName);
    console.info(
      `Model: ${modelName}, Total: ${modelResult.total}, Data: ${modelResult.dataInvalid}, Ref: ${modelResult.refInvalid}`,
    );
  }
  process.exit(0);
};
