import { PrettySymbols } from '../../../src/helpers/pretty-symbols';

describe('PrettySymbols', () => {
  it('should return pretty symbol of a parameter', () => {
    expect(PrettySymbols.getPrettySymbol('theta')).toBe('θ');
    expect(PrettySymbols.getPrettySymbol('phi')).toBe('ϕ');
    expect(PrettySymbols.getPrettySymbol('pt')).toBe('pT');
    expect(PrettySymbols.getPrettySymbol('chi2')).toBe('𝛘2');
    expect(PrettySymbols.getPrettySymbol('eta')).toBe('η');
    expect(PrettySymbols.getPrettySymbol('charge')).toBe('q');
    expect(PrettySymbols.getPrettySymbol('ndof')).toBe('NDOF');
    expect(PrettySymbols.getPrettySymbol('dof')).toBe('DOF');
    expect(PrettySymbols.getPrettySymbol('energy')).toBe('Energy');
    expect(PrettySymbols.getPrettySymbol('et')).toBe('ET');
    expect(PrettySymbols.getPrettySymbol('momentum')).toBe('|p|');
  });

  it('should return pretty printed parameters of an object', () => {
    const params = {
      theta: 0,
      phi: 1,
      pt: 2,
      chi2: 3,
      eta: 4,
      charge: 5,
      ndof: 6,
      dof: 7,
      energy: 8,
      et: 9,
      momentum: 10,
    };

    const prettyParams = PrettySymbols.getPrettyParams(params);

    expect(prettyParams['θ']).toBe(0);
    expect(prettyParams['ϕ']).toBe(1);
    expect(prettyParams['pT']).toBe(2);
    expect(prettyParams['𝛘2']).toBe(3);
    expect(prettyParams['η']).toBe(4);
    expect(prettyParams['q']).toBe(5);
    expect(prettyParams['NDOF']).toBe(6);
    expect(prettyParams['DOF']).toBe(7);
    expect(prettyParams['Energy']).toBe(8);
    expect(prettyParams['ET']).toBe(9);
    expect(prettyParams['|p|']).toBe(10);
  });
});
