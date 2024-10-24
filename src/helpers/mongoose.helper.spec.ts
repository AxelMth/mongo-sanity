import { Schema, Types } from 'mongoose';
import { extractAllModelNamesAndRefPaths, getRefIdsFromSchemaPath } from './mongoose.helper';

describe('mongoose.helper', () => {
  describe('extractAllModelNamesAndRefPaths', () => {
    it('should extract model names and ref paths from schema', () => {
      const schema = new Schema({
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        nested: {
          subDoc: {
            type: new Schema({
              nestedAuthor: { type: Schema.Types.ObjectId, ref: 'User' },
            }),
          },
        },
      });

      const result = extractAllModelNamesAndRefPaths(schema);
      expect(result).toEqual([
        { modelName: 'User', refPath: 'author' },
        { modelName: 'Comment', refPath: 'comments' },
        { modelName: 'User', refPath: 'nested.subDoc.nestedAuthor' },
      ]);
    });
  });

  describe('getRefIdsFromSchemaPath', () => {
    it('should get reference IDs from document based on schema path', () => {
      const doc = {
        author: new Types.ObjectId(),
        comments: [new Types.ObjectId(), new Types.ObjectId()],
        nested: {
          subDoc: {
            nestedAuthor: new Types.ObjectId(),
          },
        },
      };

      const refIds = getRefIdsFromSchemaPath(doc, 'author');
      expect(refIds).toEqual([doc.author.toString()]);

      const commentRefIds = getRefIdsFromSchemaPath(doc, 'comments');
      expect(commentRefIds).toEqual(doc.comments.map((id) => id.toString()));

      const nestedAuthorRefIds = getRefIdsFromSchemaPath(doc, 'nested.subDoc.nestedAuthor');
      expect(nestedAuthorRefIds).toEqual([doc.nested.subDoc.nestedAuthor.toString()]);
    });

    it('should return an empty array if no reference IDs are found', () => {
      const doc = {
        author: null,
        comments: [],
        nested: {
          subDoc: {
            nestedAuthor: null,
          },
        },
      };

      const refIds = getRefIdsFromSchemaPath(doc, 'author');
      expect(refIds).toEqual([]);

      const commentRefIds = getRefIdsFromSchemaPath(doc, 'comments');
      expect(commentRefIds).toEqual([]);

      const nestedAuthorRefIds = getRefIdsFromSchemaPath(doc, 'nested.subDoc.nestedAuthor');
      expect(nestedAuthorRefIds).toEqual([]);
    });
  });
});
