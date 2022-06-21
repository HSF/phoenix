import { PrettySymbols } from '../../../src/helpers/pretty-symbols';

describe('PrettySymbols', () => {
  let prettySymbols: PrettySymbols;
  const mockSymbols: { [key: string]: string[] } = {
    θ: ['theta'],
    ϕ: ['phi'],
    pT: ['pt'],
    '𝛘2': ['chi2'],
    η: ['eta'],
    q: ['charge'],
    NDOF: ['ndof'],
    DOF: ['dof'],
    Energy: ['energy'],
    ET: ['et'],
    '|p|': ['momentum', 'mom'],
  };
  const mockGetPrettySymbol = jest.fn();
  const mockGetPrettyParams = jest.fn();

  beforeEach(() => {
    prettySymbols = new PrettySymbols();
    PrettySymbols.getPrettySymbol = mockGetPrettySymbol;
    PrettySymbols.getPrettyParams = mockGetPrettyParams;
  });

  test('should create an instance', () => {
    expect(prettySymbols).toBeTruthy();
  });

  test('get pretty symbol for a parameter', () => {
    const expected: string[] = ['theta'];
    mockGetPrettySymbol.mockReturnValue(expected);
    const actual: string = PrettySymbols.getPrettySymbol('θ');
    expect(actual).toEqual(expected);
    expect(mockGetPrettySymbol).toHaveBeenCalled();
  });

  test('get pretty printed parameters of an object', () => {
    const expected: { [key: string]: string[] } = PrettySymbols.symbols;
    mockGetPrettyParams.mockReturnValue(expected);
    const actual: { [key: string]: string[] } = PrettySymbols.getPrettyParams({
      θ: ['theta'],
      ϕ: ['phi'],
      pT: ['pt'],
      '𝛘2': ['chi2'],
      η: ['eta'],
      q: ['charge'],
      NDOF: ['ndof'],
      DOF: ['dof'],
      Energy: ['energy'],
      ET: ['et'],
      '|p|': ['momentum', 'mom'],
    });
    expect(actual).toBe(expected);
    expect(mockGetPrettyParams).toHaveBeenCalled();
  });
});
