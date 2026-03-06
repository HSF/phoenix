/** A generic 3 dimensional covariance matrix with values stored in lower triangular form */
export type CovMatrix3f = {
  values: number[]; // the covariance matrix values
};

/** A generic 4 dimensional covariance matrix with values stored in lower triangular form */
export type CovMatrix4f = {
  values: number[]; // the covariance matrix values
};

/** A generic 6 dimensional covariance matrix with values stored in lower triangular form */
export type CovMatrix6f = {
  values: number[]; // the covariance matrix values
};

export type Vector2f = {
  a: number;
  b: number;
};

export type Vector2i = {
  a: number;
  b: number;
};

export type Vector3f = {
  x: number;
  y: number;
  z: number;
};

export type Vector3d = {
  x: number;
  y: number;
  z: number;
};

export type ObjectID = {
  collectionID: number;
  index: number;
};
