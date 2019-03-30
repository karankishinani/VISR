from fingerprint import Fingerprinter, get_fingerprint, get_fingerprint_sorted
import pandas as pd
import numpy as np
import sys

if __name__ == '__main__':
    input_file = sys.argv[0]
    output_file = sys.arv[1]
    include_df = False if len(sys.argv) < 3 else sys.argv.lower() == "true"

    df = pd.read_csv(input_file, sep="\n", engine="python", error_bad_lines=False)
    series = df.ix[:,0].map(get_fingerprint)

    if include_df:
        pd.concat((df, series), axis=1).to_csv(output_file)
    else:
        series = series[series.str.len() > 2]
        pd.DataFrame(series).to_csv(output_file)


