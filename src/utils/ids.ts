let objectCounter = 0;
let timestampCounter = 0;

export const nextObjectId = (prefix: string): string => {
  objectCounter += 1;
  return `${prefix}_${objectCounter}`;
};

export const nextCreatedAt = (): string => {
  timestampCounter += 1;
  return new Date(Date.UTC(2024, 0, 1, 0, 0, timestampCounter)).toISOString();
};
