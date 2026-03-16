import { TypedObject, TypeName } from '../types/core.js';

export class ObjectStore {
  private byId = new Map<string, TypedObject>();

  add(object: TypedObject): void {
    this.byId.set(object.objectId, object);
  }

  addMany(objects: TypedObject[]): void {
    for (const obj of objects) this.add(obj);
  }

  get(objectId: string): TypedObject | undefined {
    return this.byId.get(objectId);
  }

  findByType(typeName: TypeName): TypedObject[] {
    return [...this.byId.values()].filter((o) => o.typeName === typeName);
  }

  findByValue(typeName: TypeName, value: unknown): TypedObject[] {
    return [...this.byId.values()].filter(
      (o) => o.typeName === typeName && o.value === value,
    );
  }
}
