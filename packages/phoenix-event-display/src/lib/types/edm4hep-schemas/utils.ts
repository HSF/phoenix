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

/** A generic 2 dimensional vector with float values */
export type Vector2f = {
  a: number;
  b: number;
};

/** A generic 2 dimensional vector with integer values */
export type Vector2i = {
  a: number;
  b: number;
};

/** A generic 3 dimensional vector with float values */
export type Vector3f = {
  x: number;
  y: number;
  z: number;
};

/** A generic 3 dimensional vector with double values */
export type Vector3d = {
  x: number;
  y: number;
  z: number;
};

/** A generic object ID with collection and index */
export type ObjectID = {
  collectionID: number;
  index: number;
};
