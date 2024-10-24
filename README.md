# @gads-citron/mongo-db-check

`@gads-citron/mongo-db-check` is a library designed to validate MongoDB documents against a predefined schema. It ensures that the documents stored in your MongoDB collections adhere to the specified structure and constraints.

## Features

- **Schema Validation**: Validate MongoDB documents against a predefined schema.
- **Custom Validators**: Define custom validation rules for specific fields.
- **Error Reporting**: Detailed error messages for validation failures.
- **Flexible Schema Definitions**: Support for various data types and nested schemas.

## Installation

To install the library, use npm or yarn:

```sh
npm install @gads-citron/mongo-db-check
```

## Usage

```typescript
import mongoose from 'mongoose';
import { connectToDatabaseAndValidateData } from '@gads-citron/mongo-db-check';

// Model initialization

await connectToDatabaseAndValidateData(mongoose);
```
