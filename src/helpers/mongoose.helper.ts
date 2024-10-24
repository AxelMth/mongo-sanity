/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Schema } from 'mongoose';

export const extractAllModelNamesAndRefPaths = (
  schema: Schema,
): { modelName: string; refPath: string }[] => {
  const result: { modelName: string; refPath: string }[] = [];

  function traverseSchema(_schema: Schema, pathPrefix = ''): void {
    _schema.eachPath((path, schemaType) => {
      const fullPath = pathPrefix ? `${pathPrefix}.${path}` : path;

      if (schemaType.options && schemaType.options.ref) {
        result.push({ modelName: schemaType.options.ref as string, refPath: fullPath });
      }

      if (schemaType.schema) {
        traverseSchema(schemaType.schema, fullPath);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (schemaType.caster && schemaType.caster.options && schemaType.caster.options.ref) {
        result.push({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          modelName: schemaType.caster.options.ref,
          refPath: fullPath,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
      } else if (schemaType.caster && schemaType.caster.schema) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        traverseSchema(schemaType.caster.schema as Schema, fullPath);
      }
    });
  }

  traverseSchema(schema);
  return result;
};

const isMongoId = (id: unknown): boolean =>
  !!id && id.toString().match(/^[0-9a-fA-F]{24}$/) !== null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRefIdsFromSchemaPath = (doc: any, schemaPath: string): string[] => {
  const refIds: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRefIdFromDoc(_doc: any): string[] | null {
    if (isMongoId(_doc)) {
      return [_doc as string];
    }
    if (Array.isArray(_doc) && _doc.every((refId) => isMongoId(refId))) {
      return _doc as string[];
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getRefIdsFromSchemaPathRec(_doc: any, _schemaPath: string): void {
    if (_schemaPath.includes('.')) {
      const [firstPart, ...rest] = _schemaPath.split('.');
      if (Array.isArray(_doc[firstPart])) {
        _doc[firstPart].forEach((subDoc) => {
          getRefIdsFromSchemaPathRec(subDoc, rest.join('.'));
        });
        return;
      }
      if (_doc[firstPart] && typeof _doc[firstPart] === 'object') {
        getRefIdsFromSchemaPathRec(_doc[firstPart], rest.join('.'));
        return;
      }
      return;
    }
    const refId = getRefIdFromDoc(_doc[_schemaPath]);
    if (!refId) {
      return;
    }
    refIds.push(...refId);
  }

  getRefIdsFromSchemaPathRec(doc, schemaPath);
  return refIds.map((id) => id.toString());
};
