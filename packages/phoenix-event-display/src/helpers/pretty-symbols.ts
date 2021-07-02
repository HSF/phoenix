/**
 * Helper for pretty symbols functions.
 */
export class PrettySymbols {
  /** Pretty symbols for object params. */
  public static readonly symbols: { [key: string]: string[] } = {
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

  /**
   * Get pretty symbol of a parameter.
   * @param param Parameter of a physics object.
   */
  public static getPrettySymbol(param: string) {
    const prettySymbol = Object.keys(PrettySymbols.symbols).find((symbol) =>
      PrettySymbols.symbols[symbol].includes(param)
    );

    return prettySymbol ? prettySymbol : param;
  }

  /**
   * Get pretty printed parameters of an object.
   * @param params Object parameters to be pretty printed.
   * @returns New pretty printed parameterss.
   */
  public static getPrettyParams(params: { [key: string]: any }): {
    [key: string]: any;
  } {
    // Create a copy of the params so we don't overwrite the original object
    const paramsCopy = Object.assign({}, params);
    // Go through all the parameters
    for (const paramKey of Object.keys(paramsCopy)) {
      // Get the pretty printed symbol
      const symbol = PrettySymbols.getPrettySymbol(paramKey);
      // If we do get a symbol
      if (symbol !== paramKey) {
        // Add a parameter with pretty printed symbol
        paramsCopy[symbol] = paramsCopy[paramKey];
        delete paramsCopy[paramKey];
      }
    }

    // Delete 'pos' since it's too long and not needed
    delete paramsCopy['pos'];

    // Pretty print the dparams if any
    if (paramsCopy?.dparams) {
      const prettyDParams: { [key: string]: any } = {};

      prettyDParams['θ'] = paramsCopy.dparams[3];
      prettyDParams['ϕ'] = paramsCopy.dparams[2];
      prettyDParams['|p|'] = Math.abs(1 / paramsCopy.dparams[4]);
      prettyDParams['q'] = Math.sign(1 / paramsCopy.dparams[4]);
      prettyDParams['d0'] = paramsCopy.dparams[0];
      prettyDParams['z0'] = paramsCopy.dparams[1];

      delete paramsCopy.dparams;

      return { ...paramsCopy, ...prettyDParams };
    }

    return paramsCopy;
  }
}
