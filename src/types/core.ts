export type TypeName =
  | 'PERSON_NAME'
  | 'CUSTOMER_ID'
  | 'PHONE_NUMBER'
  | 'MESSAGE_TEXT'
  | 'TEXT_MESSAGE_ID';

export interface TypedObject<T = unknown> {
  objectId: string;
  typeName: TypeName;
  value: T;
  producedBy: string;
  sourceObjectIds: string[];
  createdAt: string;
}

export type State =
  | 'START'
  | 'CUSTOMER_IDENTIFIED'
  | 'PHONE_RESOLVED'
  | 'DONE';
