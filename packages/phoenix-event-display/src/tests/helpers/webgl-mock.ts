import THREE from 'three';

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'),
      setSize: jest.fn(),
      render: jest.fn(),
      getSize: jest.fn().mockReturnValue({ width: 100, height: 100 }),
      getPixelRatio: jest.fn(),
    }),
  };
});

export default THREE;
