import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectStore } from '../src/store/objectStore.js';
import { TypedObject } from '../src/types/core.js';

const FIXED_CREATED_AT = '2024-01-01T00:00:00.000Z';

describe('ObjectStore', () => {
  let store: ObjectStore;

  beforeEach(() => {
    store = new ObjectStore();
  });

  it('should add and retrieve an object', () => {
    const obj: TypedObject = {
      objectId: 'obj1',
      typeName: 'PERSON_NAME',
      value: 'John Smith',
      producedBy: 'manual',
      sourceObjectIds: [],
      createdAt: FIXED_CREATED_AT,
    };
    store.add(obj);
    expect(store.get('obj1')).toEqual(obj);
  });

  it('should find objects by type', () => {
    const obj1: TypedObject = {
      objectId: 'obj1',
      typeName: 'PERSON_NAME',
      value: 'John Smith',
      producedBy: 'manual',
      sourceObjectIds: [],
      createdAt: FIXED_CREATED_AT,
    };
    const obj2: TypedObject = {
      objectId: 'obj2',
      typeName: 'CUSTOMER_ID',
      value: 'cust1',
      producedBy: 'manual',
      sourceObjectIds: [],
      createdAt: FIXED_CREATED_AT,
    };
    store.addMany([obj1, obj2]);
    expect(store.findByType('PERSON_NAME')).toEqual([obj1]);
  });

  it('should find objects by value', () => {
    const obj1: TypedObject = {
      objectId: 'obj1',
      typeName: 'PERSON_NAME',
      value: 'John Smith',
      producedBy: 'manual',
      sourceObjectIds: [],
      createdAt: FIXED_CREATED_AT,
    };
    store.add(obj1);
    expect(store.findByValue('PERSON_NAME', 'John Smith')).toEqual([obj1]);
    expect(store.findByValue('PERSON_NAME', 'Jane Doe')).toEqual([]);
  });
});
